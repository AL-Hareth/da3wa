import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";

describe("csv", () => {
  it("quotes cells with separators", () => {
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
  });

  it("neutralizes spreadsheet formulas but keeps phone numbers", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("+966 55 000 1111")).toBe("+966 55 000 1111");
  });

  it("prefixes a BOM for Excel and uses CRLF", () => {
    const out = toCsv(["الاسم"], [["خالد"], [null]]);
    expect(out.startsWith("﻿")).toBe(true);
    expect(out).toBe("﻿الاسم\r\nخالد\r\n\r\n");
  });
});
