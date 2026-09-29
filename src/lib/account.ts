import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "./db";
import { deleteImage } from "./images";

/** Removes stored images for every event in workspaces the user owns (DB rows cascade on delete). */
export async function purgeUserMedia(userId: string) {
  const workspaces = await db.select({ id: schema.workspace.id }).from(schema.workspace).where(eq(schema.workspace.ownerId, userId));
  if (!workspaces.length) return;
  const events = await db.query.event.findMany({
    where: inArray(
      schema.event.workspaceId,
      workspaces.map((w) => w.id),
    ),
    columns: { id: true, cardImage: true },
  });
  if (!events.length) return;
  const photos = await db.query.eventPhoto.findMany({
    where: inArray(
      schema.eventPhoto.eventId,
      events.map((e) => e.id),
    ),
    columns: { image: true },
  });
  const seen = new Set<string>();
  for (const asset of [...events.map((e) => e.cardImage), ...photos.map((p) => p.image)]) {
    if (!asset || seen.has(asset.id)) continue;
    seen.add(asset.id);
    await deleteImage(asset);
  }
}
