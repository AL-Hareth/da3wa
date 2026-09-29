import { describe, expect, it } from "vitest";
import { computeEventInstants, formatEventDate, isValidTime, todayIn } from "@/lib/datetime";

describe("datetime", () => {
  it("converts wall-clock time in the event's zone to UTC", () => {
    const { startsAt, endsAt } = computeEventInstants({ eventDate: "2026-11-12", startTime: "20:00", endTime: "23:00", timezone: "Asia/Riyadh" });
    expect(startsAt?.toISOString()).toBe("2026-11-12T17:00:00.000Z");
    expect(endsAt?.toISOString()).toBe("2026-11-12T20:00:00.000Z");
  });

  it("rolls an end time past midnight to the next day", () => {
    const { endsAt } = computeEventInstants({ eventDate: "2026-11-12", startTime: "20:00", endTime: "01:00", timezone: "Asia/Dubai" });
    expect(endsAt?.toISOString()).toBe("2026-11-12T21:00:00.000Z");
  });

  it("returns nulls without a date", () => {
    expect(computeEventInstants({ eventDate: null, startTime: "20:00", endTime: null, timezone: "UTC" })).toEqual({ startsAt: null, endsAt: null });
  });

  it("formats dates in Arabic with Gregorian calendar", () => {
    const s = formatEventDate("2026-11-12", "ar");
    expect(s).toContain("نوفمبر");
    expect(s).toContain("2026");
  });

  it("validates times and computes today in a zone", () => {
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(todayIn("Asia/Riyadh", new Date("2026-01-01T22:00:00Z"))).toBe("2026-01-02");
  });
});
