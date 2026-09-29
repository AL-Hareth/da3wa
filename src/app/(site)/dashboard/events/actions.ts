"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getI18n } from "@/i18n/server";
import { BillingError, redeemCredit, startCheckout } from "@/lib/billing";
import { db, schema } from "@/lib/db";
import { computeEventInstants, isValidDate, isValidTime, isValidTimezone, DEFAULT_TIMEZONE } from "@/lib/datetime";
import { env } from "@/lib/env";
import { requireEvent } from "@/lib/events/queries";
import { duplicateEventRecord, isUniqueViolation, releaseCardImage, uniqueRandomSlug } from "@/lib/events/mutations";
import { publishIssues } from "@/lib/events/view";
import { deleteImage, ImageError, processAndStoreImage } from "@/lib/images";
import { entitlements } from "@/lib/plans";
import { isProductId } from "@/lib/products";
import { requireAppContext } from "@/lib/session";
import { normalizeSlug, validateSlug } from "@/lib/slug";
import { getTheme } from "@/lib/themes";

export type ActionState = { ok: true; message?: string; at: number } | { ok: false; error?: string; fieldErrors?: Record<string, string>; at: number } | null;

const ok = (message?: string): ActionState => ({ ok: true, message, at: Date.now() });
const fail = (error?: string, fieldErrors?: Record<string, string>): ActionState => ({ ok: false, error, fieldErrors, at: Date.now() });

const EVENT_TYPES = ["wedding", "engagement", "birthday", "graduation", "henna", "corporate", "custom"] as const;
const DEFAULT_TITLES: Record<(typeof EVENT_TYPES)[number], { ar: string; en: string }> = {
  wedding: { ar: "حفل زفاف", en: "Wedding Celebration" },
  engagement: { ar: "حفل خطوبة", en: "Engagement Party" },
  birthday: { ar: "حفل عيد ميلاد", en: "Birthday Party" },
  graduation: { ar: "حفل تخرّج", en: "Graduation Party" },
  henna: { ar: "ليلة الحنّاء", en: "Henna Night" },
  corporate: { ar: "فعالية", en: "Event" },
  custom: { ar: "مناسبة", en: "Celebration" },
};

/* -------------------------------------------------------------------------- */
/*                                   Create                                   */
/* -------------------------------------------------------------------------- */

const createInput = z.object({
  type: z.enum(EVENT_TYPES),
  designMode: z.enum(["upload", "template"]),
  clientName: z.string().trim().max(120).optional(),
  timezone: z.string().optional(),
});

export async function createEventAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { user, workspace } = await requireAppContext();
  const parsed = createInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail();
  const { type, designMode, clientName, timezone } = parsed.data;
  const lang = user.locale === "en" ? "en" : "ar";

  const [ev] = await db
    .insert(schema.event)
    .values({
      workspaceId: workspace.id,
      createdById: user.id,
      type,
      designMode,
      clientName: clientName || null,
      slug: await uniqueRandomSlug(),
      languageMode: lang,
      titleAr: DEFAULT_TITLES[type].ar,
      titleEn: DEFAULT_TITLES[type].en,
      timezone: timezone && isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE,
    })
    .returning({ id: schema.event.id });
  redirect(`/dashboard/events/${ev.id}/edit`);
}

/* -------------------------------------------------------------------------- */
/*                                    Save                                    */
/* -------------------------------------------------------------------------- */

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);
const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");
const intOrNull = (min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v || v.trim() === "") return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: "range" });
        return z.NEVER;
      }
      return n;
    });

const saveInput = z.object({
  clientName: text(120),
  titleAr: text(160),
  titleEn: text(160),
  hostNamesAr: text(200),
  hostNamesEn: text(200),
  greetingAr: text(200),
  greetingEn: text(200),
  eventDate: text(10),
  startTime: text(5),
  endTime: text(5),
  timezone: z.string().trim().default(DEFAULT_TIMEZONE),
  showHijriDate: checkbox,
  showCountdown: checkbox,
  venueNameAr: text(200),
  venueNameEn: text(200),
  venueAddressAr: text(400),
  venueAddressEn: text(400),
  mapsUrl: text(1000),
  dressCodeAr: text(200),
  dressCodeEn: text(200),
  notesAr: text(2000),
  notesEn: text(2000),
  contactPhone: text(32),
  shareMessage: text(600),
  themeId: z.string().default("ivory-gold"),
  designMode: z.enum(["upload", "template"]),
  languageMode: z.enum(["ar", "en", "bilingual"]),
  rsvpEnabled: checkbox,
  rsvpDeadline: text(10),
  rsvpMaxPartySize: intOrNull(1, 30),
  rsvpAskPhone: checkbox,
  expectedInvites: intOrNull(0, 100000),
  slug: z.string().optional(),
  visibility: z.enum(["public", "private"]).default("public"),
  accessPin: text(8),
});

function isHttpsUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function saveEventAction(eventId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { event } = await requireEvent(eventId);
  const { t } = await getI18n();
  const e = t.editor.errors;
  const parsed = saveInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = e.generic;
    return fail(e.generic, fieldErrors);
  }
  const d = parsed.data;
  const ent = entitlements(event.tier, { freePublishEnabled: env().FREE_PUBLISH_ENABLED });
  const fieldErrors: Record<string, string> = {};

  if (d.eventDate && !isValidDate(d.eventDate)) fieldErrors.eventDate = e.date;
  if (d.rsvpDeadline && !isValidDate(d.rsvpDeadline)) fieldErrors.rsvpDeadline = e.date;
  if (d.startTime && !isValidTime(d.startTime)) fieldErrors.startTime = e.time;
  if (d.endTime && !isValidTime(d.endTime)) fieldErrors.endTime = e.time;
  if (!isValidTimezone(d.timezone)) fieldErrors.timezone = e.generic;
  if (d.mapsUrl && !isHttpsUrl(d.mapsUrl)) fieldErrors.mapsUrl = t.editor.venue.mapsUrlInvalid;
  if (d.contactPhone && !/^[+\d][\d\s()-]{4,}$/.test(d.contactPhone)) fieldErrors.contactPhone = e.generic;

  const theme = getTheme(d.themeId);
  if (theme.id !== d.themeId) fieldErrors.themeId = e.generic;
  else if (!theme.free && !ent.allThemes && theme.id !== event.themeId) fieldErrors.themeId = e.locked;

  if (d.languageMode === "bilingual" && !ent.bilingual) fieldErrors.languageMode = e.locked;

  let accessPin = event.accessPin;
  if (d.visibility === "private") {
    if (!ent.pinProtection) fieldErrors.visibility = e.locked;
    else if (!d.accessPin || !/^\d{4,8}$/.test(d.accessPin)) fieldErrors.accessPin = e.pin;
    else accessPin = d.accessPin;
  }

  let slug = event.slug;
  if (d.slug !== undefined) {
    const next = normalizeSlug(d.slug);
    if (next !== event.slug) {
      if (!ent.customSlug) fieldErrors.slug = e.locked;
      else {
        const err = validateSlug(next);
        if (err) fieldErrors.slug = e.slug[err];
        else slug = next;
      }
    }
  }

  if (Object.keys(fieldErrors).length) return fail(e.generic, fieldErrors);

  const timezone = d.timezone;
  const { startsAt, endsAt } = computeEventInstants({ eventDate: d.eventDate, startTime: d.startTime, endTime: d.endTime, timezone });

  try {
    await db
      .update(schema.event)
      .set({
        clientName: d.clientName,
        titleAr: d.titleAr,
        titleEn: d.titleEn,
        hostNamesAr: d.hostNamesAr,
        hostNamesEn: d.hostNamesEn,
        greetingAr: d.greetingAr,
        greetingEn: d.greetingEn,
        eventDate: d.eventDate,
        startTime: d.startTime,
        endTime: d.endTime,
        timezone,
        startsAt,
        endsAt,
        showHijriDate: d.showHijriDate,
        showCountdown: d.showCountdown,
        venueNameAr: d.venueNameAr,
        venueNameEn: d.venueNameEn,
        venueAddressAr: d.venueAddressAr,
        venueAddressEn: d.venueAddressEn,
        mapsUrl: d.mapsUrl,
        dressCodeAr: d.dressCodeAr,
        dressCodeEn: d.dressCodeEn,
        notesAr: d.notesAr,
        notesEn: d.notesEn,
        contactPhone: d.contactPhone,
        shareMessage: d.shareMessage,
        themeId: theme.id,
        designMode: d.designMode,
        languageMode: d.languageMode,
        rsvpEnabled: d.rsvpEnabled,
        rsvpDeadline: d.rsvpDeadline,
        rsvpMaxPartySize: d.rsvpMaxPartySize ?? 5,
        rsvpAskPhone: d.rsvpAskPhone,
        expectedInvites: d.expectedInvites,
        slug,
        visibility: d.visibility,
        accessPin: d.visibility === "private" ? accessPin : event.accessPin,
      })
      .where(eq(schema.event.id, event.id));
  } catch (err) {
    if (isUniqueViolation(err)) return fail(e.generic, { slug: e.slug.taken });
    throw err;
  }
  refresh();
  return ok(t.common.saved);
}

/* -------------------------------------------------------------------------- */
/*                                Card image                                  */
/* -------------------------------------------------------------------------- */

export async function uploadCardImageAction(eventId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { event } = await requireEvent(eventId);
  const { t } = await getI18n();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail(t.editor.errors.image.corrupt);
  try {
    const asset = await processAndStoreImage(file, `events/${event.id}`);
    await db.update(schema.event).set({ cardImage: asset, designMode: "upload" }).where(eq(schema.event.id, event.id));
    await releaseCardImage(event.cardImage, event.id);
  } catch (err) {
    if (err instanceof ImageError) return fail(t.editor.errors.image[err.code]);
    console.error("[upload] card image failed", err);
    return fail(t.common.somethingWentWrong);
  }
  refresh();
  return ok();
}

