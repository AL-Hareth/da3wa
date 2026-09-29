import { CalendarDays, Eye, Plus, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { EventThumb } from "@/components/dashboard/event-thumb";
import { StatusBadge, TierBadge } from "@/components/dashboard/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { getI18n } from "@/i18n/server";
import { creditBalances } from "@/lib/billing";
import { formatEventDate } from "@/lib/datetime";
import { listWorkspaceEvents } from "@/lib/events/queries";
import { displayTitle } from "@/lib/events/view";
import { requireAppContext } from "@/lib/session";
import { eventPublicUrl, prettyUrl } from "@/lib/urls";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.dashboard.title };
}

export default async function DashboardPage() {
  const [{ user, workspace }, { t, locale }] = await Promise.all([requireAppContext(), getI18n()]);
  const [rows, credits] = await Promise.all([listWorkspaceEvents(workspace.id), creditBalances(workspace.id)]);
  const isPro = user.accountType !== "individual";

  return (
    <>
      <PageHeader
        title={t.dashboard.title}
        subtitle={isPro ? t.dashboard.subtitleDesigner : t.dashboard.subtitleIndividual}
        actions={
          <ButtonLink href="/dashboard/events/new">
            <Plus className="size-4" aria-hidden />
            {t.nav.newEvent}
          </ButtonLink>
        }
      />

      {(isPro || credits.standard + credits.premium > 0) && (
        <Card className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
          <span className="text-sm font-medium text-ink-soft">{t.dashboard.credits}</span>
          <span className="text-sm">
            {t.dashboard.creditsStandard}: <strong className="tabular">{credits.standard}</strong>
          </span>
          <span className="text-sm">
            {t.dashboard.creditsPremium}: <strong className="tabular">{credits.premium}</strong>
          </span>
          <Link href="/dashboard/billing" className="ms-auto text-sm font-medium text-gold-dark hover:underline">
            {t.dashboard.buyCredits}
          </Link>
        </Card>
      )}

      {rows.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-gold-soft text-gold-dark">
            <CalendarDays className="size-7" aria-hidden />
          </div>
          <h2 className="mt-5 text-xl font-semibold">{t.dashboard.empty}</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{t.dashboard.emptyBody}</p>
          <ButtonLink href="/dashboard/events/new" className="mt-6">
            <Plus className="size-4" aria-hidden />
            {t.dashboard.createFirst}
          </ButtonLink>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {rows.map(({ event, responses, guests, views }) => {
            const title = displayTitle(event, locale) ?? t.dashboard.untitled;
            const url = eventPublicUrl(event.slug);
            return (
              <li key={event.id}>
                <Card className="flex gap-4 p-3 transition-shadow hover:shadow-md sm:items-center sm:p-4">
                  <Link href={`/dashboard/events/${event.id}`} className="shrink-0">
                    <EventThumb event={event} className="w-16 sm:w-20" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isPro && event.clientName && (
                        <span className="text-xs font-semibold tracking-wide text-gold-dark uppercase">{event.clientName}</span>
                      )}
                      <StatusBadge status={event.status} t={t} />
                      <TierBadge tier={event.tier} t={t} />
                    </div>
                    <Link href={`/dashboard/events/${event.id}`} className="mt-1 block truncate text-lg font-semibold hover:text-gold-dark">
                      {title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                      <span>{t.eventTypes[event.type]}</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {event.eventDate ? formatEventDate(event.eventDate, locale) : t.dashboard.noDate}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular" title={t.dashboard.rsvps}>
                        <Users className="size-3.5" aria-hidden />
                        {responses}
                        {guests > 0 && <span className="text-xs">({guests})</span>}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular" title={t.dashboard.views}>
                        <Eye className="size-3.5" aria-hidden />
                        {views}
                      </span>
                    </div>
                    {event.status === "published" && (
                      <div className="mt-2 flex min-w-0 items-center gap-2">
                        <span dir="ltr" className="truncate text-sm text-ink-soft">
                          {prettyUrl(url)}
                        </span>
                        <CopyButton value={url} label={t.common.copy} copiedLabel={t.common.copied} variant="ghost" size="sm" className="h-7 px-2" />
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
