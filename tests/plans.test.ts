import { describe, expect, it } from "vitest";
import { entitlements, pageExpiresAt, requiredTierFor, tierAtLeast } from "@/lib/plans";
import { availableLangs, publishIssues, resolveLang } from "@/lib/events/view";
import type { Event } from "@/lib/db/schema";

describe("plans", () => {
  it("gates publishing on paid tiers unless free publishing is enabled", () => {
    expect(entitlements("free").publish).toBe(false);
    expect(entitlements("free", { freePublishEnabled: true }).publish).toBe(true);
    expect(entitlements("standard").publish).toBe(true);
  });

  it("maps features to the lowest tier that unlocks them", () => {
    expect(requiredTierFor("customSlug")).toBe("standard");
    expect(requiredTierFor("bilingual")).toBe("premium");
    expect(requiredTierFor("pinProtection")).toBe("premium");
    expect(requiredTierFor("branding")).toBe("standard");
    expect(tierAtLeast("premium", "standard")).toBe(true);
  });

  it("extends page lifetime by tier", () => {
    const end = new Date("2026-01-01T00:00:00Z");
    expect(pageExpiresAt("standard", end)?.toISOString()).toBe("2026-01-31T00:00:00.000Z");
    expect(pageExpiresAt("premium", null)).toBeNull();
  });
});

describe("event view helpers", () => {
  const base = { languageMode: "bilingual", tier: "standard" } as Pick<Event, "languageMode" | "tier">;

  it("only offers bilingual pages on premium", () => {
    expect(availableLangs(base)).toEqual(["ar"]);
    expect(availableLangs({ ...base, tier: "premium" })).toEqual(["ar", "en"]);
    expect(resolveLang({ ...base, tier: "premium" }, "en")).toBe("en");
    expect(resolveLang({ languageMode: "en", tier: "free" }, "ar")).toBe("en");
  });

  it("reports what's missing before publishing", () => {
    const ev = { designMode: "upload", cardImage: null, hostNamesAr: null, hostNamesEn: null, titleAr: null, titleEn: null, eventDate: null } as unknown as Event;
    expect(publishIssues(ev)).toEqual(["design", "names", "date"]);
  });
});
