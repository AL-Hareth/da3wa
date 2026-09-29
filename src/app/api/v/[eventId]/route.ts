import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpFrom, deviceFromUserAgent, hmac, isBot } from "@/lib/request";

const VISITOR_COOKIE = "vid";

/** Page-view beacon for invitation analytics. Stores only a keyed hash of a random visitor id. */
export async function POST(req: Request, ctx: RouteContext<"/api/v/[eventId]">) {
  const { eventId } = await ctx.params;
  const ua = req.headers.get("user-agent");
  if (isBot(ua)) return new Response(null, { status: 204 });

  const ip = clientIpFrom(req.headers);
  if (!(await rateLimit(`view:${ip}`, 120, 60 * 60)).ok) return new Response(null, { status: 204 });

  const event = await db.query.event.findFirst({ where: eq(schema.event.id, eventId), columns: { id: true, status: true } });
  if (!event || event.status !== "published") return new Response(null, { status: 204 });

  const jar = await cookies();
  let vid = jar.get(VISITOR_COOKIE)?.value;
  if (!vid || !/^[\w-]{16,64}$/.test(vid)) {
    vid = randomBytes(16).toString("base64url");
    jar.set(VISITOR_COOKIE, vid, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  let referrer: string | null = null;
  try {
    const body = (await req.json()) as { r?: unknown };
    if (typeof body.r === "string") referrer = body.r.slice(0, 120);
  } catch {
    // Empty or malformed body is fine.
  }

  await db.insert(schema.pageView).values({
    eventId: event.id,
    visitorHash: hmac(`visitor:${vid}`).slice(0, 32),
    device: deviceFromUserAgent(ua),
    referrer,
  });
  return new Response(null, { status: 204 });
}
