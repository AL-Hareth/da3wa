import "server-only";
import { and, count, countDistinct, desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db, schema } from "../db";
import { requireAppContext } from "../session";

/** Loads an event the signed-in user can manage, or 404s. */
export const requireEvent = cache(async (eventId: string) => {
  const ctx = await requireAppContext();
  const ev = await db.query.event.findFirst({
    where: and(eq(schema.event.id, eventId), eq(schema.event.workspaceId, ctx.workspace.id)),
  });
  if (!ev) notFound();
  return { ...ctx, event: ev };
});

export async function listWorkspaceEvents(workspaceId: string) {
  const rsvpCounts = db
    .select({
      eventId: schema.rsvp.eventId,
      responses: count().as("responses"),
      guests: sql<number>`coalesce(sum(case when ${schema.rsvp.status} = 'attending' then ${schema.rsvp.partySize} else 0 end), 0)::int`.as("guests"),
    })
    .from(schema.rsvp)
    .groupBy(schema.rsvp.eventId)
    .as("rc");
  const viewCounts = db
    .select({ eventId: schema.pageView.eventId, views: count().as("views") })
    .from(schema.pageView)
    .groupBy(schema.pageView.eventId)
    .as("vc");

  return db
    .select({
      event: schema.event,
      responses: sql<number>`coalesce(${rsvpCounts.responses}, 0)::int`,
      guests: sql<number>`coalesce(${rsvpCounts.guests}, 0)::int`,
      views: sql<number>`coalesce(${viewCounts.views}, 0)::int`,
    })
    .from(schema.event)
    .leftJoin(rsvpCounts, eq(rsvpCounts.eventId, schema.event.id))
    .leftJoin(viewCounts, eq(viewCounts.eventId, schema.event.id))
    .where(eq(schema.event.workspaceId, workspaceId))
    .orderBy(desc(schema.event.updatedAt));
}

export type RsvpSummary = {
  attending: number;
  notAttending: number;
  maybe: number;
  total: number;
  guests: number;
  noResponse: number | null;
};

export async function rsvpSummary(eventId: string, expectedInvites: number | null): Promise<RsvpSummary> {
  const rows = await db
    .select({
      status: schema.rsvp.status,
      n: count(),
      party: sql<number>`coalesce(sum(${schema.rsvp.partySize}), 0)::int`,
    })
    .from(schema.rsvp)
    .where(eq(schema.rsvp.eventId, eventId))
    .groupBy(schema.rsvp.status);
  const by = Object.fromEntries(rows.map((r) => [r.status, r]));
  const total = rows.reduce((s, r) => s + r.n, 0);
  return {
    attending: by.attending?.n ?? 0,
    notAttending: by.not_attending?.n ?? 0,
    maybe: by.maybe?.n ?? 0,
    total,
    guests: by.attending?.party ?? 0,
    noResponse: expectedInvites != null ? Math.max(0, expectedInvites - total) : null,
  };
}

export async function viewStats(eventId: string) {
  const [row] = await db
    .select({ views: count(), visitors: countDistinct(schema.pageView.visitorHash) })
    .from(schema.pageView)
    .where(eq(schema.pageView.eventId, eventId));
  return row ?? { views: 0, visitors: 0 };
}

export async function rsvpCount(eventId: string) {
  const [row] = await db.select({ n: count() }).from(schema.rsvp).where(eq(schema.rsvp.eventId, eventId));
  return row?.n ?? 0;
}

export async function isSlugTaken(slug: string, exceptEventId?: string) {
  const row = await db.query.event.findFirst({ where: eq(schema.event.slug, slug), columns: { id: true } });
  return !!row && row.id !== exceptEventId;
}
