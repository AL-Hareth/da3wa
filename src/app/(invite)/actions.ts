"use server";

import { randomBytes } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { refresh } from "next/cache";
import { z } from "zod";
import { fmt } from "@/i18n/config";
import { inviteStrings } from "@/i18n/invite";
import { db, schema } from "@/lib/db";
import { todayIn } from "@/lib/datetime";
import { rsvpOpen } from "@/lib/events/view";
import { entitlements } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpFrom, hashIp, safeEqual, sha256 } from "@/lib/request";
import { pinCookieName, pinCookieValue, rsvpCookieName } from "@/lib/invite-cookies";
import { verifyTurnstile } from "@/lib/turnstile";

export type RsvpState =
  | { ok: true; message: string; status: "attending" | "not_attending" | "maybe" }
  | { ok: false; error: string; field?: string }
  | null;

const rsvpInput = z.object({
  lang: z.enum(["ar", "en"]).default("ar"),
  fullName: z.string().trim().min(1).max(120),
  status: z.enum(["attending", "not_attending", "maybe"]),
  partySize: z.coerce.number().int().min(1).max(30).default(1),
  phone: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((v) => v || null),
  note: z
    .string()
    .trim()
    .max(600)
    .optional()
    .transform((v) => v || null),
});

async function loadPublishedEvent(eventId: string) {
  const ev = await db.query.event.findFirst({ where: eq(schema.event.id, eventId) });
  return ev && ev.status === "published" ? ev : null;
}

export async function submitRsvpAction(eventId: string, _: RsvpState, formData: FormData): Promise<RsvpState> {
  const lang = formData.get("lang") === "en" ? "en" : "ar";
  const s = inviteStrings[lang].rsvp;

  // Honeypot: real guests never see or fill this field.
  if (formData.get("website")) return { ok: false, error: s.errors.generic };

  const ev = await loadPublishedEvent(eventId);
  if (!ev) return { ok: false, error: s.errors.generic };
  if (!rsvpOpen(ev, todayIn(ev.timezone))) return { ok: false, error: s.closed };

  const h = await headers();
  const ip = clientIpFrom(h);
  const [perVisitor, perEvent] = await Promise.all([
    rateLimit(`rsvp:${ev.id}:${ip}`, 8, 60 * 60),
    rateLimit(`rsvp:${ev.id}`, 600, 60 * 60),
  ]);
  if (!perVisitor.ok || !perEvent.ok) return { ok: false, error: s.errors.rateLimited };

  if (!(await verifyTurnstile(formData.get("cf-turnstile-response")?.toString(), ip))) {
    return { ok: false, error: s.errors.captcha };
  }

  // Private events: the guest must have unlocked the page.
  const jar = await cookies();
  if (ev.visibility === "private" && entitlements(ev.tier).pinProtection && ev.accessPin) {
    const pin = jar.get(pinCookieName(ev.id))?.value;
    if (!pin || !safeEqual(pin, pinCookieValue(ev.id, ev.accessPin))) return { ok: false, error: s.errors.generic };
  }

  const parsed = rsvpInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    const error = field === "fullName" ? s.errors.name : field === "status" ? s.errors.status : field === "partySize" ? s.errors.party : s.errors.generic;
    return { ok: false, error, field };
  }
  const d = parsed.data;
  if (d.partySize > ev.rsvpMaxPartySize) return { ok: false, error: s.errors.party, field: "partySize" };
  const partySize = d.status === "not_attending" ? 0 : d.partySize;
  const phone = ev.rsvpAskPhone ? d.phone : null;

  // Returning guest: update their previous response instead of creating a duplicate.
  const cookieName = rsvpCookieName(ev.id);
  const existingCookie = jar.get(cookieName)?.value;
  if (existingCookie) {
    const [rsvpId, token] = existingCookie.split(".");
    if (rsvpId && token) {
      const [updated] = await db
        .update(schema.rsvp)
        .set({ fullName: d.fullName, status: d.status, partySize, phone, note: d.note })
        .where(and(eq(schema.rsvp.id, rsvpId), eq(schema.rsvp.eventId, ev.id), eq(schema.rsvp.editTokenHash, sha256(token))))
        .returning({ id: schema.rsvp.id });
      if (updated) return thanks(lang, d.status, d.fullName);
    }
  }

  const limit = entitlements(ev.tier).rsvpLimit;
  if (limit !== null) {
    const [{ n }] = await db.select({ n: count() }).from(schema.rsvp).where(eq(schema.rsvp.eventId, ev.id));
    if (n >= limit) return { ok: false, error: s.full };
  }

  const token = randomBytes(24).toString("base64url");
  const [created] = await db
    .insert(schema.rsvp)
    .values({
      eventId: ev.id,
      fullName: d.fullName,
      status: d.status,
      partySize,
      phone,
      note: d.note,
      editTokenHash: sha256(token),
      ipHash: hashIp(ip),
    })
    .returning({ id: schema.rsvp.id });

  jar.set(cookieName, `${created.id}.${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return thanks(lang, d.status, d.fullName);
}

function thanks(lang: "ar" | "en", status: "attending" | "not_attending" | "maybe", name: string): RsvpState {
  const s = inviteStrings[lang].rsvp;
  const firstName = name.split(/\s+/)[0] ?? name;
  const template = status === "attending" ? s.thanksAttending : status === "not_attending" ? s.thanksNotAttending : s.thanksMaybe;
  return { ok: true, status, message: fmt(template, { name: firstName }) };
}

export type PinState = { error: string } | null;

export async function unlockEventAction(eventId: string, _: PinState, formData: FormData): Promise<PinState> {
  const lang = formData.get("lang") === "en" ? "en" : "ar";
  const s = inviteStrings[lang].private;
  const ev = await loadPublishedEvent(eventId);
  if (!ev || !ev.accessPin) return { error: s.wrong };

  const ip = clientIpFrom(await headers());
  const limited = await rateLimit(`pin:${ev.id}:${ip}`, 10, 15 * 60);
  if (!limited.ok) return { error: s.rateLimited };

  const pin = String(formData.get("pin") ?? "").trim();
  if (!safeEqual(pin, ev.accessPin)) return { error: s.wrong };

  (await cookies()).set(pinCookieName(ev.id), pinCookieValue(ev.id, ev.accessPin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  refresh();
  return null;
}
