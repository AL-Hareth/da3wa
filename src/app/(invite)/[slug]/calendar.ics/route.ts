import { buildIcs } from "@/lib/ics";
import { calendarDetails, hasPageAccess } from "@/lib/events/invitation";
import { isExpired, resolveLang } from "@/lib/events/view";
import { getPublicEvent } from "../data";

export async function GET(req: Request, ctx: RouteContext<"/[slug]/calendar.ics">) {
  const { slug } = await ctx.params;
  const event = await getPublicEvent(slug);
  if (!event || event.status !== "published" || isExpired(event) || !(await hasPageAccess(event))) {
    return new Response("Not found", { status: 404 });
  }
  const lang = resolveLang(event, new URL(req.url).searchParams.get("lang"));
  const details = calendarDetails(event, lang);
  if (!details) return new Response("Not found", { status: 404 });
  return new Response(buildIcs(details), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
