import { desc, eq } from "drizzle-orm";
import { Download, Lock, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/dashboard/action-button";
import { BackLink } from "@/components/dashboard/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Stat } from "@/components/dashboard/stat";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { db, schema } from "@/lib/db";
import { formatDateTime } from "@/lib/datetime";
import { requireEvent, rsvpSummary } from "@/lib/events/queries";
import { displayTitle } from "@/lib/events/view";
import { entitlements } from "@/lib/plans";
import { deleteRsvpAction } from "../../actions";
import { RsvpFilter } from "./rsvp-filter";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.rsvps.title };
}

const TONE = { attending: "success", not_attending: "danger", maybe: "warn" } as const;

export default async function RsvpsPage(props: PageProps<"/dashboard/events/[id]/rsvps">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const [{ event }, { t, locale }] = await Promise.all([requireEvent(id), getI18n()]);
  const ent = entitlements(event.tier);
  const [rows, summary] = await Promise.all([
    db.query.rsvp.findMany({ where: eq(schema.rsvp.eventId, event.id), orderBy: desc(schema.rsvp.updatedAt) }),
    rsvpSummary(event.id, event.expectedInvites),
  ]);
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const filtered = rows.filter(
    (r) => (!status || r.status === status) && (!q || r.fullName.toLowerCase().includes(q) || (r.phone ?? "").includes(q)),
  );
  const r = t.rsvps;

  return (
    <>
      <PageHeader
        back={<BackLink href={`/dashboard/events/${event.id}`} label={displayTitle(event, locale) ?? t.dashboard.untitled} />}
        title={r.title}
        subtitle={fmt(r.totalGuests, { n: summary.guests })}
        actions={
          ent.csvExport ? (
            <a href={`/dashboard/events/${event.id}/rsvps/export?lang=${locale}`} className={buttonClass("outline")}>
              <Download className="size-4" aria-hidden />
              {r.exportCsv}
            </a>
          ) : (
            <span className={buttonClass("outline", "md", "pointer-events-none opacity-60")} title={fmt(t.overview.lockedFeature, { tier: t.tiers.standard })}>
              <Lock className="size-4" aria-hidden />
              {r.exportCsv}
            </span>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t.overview.attending} value={summary.attending} tone="success" />
        <Stat label={t.overview.notAttending} value={summary.notAttending} tone="danger" />
        <Stat label={t.overview.maybe} value={summary.maybe} tone="warn" />
        <Stat label={t.overview.noResponse} value={summary.noResponse ?? t.common.none} tone="muted" />
      </div>

      <RsvpFilter statuses={r.statuses} placeholder={r.search} allLabel={t.dashboard.filterAll} />

      <Card className="mt-4 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-muted">{r.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="border-b border-line bg-paper text-start text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{r.name}</th>
                  <th className="px-4 py-3 text-start font-medium">{r.status}</th>
                  <th className="px-4 py-3 text-start font-medium">{r.party}</th>
                  <th className="px-4 py-3 text-start font-medium">{r.phone}</th>
                  <th className="px-4 py-3 text-start font-medium">{r.note}</th>
                  <th className="px-4 py-3 text-start font-medium">{r.date}</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3 font-medium">{row.fullName}</td>
                    <td className="px-4 py-3">
                      <Badge tone={TONE[row.status]}>{r.statuses[row.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular">{row.status === "not_attending" ? "—" : row.partySize}</td>
                    <td className="px-4 py-3 tabular" dir="ltr">
                      {row.phone ? (
                        <a href={`tel:${row.phone.replace(/[^\d+]/g, "")}`} className="hover:text-gold-dark">
                          {row.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-64 px-4 py-3 whitespace-pre-line text-ink-soft">{row.note ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(row.updatedAt, locale, event.timezone)}</td>
                    <td className="px-2 py-2">
                      <ActionButton action={deleteRsvpAction.bind(null, event.id, row.id)} variant="ghost" size="sm" confirm={t.common.confirm} className="text-danger">
                        <Trash2 className="size-4" aria-label={r.delete} />
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