export async function removeCardImageAction(eventId: string) {
  const { event } = await requireEvent(eventId);
  await db.update(schema.event).set({ cardImage: null, designMode: "template" }).where(eq(schema.event.id, event.id));
  await releaseCardImage(event.cardImage, event.id);
  refresh();
}

/* -------------------------------------------------------------------------- */
/*                                 Lifecycle                                  */
/* -------------------------------------------------------------------------- */

export async function publishEventAction(eventId: string): Promise<ActionState> {
  const { event } = await requireEvent(eventId);
  const { t } = await getI18n();
  const ent = entitlements(event.tier, { freePublishEnabled: env().FREE_PUBLISH_ENABLED });
  if (!ent.publish) return fail(t.overview.publishNeedsUpgrade);
  if (publishIssues(event).length) return fail(t.overview.publishMissing);
  const now = new Date();
  await db
    .update(schema.event)
    .set({ status: "published", publishedAt: now, firstPublishedAt: event.firstPublishedAt ?? now, archivedAt: null })
    .where(eq(schema.event.id, event.id));
  refresh();
  return ok();
}

export async function setEventStatusAction(eventId: string, status: "draft" | "archived") {
  const { event } = await requireEvent(eventId);
  await db
    .update(schema.event)
    .set({ status, archivedAt: status === "archived" ? new Date() : null })
    .where(eq(schema.event.id, event.id));
  refresh();
}

export async function duplicateEventAction(eventId: string) {
  const { event, user } = await requireEvent(eventId);
  const id = await duplicateEventRecord(event, user.id);
  redirect(`/dashboard/events/${id}/edit`);
}

export async function deleteEventAction(eventId: string) {
  const { event } = await requireEvent(eventId);
  const photos = await db.query.eventPhoto.findMany({ where: eq(schema.eventPhoto.eventId, event.id) });
  await db.delete(schema.event).where(eq(schema.event.id, event.id));
  await releaseCardImage(event.cardImage, event.id);
  await Promise.all(photos.map((p) => deleteImage(p.image)));
  redirect("/dashboard");
}

/* -------------------------------------------------------------------------- */
/*                               Update banner                                */
/* -------------------------------------------------------------------------- */

const bannerInput = z.object({
  bannerType: z.enum(["announcement", "time_change", "venue_change"]),
  bannerTextAr: text(300),
  bannerTextEn: text(300),
});

export async function setBannerAction(eventId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { event } = await requireEvent(eventId);
  const { t } = await getI18n();
  if (!entitlements(event.tier).updateBanner) return fail(t.editor.errors.locked);
  const parsed = bannerInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success || (!parsed.data.bannerTextAr && !parsed.data.bannerTextEn)) return fail(t.editor.errors.generic);
  await db
    .update(schema.event)
    .set({ ...parsed.data, bannerUpdatedAt: new Date() })
    .where(eq(schema.event.id, event.id));
  refresh();
  return ok(t.common.saved);
}

export async function clearBannerAction(eventId: string) {
  const { event } = await requireEvent(eventId);
  await db
    .update(schema.event)
    .set({ bannerType: null, bannerTextAr: null, bannerTextEn: null, bannerUpdatedAt: null })
    .where(eq(schema.event.id, event.id));
  refresh();
}

/* -------------------------------------------------------------------------- */
/*                                   RSVPs                                    */
/* -------------------------------------------------------------------------- */

export async function deleteRsvpAction(eventId: string, rsvpId: string) {
  const { event } = await requireEvent(eventId);
  await db.delete(schema.rsvp).where(and(eq(schema.rsvp.id, rsvpId), eq(schema.rsvp.eventId, event.id)));
  refresh();
}

/* -------------------------------------------------------------------------- */
/*                                  Upgrades                                  */
/* -------------------------------------------------------------------------- */

export async function redeemCreditAction(eventId: string, kind: "standard" | "premium"): Promise<ActionState> {
  const { event, workspace, user } = await requireEvent(eventId);
  const { t } = await getI18n();
  try {
    await redeemCredit({ workspaceId: workspace.id, eventId: event.id, kind, actorId: user.id });
  } catch (err) {
    if (err instanceof BillingError) return fail(t.billing.errors[err.code]);
    throw err;
  }
  refresh();
  return ok(t.overview.paymentSuccess);
}

export async function checkoutAction(productId: string, eventId: string | null): Promise<ActionState> {
  const { user, workspace } = await requireAppContext();
  const { t, locale } = await getI18n();
  if (!isProductId(productId)) return fail(t.billing.errors.invalid_product);
  let url: string;
  try {
    url = await startCheckout({ workspaceId: workspace.id, user, productId, eventId, locale });
  } catch (err) {
    if (err instanceof BillingError) return fail(t.billing.errors[err.code]);
    throw err;
  }
  redirect(url);
}

