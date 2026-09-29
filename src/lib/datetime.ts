import { fromZonedTime } from "date-fns-tz";

export const DEFAULT_TIMEZONE = "Asia/Riyadh";

/** Common time zones for the primary markets, shown first in pickers. */
export const COMMON_TIMEZONES = [
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Kuwait",
  "Asia/Qatar",
  "Asia/Bahrain",
  "Asia/Muscat",
  "Asia/Amman",
  "Asia/Baghdad",
  "Asia/Beirut",
  "Asia/Damascus",
  "Asia/Jerusalem",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Tunis",
  "Africa/Algiers",
  "Europe/Istanbul",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Toronto",
  "Australia/Sydney",
];

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTime(t: string) {
  return TIME_RE.test(t);
}
export function isValidDate(d: string) {
  return DATE_RE.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));
}

/** Converts a wall-clock date + time in `timezone` into an absolute instant. */
export function zonedToUtc(date: string, time: string, timezone: string): Date {
  return fromZonedTime(`${date}T${time}:00`, timezone);
}

/**
 * Derives absolute start/end instants for an event. An end time earlier than the
 * start time is treated as past midnight (e.g. 20:00 → 01:00).
 */
export function computeEventInstants(input: {
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
}): { startsAt: Date | null; endsAt: Date | null } {
  const { eventDate, startTime, endTime, timezone } = input;
  if (!eventDate || !isValidDate(eventDate)) return { startsAt: null, endsAt: null };
  const startsAt = zonedToUtc(eventDate, startTime && isValidTime(startTime) ? startTime : "00:00", timezone);
  let endsAt: Date | null = null;
  if (endTime && isValidTime(endTime)) {
    endsAt = zonedToUtc(eventDate, endTime, timezone);
    if (endsAt <= startsAt) endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
  }
  return { startsAt, endsAt };
}

type Lang = "ar" | "en";

const locales: Record<Lang, string> = { ar: "ar-u-ca-gregory-nu-latn", en: "en-GB" };

export function formatEventDate(date: string, lang: Lang): string {
  // Dates are wall-clock values; format them at noon UTC so no timezone shift can change the day.
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat(locales[lang], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function formatHijriDate(date: string, lang: Lang): string {
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-ca-islamic-umalqura-nu-latn" : "en-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function formatTime(time: string, lang: Lang): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(Date.UTC(2000, 0, 1, h, m));
  return new Intl.DateTimeFormat(locales[lang], { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" }).format(d);
}

export function formatDateTime(d: Date, lang: Lang, timezone?: string) {
  return new Intl.DateTimeFormat(locales[lang], { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(d);
}

/** Today's date (YYYY-MM-DD) in a given zone. */
export function todayIn(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
