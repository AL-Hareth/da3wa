import type { Event } from "../db/schema";
import { entitlements, pageExpiresAt, type Entitlements } from "../plans";

export type Lang = "ar" | "en";

/** Languages a guest can switch between on the public page. */
export function availableLangs(event: Pick<Event, "languageMode" | "tier">): Lang[] {
  const ent = entitlements(event.tier);
  if (event.languageMode === "bilingual") return ent.bilingual ? ["ar", "en"] : ["ar"];
  return [event.languageMode];
}

export function resolveLang(event: Pick<Event, "languageMode" | "tier">, requested: string | undefined | null): Lang {
  const langs = availableLangs(event);
  return langs.includes(requested as Lang) ? (requested as Lang) : langs[0];
}

/** Picks the field for the requested language, falling back to the other one. */
export function pick(event: Event, base: LocalizedField, lang: Lang): string | null {
  const ar = event[`${base}Ar`];
  const en = event[`${base}En`];
  const primary = lang === "ar" ? ar : en;
  const fallback = lang === "ar" ? en : ar;
  return (primary?.trim() || fallback?.trim() || null) as string | null;
}

export type LocalizedField = "title" | "hostNames" | "greeting" | "venueName" | "venueAddress" | "dressCode" | "notes" | "bannerText";

export function displayTitle(event: Event, lang: Lang): string | null {
  return pick(event, "hostNames", lang) ?? pick(event, "title", lang);
}

export type PublishIssue = "design" | "names" | "date";

export function publishIssues(event: Event): PublishIssue[] {
  const issues: PublishIssue[] = [];
  if (event.designMode === "upload" && !event.cardImage) issues.push("design");
  if (!event.hostNamesAr && !event.hostNamesEn && !event.titleAr && !event.titleEn) issues.push("names");
  if (!event.eventDate) issues.push("date");
  return issues;
}

export function isExpired(event: Event, now = new Date()): boolean {
  const expires = pageExpiresAt(event.tier, event.endsAt ?? event.startsAt);
  return !!expires && now > expires;
}

export function eventEntitlements(event: Pick<Event, "tier">, freePublishEnabled = false): Entitlements {
  return entitlements(event.tier, { freePublishEnabled });
}

export function rsvpOpen(event: Event, todayInZone: string): boolean {
  if (!event.rsvpEnabled) return false;
  if (event.rsvpDeadline && todayInZone > event.rsvpDeadline) return false;
  if (event.endsAt && new Date() > event.endsAt) return false;
  return true;
}
