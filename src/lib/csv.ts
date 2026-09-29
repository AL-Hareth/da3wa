/** Formula-injection-safe CSV (RFC 4180) with a UTF-8 BOM so Excel renders Arabic correctly. */

const FORMULA_PREFIX = /^[=+\-@\t\r]/;
// Phone numbers and plain numbers are safe and common ("+966 5x..."), so don't mangle them.
const SAFE_NUMERIC = /^[+-]?[\d\s().-]+$/;

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (FORMULA_PREFIX.test(s) && !SAFE_NUMERIC.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(csvCell).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
