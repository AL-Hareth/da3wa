import { randomId } from "./ids";

export const SLUG_MIN = 3;
export const SLUG_MAX = 48;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** Top-level paths that belong to the app and can never be event slugs. */
export const RESERVED_SLUGS = new Set([
  "about", "account", "admin", "api", "app", "assets", "auth", "billing", "blog", "contact",
  "dashboard", "designers", "docs", "e", "events", "faq", "favicon.ico", "forgot-password", "help",
  "home", "invite", "legal", "login", "logout", "manifest.webmanifest", "media", "new", "onboarding",
  "pricing", "privacy", "preview", "public", "register", "reset-password", "robots.txt", "settings",
  "signin", "signup", "sitemap.xml", "static", "status", "support", "templates", "terms", "verify",
  "www", "_next",
]);

export type SlugError = "too_short" | "too_long" | "invalid" | "reserved";

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateSlug(slug: string): SlugError | null {
  if (slug.length < SLUG_MIN) return "too_short";
  if (slug.length > SLUG_MAX) return "too_long";
  if (!SLUG_RE.test(slug)) return "invalid";
  if (RESERVED_SLUGS.has(slug)) return "reserved";
  return null;
}

/** Non-guessable slug for events without a custom slug (free tier / new drafts). */
export function randomSlug(): string {
  return `i-${randomId(8, "abcdefghjkmnpqrstuvwxyz23456789")}`;
}

/** Latin-only suggestion from English names, e.g. "Sarah & Omar" -> "sarah-and-omar". */
export function suggestSlug(namesEn: string | null | undefined): string | null {
  if (!namesEn) return null;
  const s = normalizeSlug(namesEn.replace(/&/g, " and "));
  return validateSlug(s) ? null : s;
}
