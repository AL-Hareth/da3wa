import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, schema } from "../db";
import type { Event, ImageAsset } from "../db/schema";
import { deleteImage } from "../images";
import { randomSlug } from "../slug";
import { DEFAULT_THEME_ID, getTheme } from "../themes";

/** Deletes image files unless another event (e.g. a duplicate) still references them. */
export async function releaseCardImage(asset: ImageAsset | null | undefined, exceptEventId: string) {
  if (!asset) return;
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.event)
    .where(and(ne(schema.event.id, exceptEventId), sql`${schema.event.cardImage}->>'id' = ${asset.id}`));
  if ((row?.n ?? 0) === 0) await deleteImage(asset);
}

export async function uniqueRandomSlug(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const slug = randomSlug();
    const exists = await db.query.event.findFirst({ where: eq(schema.event.slug, slug), columns: { id: true } });
    if (!exists) return slug;
  }
  throw new Error("Could not allocate a unique slug");
}

/** Copies an event as a fresh free draft; RSVPs, analytics, upgrades and gallery are not carried over. */
export async function duplicateEventRecord(source: Event, actorId: string): Promise<string> {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const {
    id: _id,
    slug: _slug,
    status: _status,
    tier: _tier,
    publishedAt: _p,
    firstPublishedAt: _fp,
    archivedAt: _a,
    createdAt: _c,
    updatedAt: _u,
    accessPin: _pin,
    visibility: _vis,
    bannerType: _bt,
    bannerTextAr: _bta,
    bannerTextEn: _bte,
    bannerUpdatedAt: _bu,
    ...rest
  } = source;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const [copy] = await db
    .insert(schema.event)
    .values({
      ...rest,
      // A free draft can't keep premium-only settings.
      languageMode: rest.languageMode === "bilingual" ? "ar" : rest.languageMode,
      themeId: getTheme(rest.themeId).free ? rest.themeId : DEFAULT_THEME_ID,
      slug: await uniqueRandomSlug(),
      status: "draft",
      tier: "free",
      createdById: actorId,
    })
    .returning({ id: schema.event.id });
  return copy.id;
}

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505";
}
