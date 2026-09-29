/** Minimal RFC 5545 calendar file for a single event. */

const pad = (n: number) => String(n).padStart(2, "0");

export function toIcsUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

export function escapeIcsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** Lines longer than 75 octets must be folded (continuation lines start with a space). */
export function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length;
    const limit = out.length === 0 ? 75 : 74;
    if (currentBytes + len > limit) {
      out.push(current);
      current = "";
      currentBytes = 0;
    }
    current += ch;
    currentBytes += len;
  }
  out.push(current);
  return out.join("\r\n ");
}

export type IcsInput = {
  uid: string;
  title: string;
  start: Date;
  end?: Date | null;
  location?: string | null;
  description?: string | null;
  url?: string | null;
  now?: Date;
};

export function buildIcs(e: IcsInput): string {
  const end = e.end ?? new Date(e.start.getTime() + 3 * 60 * 60 * 1000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Da3wa//Invitation//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${toIcsUtc(e.now ?? new Date())}`,
    `DTSTART:${toIcsUtc(e.start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(e.title)}`,
  ];
  if (e.location) lines.push(`LOCATION:${escapeIcsText(e.location)}`);
  if (e.description) lines.push(`DESCRIPTION:${escapeIcsText(e.description)}`);
  if (e.url) lines.push(`URL:${e.url}`);
  lines.push(
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(e.title)}`,
    "TRIGGER:-PT3H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Google Calendar "add event" template link, used as a fallback on Android. */
export function googleCalendarUrl(e: IcsInput): string {
  const end = e.end ?? new Date(e.start.getTime() + 3 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${toIcsUtc(e.start)}/${toIcsUtc(end)}`,
  });
  if (e.location) params.set("location", e.location);
  if (e.description || e.url) params.set("details", [e.description, e.url].filter(Boolean).join("\n\n"));
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
