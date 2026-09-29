import { describe, expect, it } from "vitest";
import { buildIcs, escapeIcsText, foldLine, googleCalendarUrl, toIcsUtc } from "@/lib/ics";

describe("ics", () => {
  const start = new Date("2026-11-12T17:00:00Z");

  it("formats UTC timestamps", () => {
    expect(toIcsUtc(start)).toBe("20261112T170000Z");
  });

  it("escapes text", () => {
    expect(escapeIcsText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });

  it("folds long lines by octets without splitting characters", () => {
    const folded = foldLine("SUMMARY:" + "حفل زفاف سارة وعمر ".repeat(6));
    for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, "")).toBe("SUMMARY:" + "حفل زفاف سارة وعمر ".repeat(6));
  });

  it("builds a calendar with a default 3h duration", () => {
    const ics = buildIcs({ uid: "x@da3wa", title: "Wedding", start, location: "Riyadh", now: start });
    expect(ics).toContain("DTSTART:20261112T170000Z");
    expect(ics).toContain("DTEND:20261112T200000Z");
    expect(ics).toContain("LOCATION:Riyadh");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("builds a Google Calendar link", () => {
    const url = new URL(googleCalendarUrl({ uid: "x", title: "Wedding", start }));
    expect(url.searchParams.get("dates")).toBe("20261112T170000Z/20261112T200000Z");
  });
});
