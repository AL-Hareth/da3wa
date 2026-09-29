import { eq } from "drizzle-orm";
import { Crown, Sparkles } from "lucide-react";
import { ActionButton } from "@/components/dashboard/action-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form";
import { getI18n } from "@/i18n/server";
import { creditBalances, listOrders } from "@/lib/billing";
import { db, schema } from "@/lib/db";
import { formatDateTime } from "@/lib/datetime";
import { env } from "@/lib/env";
import { formatPrice, isProductId, PRODUCTS } from "@/lib/products";
import { requireAppContext } from "@/lib/session";
import { checkoutAction } from "../events/actions";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.billing.title };
}

const STATUS_TONE = { pending: "warn", paid: "success", failed: "danger", cancelled: "neutral", refunded: "neutral" } as const;

export default async function BillingPage(props: PageProps<"/dashboard/billing">) {
  const sp = await props.searchParams;
  const [{ workspace }, { t, locale }] = await Promise.all([requireAppContext(), getI18n()]);
  const [credits, orders] = await Promise.all([creditBalances(workspace.id), listOrders(workspace.id)]);
  const currency = env().PRICE_CURRENCY;
  const b = t.billing;

  let notice: { tone: "success" | "info"; text: string } | null = null;
  if (sp.payment === "success" && typeof sp.order === "string") {
    const order = await db.query.order.findFirst({ where: eq(schema.order.id, sp.order), columns: { status: true, workspaceId: true } });
    if (order?.workspaceId === workspace.id) notice = order.status === "paid" ? { tone: "success", text: b.purchaseSuccess } : { tone: "info", text: t.overview.paymentPending };
  } else if (sp.payment === "cancelled") notice = { tone: "info", text: t.overview.paymentCancelled };

  const packs = (["credits_standard_5", "credits_premium_5"] as const).map((id) => PRODUCTS[id]);

  return (
    <>
      <PageHeader title={b.title} subtitle={b.balanceHint} />
      {notice && (
        <div className="mb-6">
          <FormMessage tone={notice.tone}>{notice.text}</FormMessage>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={b.balances} />
          <CardBody className="grid grid-cols-2 gap-3">
            {(["standard", "premium"] as const).map((k) => (
              <div key={k} className="rounded-2xl border border-line bg-paper/60 p-4">
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  {k === "premium" ? <Crown className="size-4 text-gold" aria-hidden /> : <Sparkles className="size-4 text-gold" aria-hidden />}
                  {t.tiers[k]}
                </p>
                <p className="mt-1 text-3xl font-semibold tabular">{credits[k]}</p>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={b.packs} description={t.pricing.credits} />
          <CardBody className="space-y-3">
            {packs.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3">
                <div>
                  <p className="font-medium">{p.name[locale]}</p>
                  <p className="text-sm text-muted tabular">{formatPrice(p.priceCents, currency, locale)}</p>
                </div>
                <ActionButton action={checkoutAction.bind(null, p.id, null)} size="sm">
                  {b.buy}
                </ActionButton>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader title={b.orders} />
        {orders.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">{b.noOrders}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="border-b border-line bg-paper text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 text-start font-medium">{b.product}</th>
                  <th className="px-5 py-3 text-start font-medium">{b.amount}</th>
                  <th className="px-5 py-3 text-start font-medium">{t.dashboard.status}</th>
                  <th className="px-5 py-3 text-start font-medium">{b.date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3">{isProductId(o.product) ? PRODUCTS[o.product].name[locale] : o.product}</td>
                    <td className="px-5 py-3 tabular">{formatPrice(o.amountCents, o.currency, locale)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUS_TONE[o.status]}>{b.orderStatus[o.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-muted">{formatDateTime(o.createdAt, locale)}</td>
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
