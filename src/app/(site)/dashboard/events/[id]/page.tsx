import { eq } from "drizzle-orm";
import { Copy, ExternalLink, Eye, Images, Lock, Pencil, Trash2, Archive, ArchiveRestore, Users, Crown, CheckCircle2, CircleAlert } from "lucide-react";
import Link from "next/link";
import { BackLink } from "@/components/dashboard/back-link";
import { ActionButton } from "@/components/dashboard/action-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { SharePanel } from "@/components/dashboard/share-panel";
import { Stat } from "@/components/dashboard/stat";
import { StatusBadge, TierBadge } from "@/components/dashboard/status-badge";
import { shareMessage } from "@/components/invite/invitation";
import { buttonClass, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { FormMessage } from "@/components/ui/form";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { creditBalances } from "@/lib/billing";
import { db, schema } from "@/lib/db";
import { formatDateTime } from "@/lib/datetime";
import { env } from "@/lib/env";
import { requireEvent, rsvpSummary, viewStats } from "@/lib/events/queries";
import { displayTitle, publishIssues } from "@/lib/events/view";
import { entitlements, pageExpiresAt } from "@/lib/plans";
import { formatPrice, PRODUCTS } from "@/lib/products";
import { eventPublicUrl, prettyUrl } from "@/lib/urls";
import {
  checkoutAction,
  deleteEventAction,
  duplicateEventAction,
  publishEventAction,
  redeemCreditAction,
  setEventStatusAction,
} from "../actions";

export async function generateMetadata(props: PageProps<"/dashboard/events/[id]">) {
  const { id } = await props.params;
  const [{ event }, { locale, t }] = await Promise.all([requireEvent(id), getI18n()]);
  return { title: displayTitle(event, locale) ?? t.dashboard.untitled };
}

export default async function EventOverviewPage(props: PageProps<"/dashboard/events/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const [{ event, workspace }, { t, locale }] = await Promise.all([requireEvent(id), getI18n()]);
  const e = env();
  const ent = entitlements(event.tier, { freePublishEnabled: e.FREE_PUBLISH_ENABLED });
  const [summary, views, credits] = await Promise.all([rsvpSummary(event.id, event.expectedInvites), viewStats(event.id), creditBalances(workspace.id)]);
  const url = eventPublicUrl(event.slug);
  const issues = publishIssues(event);
  const title = displayTitle(event, locale) ?? t.dashboard.untitled;
  const o = t.overview;
  const currency = e.PRICE_CURRENCY;

  let paymentNotice: { tone: "success" | "info" | "error"; text: string } | null = null;
  if (sp.payment === "success" && typeof sp.order === "string") {
    const order = await db.query.order.findFirst({ where: eq(schema.order.id, sp.order), columns: { status: true, workspaceId: true } });
    if (order?.workspaceId === workspace.id) paymentNotice = order.status === "paid" ? { tone: "success", text: o.paymentSuccess } : { tone: "info", text: o.paymentPending };
  } else if (sp.payment === "cancelled") paymentNotice = { tone: "info", text: o.paymentCancelled };

  const expires = pageExpiresAt(event.tier, event.endsAt ?? event.startsAt);
  const upgrades: { tier: "standard" | "premium"; product: keyof typeof PRODUCTS }[] = [];
  if (event.tier === "free") upgrades.push({ tier: "standard", product: "event_standard" }, { tier: "premium", product: "event_premium" });
  if (event.tier === "standard") upgrades.push({ tier: "premium", product: "event_premium_upgrade" });

  return (
    <>
      <PageHeader
        back={<BackLink href="/dashboard" label={t.nav.events} />}
        title={title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {event.clientName && <span className="font-medium text-gold-dark">{event.clientName}</span>}
            <span>{t.eventTypes[event.type]}</span>
            <StatusBadge status={event.status} t={t} />
            <TierBadge tier={event.tier} t={t} />
          </span>
        }
        actions={
          <>
            <ButtonLink href={`/dashboard/events/${event.id}/edit`} variant="primary">
              <Pencil className="size-4" aria-hidden />
              {o.editDetails}
            </ButtonLink>
            <a href={`/preview/${event.id}`} target="_blank" rel="noopener" className={buttonClass("outline")}>
              <Eye className="size-4" aria-hidden />
              {t.common.preview}
            </a>
          </>
        }
      />

      {paymentNotice && (
        <div className="mb-6">
          <FormMessage tone={paymentNotice.tone}>{paymentNotice.text}</FormMessage>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {/* Publishing & link */}
          <Card>
            <CardHeader title={event.status === "published" ? o.publicLink : o.publishTitle} />
            <CardBody className="space-y-4">
              {event.status === "published" ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2">
                    <a href={url} target="_blank" rel="noopener" dir="ltr" className="min-w-0 flex-1 truncate font-medium text-ink hover:text-gold-dark">
                      {prettyUrl(url)}
                    </a>
                    <CopyButton value={url} label={t.common.copy} copiedLabel={t.common.copied} />
                    <a href={url} target="_blank" rel="noopener" className={buttonClass("ghost", "sm")} aria-label={o.openPage}>
                      <ExternalLink className="size-4" aria-hidden />
                    </a>
                  </div>
                  <SharePanel
                    url={url}
                    message={shareMessage(event, event.languageMode === "en" ? "en" : "ar")}
                    facebookAppId={e.FACEBOOK_APP_ID}
                    labels={{ whatsapp: o.whatsapp, messenger: o.messenger, nativeShare: o.nativeShare, copy: t.common.copy, copied: t.common.copied }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm text-muted">
                    <div className="space-y-0.5">
                      {event.publishedAt && <p>{fmt(o.publishedOn, { date: formatDateTime(event.publishedAt, locale) })}</p>}
                      {expires && <p>{fmt(o.expiresOn, { date: formatDateTime(expires, locale) })}</p>}
                    </div>
                    <ActionButton action={setEventStatusAction.bind(null, event.id, "draft")} variant="outline" size="sm" confirm={t.common.confirm}>
                      {t.common.unpublish}
                    </ActionButton>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-muted">{o.notPublished}</p>
                  {issues.length > 0 && (
                    <div className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
                      <p className="font-medium">{o.publishMissing}</p>
                      <ul className="mt-1.5 list-inside list-disc space-y-0.5">
                        {issues.map((i) => (
                          <li key={i}>{o.missing[i]}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!ent.publish ? (
                    <div className="flex items-start gap-2 rounded-xl bg-gold-soft px-4 py-3 text-sm text-gold-dark">
                      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {o.publishNeedsUpgrade}
                    </div>
                  ) : (
                    issues.length === 0 && (
                      <p className="flex items-center gap-2 text-sm text-success">
                        <CheckCircle2 className="size-4" aria-hidden />
                        {o.publishReady}
                      </p>
                    )
                  )}
                  <ActionButton action={publishEventAction.bind(null, event.id)} disabled={!ent.publish || issues.length > 0} size="lg">
                    {t.common.publish}
                  </ActionButton>
                </>
              )}
            </CardBody>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader
              title={o.stats}
              action={
                <Link href={`/dashboard/events/${event.id}/rsvps`} className={buttonClass("outline", "sm")}>
                  <Users className="size-4" aria-hidden />
                  {o.viewRsvps}
                </Link>
              }
            />
            <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={o.views} value={views.views} />
              <Stat label={o.visitors} value={views.visitors} />
              <Stat label={o.responses} value={summary.total} />
              <Stat label={o.guestsExpected} value={summary.guests} tone="success" />
              <Stat label={o.attending} value={summary.attending} tone="success" />
              <Stat label={o.notAttending} value={summary.notAttending} tone="danger" />
              <Stat label={o.maybe} value={summary.maybe} tone="warn" />
              <Stat label={o.noResponse} value={summary.noResponse ?? t.common.none} tone="muted" />
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-6">
          {/* Upgrade */}
          {upgrades.length > 0 && (
            <Card className="border-gold/30">
              <CardHeader title={o.upgradeTitle} description={fmt(o.currentTier, { tier: t.tiers[event.tier] })} />
              <CardBody className="space-y-5">
                {upgrades.map(({ tier, product }) => (
                  <div key={tier} className="space-y-2.5">
                    <p className="flex items-center gap-2 font-semibold">
                      <Crown className="size-4 text-gold" aria-hidden />
                      {t.pricing[tier].name}
                      <span className="text-sm font-normal text-muted">— {t.pricing[tier].tagline}</span>
                    </p>
                    <div className="flex flex-col gap-2">
                      {credits[tier] > 0 && (
                        <ActionButton action={redeemCreditAction.bind(null, event.id, tier)} variant="secondary" className="w-full" confirm={t.common.confirm}>
                          {fmt(o.useCredit, { n: credits[tier] })}
                        </ActionButton>
                      )}
                      <ActionButton action={checkoutAction.bind(null, product, event.id)} variant={tier === "premium" ? "outline" : "primary"} className="w-full">
                        {fmt(o.payNow, { price: formatPrice(PRODUCTS[product].priceCents, currency, locale) })}
                      </ActionButton>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {/* QR */}
          <Card>
            <CardHeader title={o.qr} description={o.qrHint} />
            <CardBody>
              {ent.qrCode ? (
                event.status === "published" ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/dashboard/events/${event.id}/qr?format=svg`} alt={o.qr} className="mx-auto size-48 rounded-xl border border-line" />
                    <div className="flex gap-2">
                      <a href={`/dashboard/events/${event.id}/qr?format=png&download`} className={buttonClass("outline", "sm", "flex-1")}>
                        {o.qrDownloadPng}
                      </a>
                      <a href={`/dashboard/events/${event.id}/qr?format=svg&download`} className={buttonClass("outline", "sm", "flex-1")}>
                        {o.qrDownloadSvg}
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted">{o.notPublished}</p>
                )
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Lock className="size-4" aria-hidden />
                  {fmt(o.lockedFeature, { tier: t.tiers.standard })}
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <Link href={`/dashboard/events/${event.id}/rsvps`} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm hover:bg-paper">
                <Users className="size-4 text-gold-dark" aria-hidden />
                {o.viewRsvps}
              </Link>
              <Link href={`/dashboard/events/${event.id}/gallery`} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm hover:bg-paper">
                <Images className="size-4 text-gold-dark" aria-hidden />
                {o.gallery}
                {!ent.gallery && <Lock className="ms-auto size-3.5 text-muted" aria-hidden />}
              </Link>
            </CardBody>
          </Card>

          {/* More actions */}
          <Card>
            <CardHeader title={o.dangerZone} />
            <CardBody className="space-y-3">
              <div>
                <ActionButton action={duplicateEventAction.bind(null, event.id)} variant="outline" size="sm" className="w-full">
                  <Copy className="size-4" aria-hidden />
                  {t.common.duplicate}
                </ActionButton>
                <p className="mt-1.5 text-xs text-muted">{o.duplicateHint}</p>
              </div>
              {event.status === "archived" ? (
                <ActionButton action={setEventStatusAction.bind(null, event.id, "draft")} variant="outline" size="sm" className="w-full">
                  <ArchiveRestore className="size-4" aria-hidden />
                  {t.common.restore}
                </ActionButton>
              ) : (
                <ActionButton action={setEventStatusAction.bind(null, event.id, "archived")} variant="outline" size="sm" className="w-full" confirm={t.common.confirm}>
                  <Archive className="size-4" aria-hidden />
                  {t.common.archive}
                </ActionButton>
              )}
              <ActionButton action={deleteEventAction.bind(null, event.id)} variant="danger" size="sm" className="w-full" confirm={o.deleteConfirm}>
                <Trash2 className="size-4" aria-hidden />
                {t.common.delete}
              </ActionButton>
              {issues.length > 0 && event.status !== "draft" && (
                <p className="flex items-center gap-1.5 text-xs text-warn">
                  <CircleAlert className="size-3.5" aria-hidden />
                  {o.publishMissing}
                </p>
              )}
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}
