import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/lib/db";

/** Published or archived event by slug; drafts are invisible to guests. */
export const getPublicEvent = cache(async (rawSlug: string) => {
  const slug = decodeURIComponent(rawSlug).toLowerCase();
  if (slug.length > 64) return null;
  const ev = await db.query.event.findFirst({ where: eq(schema.event.slug, slug) });
  if (!ev || ev.status === "draft") return null;
  return ev;
});
