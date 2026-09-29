"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/session";

/** Switches the dashboard/marketing language and remembers it on the account. */
export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const session = await getSession();
  if (session) await db.update(schema.user).set({ locale }).where(eq(schema.user.id, session.user.id));
}
