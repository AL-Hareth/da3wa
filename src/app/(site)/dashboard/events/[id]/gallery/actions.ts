"use server";

import { and, count, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { getI18n } from "@/i18n/server";
import { db, schema } from "@/lib/db";
import { requireEvent } from "@/lib/events/queries";
import { deleteImage, ImageError, processAndStoreImage } from "@/lib/images";
import { entitlements } from "@/lib/plans";

const MAX_PHOTOS = 60;

export async function uploadPhotoAction(eventId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const { event } = await requireEvent(eventId);
  const { t } = await getI18n();
  if (!entitlements(event.tier).gallery) return { ok: false, error: t.gallery.locked };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: t.editor.errors.image.corrupt };

  const [{ n, top }] = await db
    .select({ n: count(), top: max(schema.eventPhoto.sortOrder) })
    .from(schema.eventPhoto)
    .where(eq(schema.eventPhoto.eventId, event.id));
  if (n >= MAX_PHOTOS) return { ok: false, error: t.editor.errors.generic };

  try {
    const image = await processAndStoreImage(file, `events/${event.id}/gallery`);
    await db.insert(schema.eventPhoto).values({ eventId: event.id, image, sortOrder: (top ?? 0) + 1 });
  } catch (err) {
    if (err instanceof ImageError) return { ok: false, error: t.editor.errors.image[err.code] };
    console.error("[gallery] upload failed", err);
    return { ok: false, error: t.common.somethingWentWrong };
  }
  refresh();
  return { ok: true };
}

export async function deletePhotoAction(eventId: string, photoId: string) {
  const { event } = await requireEvent(eventId);
  const [photo] = await db
    .delete(schema.eventPhoto)
    .where(and(eq(schema.eventPhoto.id, photoId), eq(schema.eventPhoto.eventId, event.id)))
    .returning();
  if (photo) await deleteImage(photo.image);
  refresh();
}
