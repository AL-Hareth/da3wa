import { and, eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/session";
import { entitlements } from "@/lib/plans";
import { eventPublicUrl } from "@/lib/urls";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET(req: Request, ctx: RouteContext<"/dashboard/events/[id]/qr">) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const ws = await getActiveWorkspace(session.user.id);
  const { id } = await ctx.params;
  const event = ws
    ? await db.query.event.findFirst({ where: and(eq(schema.event.id, id), eq(schema.event.workspaceId, ws.workspace.id)) })
    : null;
  if (!event) return new Response("Not found", { status: 404 });
  if (!entitlements(event.tier).qrCode) return new Response("Upgrade required", { status: 402 });

  const params = new URL(req.url).searchParams;
  const format = params.get("format") === "png" ? "png" : "svg";
  const download = params.has("download");
  const url = eventPublicUrl(event.slug);
  const opts = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: "#231f1bff", light: "#ffffffff" } };
  const headers: Record<string, string> = { "Cache-Control": "private, no-store" };
  if (download) headers["Content-Disposition"] = `attachment; filename="${event.slug}-qr.${format}"`;

  if (format === "png") {
    const buf = await QRCode.toBuffer(url, { ...opts, width: 1024, type: "png" });
    return new Response(new Uint8Array(buf), { headers: { ...headers, "Content-Type": "image/png" } });
  }
  const svg = await QRCode.toString(url, { ...opts, type: "svg" });
  return new Response(svg, { headers: { ...headers, "Content-Type": "image/svg+xml" } });
}
