import { describe, expect, it } from "vitest";
import { normalizeSlug, randomSlug, suggestSlug, validateSlug } from "@/lib/slug";

describe("slug", () => {
  it("normalizes user input", () => {
    expect(normalizeSlug("  Sarah & Omar_2026 ")).toBe("sarah-omar-2026");
    expect(normalizeSlug("--a---b--")).toBe("a-b");
    expect(normalizeSlug("سارة")).toBe("");
  });

  it("validates length, charset and reserved words", () => {
    expect(validateSlug("ab")).toBe("too_short");
    expect(validateSlug("a".repeat(49))).toBe("too_long");
    expect(validateSlug("-abc")).toBe("invalid");
    expect(validateSlug("dashboard")).toBe("reserved");
    expect(validateSlug("sarah-and-omar")).toBeNull();
  });

  it("suggests slugs from English names", () => {
    expect(suggestSlug("Sarah & Omar")).toBe("sarah-and-omar");
    expect(suggestSlug("سارة وعمر")).toBeNull();
  });

  it("generates valid random slugs", () => {
    for (let i = 0; i < 50; i++) expect(validateSlug(randomSlug())).toBeNull();
  });
});
