import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "./db";

/** Creates the user's personal workspace if it doesn't exist yet. Idempotent. */
export async function ensurePersonalWorkspace(userId: string, name: string) {
  const existing = await db.query.workspaceMember.findFirst({
    where: eq(schema.workspaceMember.userId, userId),
  });
  if (existing) return existing.workspaceId;

  return db.transaction(async (tx) => {
    const [ws] = await tx
      .insert(schema.workspace)
      .values({ name: name || "My workspace", kind: "personal", ownerId: userId })
      .returning({ id: schema.workspace.id });
    await tx.insert(schema.workspaceMember).values({ workspaceId: ws.id, userId, role: "owner" });
    return ws.id;
  });
}

/** Returns the workspace the user is currently acting in (their first membership). */
export async function getActiveWorkspace(userId: string) {
  const rows = await db
    .select({ workspace: schema.workspace, role: schema.workspaceMember.role })
    .from(schema.workspaceMember)
    .innerJoin(schema.workspace, eq(schema.workspace.id, schema.workspaceMember.workspaceId))
    .where(eq(schema.workspaceMember.userId, userId))
    .orderBy(asc(schema.workspaceMember.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function isWorkspaceMember(userId: string, workspaceId: string) {
  const row = await db.query.workspaceMember.findFirst({
    where: and(eq(schema.workspaceMember.userId, userId), eq(schema.workspaceMember.workspaceId, workspaceId)),
  });
  return !!row;
}
