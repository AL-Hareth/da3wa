import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Invitation } from "@/components/invite/invitation";
import { db, schema } from "@/lib/db";
import { buildInvitationProps } from "@/lib/events/invitation";
import { getSession } from "@/lib/session";
import { getActiveWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Owner-only render of an invitation in any status, used by the editor's live preview. */
export default async function PreviewPage(props: PageProps<"/preview/[eventId]">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { eventId } = await props.params;
  const sp = await props.searchParams;
  const ws = await getActiveWorkspace(session.user.id);
  if (!ws) notFound();
  const event = await db.query.event.findFirst({ where: and(eq(schema.event.id, eventId), eq(schema.event.workspaceId, ws.workspace.id)) });
  if (!event) notFound();
  const props_ = await buildInvitationProps(event, { requestedLang: typeof sp.lang === "string" ? sp.lang : null, mode: "preview" });
  return <Invitation {...props_} />;
}
