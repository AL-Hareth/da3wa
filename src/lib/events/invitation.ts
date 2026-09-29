import "server-only";
import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import type { InvitationProps } from "@/components/invite/invitation";
import { mapsHref } from "@/components/invite/invitation";
import { db, schema } from "../db";
import type { Event } from "../db/schema";
import { todayIn } from "../datetime";
import { appUrl, env } from "../env";
import { googleCalendarUrl } from "../ics";
import { imageUrls } from "../images";
import { pinCookieName, pinCookieValue, rsvpCookieName } from "../invite-cookies";
import { entitlements } from "../plans";
import { safeEqual, sha256 } from "../request";
import { eventPublicUrl } from "../urls";
import { rsvpCount } from "./queries";
import { availableLangs, displayTitle, pick, resolveLang, rsvpOpen, type Lang } from "./view";

export function calendarDetails(event: Event, lang: Lang) {
  if (!event.startsAt) return null;
  const location = [pick(event, "venueName", lang), pick(event, "venueAddress", lang)].filter(Boolean).join(", ");
  return {
    uid: `${event.id}@da3wa`,
    title: [pick(event, "title", lang), pick(event, "hostNames", lang)].filter(Boolean).join(" — ") || "Invitation",
    start: event.startsAt,
    end: event.endsAt,
    location: location || null,
    description: [pick(event, "notes", lang), mapsHref(event, lang)].filter(Boolean).join("\n\n") || null,
    url: eventPublicUrl(event.slug),
  };
}

/** Whether the visitor may see a private event's content. */
export async function hasPageAccess(event: Event): Promise<boolean> {
  if (event.visibility !== "private" || !event.accessPin || !entitlements(event.tier).pinProtection) return true;
  const value = (await cookies()).get(pinCookieName(event.id))?.value;
  return !!value && safeEqual(value, pinCookieValue(event.id, event.accessPin));
}

async function existingRsvp(event: Event) {
  const raw = (await cookies()).get(rsvpCookieName(event.id))?.value;
  if (!raw) return null;
  const [id, token] = raw.split(".");
  if (!id || !token) return null;
  const row = await db.query.rsvp.findFirst({ where: eq(schema.rsvp.id, id) });
  if (!row || row.eventId !== event.id || !safeEqual(row.editTokenHash, sha256(token))) return null;
  return { fullName: row.fullName, status: row.status, partySize: row.partySize, phone: row.phone, note: row.note };
}

export async function buildInvitationProps(event: Event, opts: { requestedLang?: string | null; mode: "public" | "preview" }): Promise<InvitationProps> {
  const ent = entitlements(event.tier);
  const lang = resolveLang(event, opts.requestedLang);
  const langs = availableLangs(event);
  const base = opts.mode === "public" ? `/${event.slug}` : `/preview/${event.id}`;

  const [photos, existing, responses] = await Promise.all([
    ent.gallery
      ? db.query.eventPhoto.findMany({ where: eq(schema.eventPhoto.eventId, event.id), orderBy: [asc(schema.eventPhoto.sortOrder), asc(schema.eventPhoto.createdAt)] })
      : Promise.resolve([]),
    opts.mode === "public" ? existingRsvp(event) : Promise.resolve(null),
    ent.rsvpLimit !== null ? rsvpCount(event.id) : Promise.resolve(0),
  ]);

  const cal = calendarDetails(event, lang);
  return {
    event,
    lang,
    langs,
    mode: opts.mode,
    pageUrl: eventPublicUrl(event.slug),
    langHref: Object.fromEntries(langs.map((l) => [l, `${base}?lang=${l}`])),
    calendar: cal ? { ics: `/${event.slug}/calendar.ics?lang=${lang}`, google: googleCalendarUrl(cal) } : null,
    cardImage: event.cardImage ? imageUrls(event.cardImage) : null,
    photos: photos.map((p) => imageUrls(p.image)),
    rsvp: {
      show: event.rsvpEnabled,
      open: rsvpOpen(event, todayIn(event.timezone)),
      full: ent.rsvpLimit !== null && responses >= ent.rsvpLimit,
      existing,
    },
    banner: ent.updateBanner,
    branding: ent.branding,
    appUrl: appUrl("/"),
    turnstileSiteKey: env().NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  };
}

export function invitationTitle(event: Event, lang: Lang) {
  return displayTitle(event, lang) ?? pick(event, "title", lang) ?? "";
}
