"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LOCALE_COOKIE } from "@/i18n/config";
import { db, schema } from "@/lib/db";
import { requireAppContext } from "@/lib/session";

const input = z.object({
  name: z.string().trim().min(1).max(80),
  accountType: z.enum(["individual", "designer", "planner"]),
  locale: z.enum(["ar", "en"]),
});

export async function completeOnboarding(_: unknown, formData: FormData) {
  const { user, workspace } = await requireAppContext(true);
  const parsed = input.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: true };
  const { name, accountType, locale } = parsed.data;

  await db.transaction(async (tx) => {
    await tx.update(schema.user).set({ name, accountType, locale, onboardedAt: new Date() }).where(eq(schema.user.id, user.id));
    await tx
      .update(schema.workspace)
      .set({ name, kind: accountType === "individual" ? "personal" : "studio" })
      .where(eq(schema.workspace.id, workspace.id));
  });
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  redirect("/dashboard");
}
