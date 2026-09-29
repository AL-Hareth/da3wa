import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import ar from "./dictionaries/ar";
import en from "./dictionaries/en";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

const dictionaries = { ar, en };

/** Dashboard/marketing locale: explicit cookie, then Accept-Language, then Arabic. */
export const getLocale = cache(async (): Promise<Locale> => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language") ?? "";
  const first = accept.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  if (first === "en" && !/\bar\b/.test(accept)) return "en";
  return DEFAULT_LOCALE;
});

export function getDict(locale: Locale) {
  return dictionaries[locale];
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDict(locale) };
}
