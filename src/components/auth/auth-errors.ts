import type { Dict } from "@/i18n/dictionaries/ar";

export function authErrorMessage(t: Dict, error: { code?: string; status?: number } | null | undefined): string {
  if (!error) return t.auth.errors.generic;
  if (error.status === 429) return t.auth.errors.rateLimited;
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
    case "INVALID_EMAIL":
      return t.auth.errors.invalid;
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return t.auth.errors.exists;
    case "PASSWORD_TOO_SHORT":
      return t.auth.errors.weak;
    case "EMAIL_NOT_VERIFIED":
      return t.auth.errors.unverified;
    default:
      return t.auth.errors.generic;
  }
}
