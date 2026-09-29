import { and, asc, eq } from "drizzle-orm";
import { toCsv } from "@/lib/csv";
import { db, schema } from "@/lib/db";
import { entitlements } from "@/lib/plans";
import { getSession } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspace";
import { getDict } from "@/i18n/server";
import { isLocale } from "@/i18n/config";

export async function GET(req: Request, ctx: RouteContext<"/dashboard/events/[id]/rsvps/export">) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const ws = await getActiveWorkspace(session.user.id);
  const event = ws ? await db.query.event.findFirst({ where: and(eq(schema.event.id, id), eq(schema.event.workspaceId, ws.workspace.id)) }) : null;
  if (!event) return new Response("Not found", { status: 404 });
  if (!entitlements(event.tier).csvExport) return new Response("Upgrade required", { status: 402 });

  const lang = new URL(req.url).searchParams.get("lang");
  const t = getDict(isLocale(lang) ? lang : "ar").rsvps;
  const rows = await db.query.rsvp.findMany({ where: eq(schema.rsvp.eventId, event.id), orderBy: asc(schema.rsvp.createdAt) });
  const csv = toCsv(
    [t.name, t.status, t.party, t.phone, t.note, t.date],
    rows.map((r) => [r.fullName, t.statuses[r.status], r.partySize, r.phone, r.note, r.updatedAt.toISOString()]),
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-rsvps.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
