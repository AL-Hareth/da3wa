import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuth } from "./auth";
import { db, schema } from "./db";
import { getActiveWorkspace, ensurePersonalWorkspace } from "./workspace";

export const getSession = cache(async () => {
  return getAuth().api.getSession({ headers: await headers() });
});

/**
 * The signed-in user's current profile. The session (possibly served from the
 * cookie cache) only establishes identity; profile fields such as onboarding
 * state are always read fresh from the database.
 */
export const requireUser = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await db.query.user.findFirst({ where: eq(schema.user.id, session.user.id) });
  if (!user) redirect("/login");
  return user;
});

/** Resolves the signed-in user plus their active workspace, enforcing onboarding. */
export const requireAppContext = cache(async (allowNotOnboarded: boolean = false) => {
  const user = await requireUser();
  if (!user.onboardedAt && !allowNotOnboarded) redirect("/onboarding");
  let active = await getActiveWorkspace(user.id);
  if (!active) {
    await ensurePersonalWorkspace(user.id, user.name);
    active = await getActiveWorkspace(user.id);
  }
  if (!active) throw new Error("Workspace could not be created");
  return { user, workspace: active.workspace, role: active.role };
});
