"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { z } from "zod";
import { getDict, getI18n } from "@/i18n/server";
import { LOCALE_COOKIE } from "@/i18n/config";
import { db, schema } from "@/lib/db";
import { requireAppContext } from "@/lib/session";

const input = z.object({
  name: z.string().trim().min(1).max(80),
  accountType: z.enum(["individual", "designer", "planner"]),
  locale: z.enum(["ar", "en"]),
});

export async function updateProfileAction(_: unknown, formData: FormData): Promise<{ ok: boolean; message?: string; error?: string; at: number }> {
  const { user, workspace } = await requireAppContext();
  const parsed = input.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { t } = await getI18n();
    return { ok: false, error: t.editor.errors.generic, at: Date.now() };
  }
  const { name, accountType, locale } = parsed.data;
  await db.update(schema.user).set({ name, accountType, locale }).where(eq(schema.user.id, user.id));
  await db
    .update(schema.workspace)
    .set({ kind: accountType === "individual" ? "personal" : "studio" })
    .where(eq(schema.workspace.id, workspace.id));
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  refresh();
  return { ok: true, message: getDict(locale).common.saved, at: Date.now() };
}
