import { and, eq } from "drizzle-orm";
import { FlaskConical } from "lucide-react";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/dashboard/action-button";
import { Card } from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { formatPrice, isProductId, PRODUCTS } from "@/lib/products";
import { requireAppContext } from "@/lib/session";
import { cancelMockOrderAction, completeMockOrderAction } from "../../actions";

/** Stand-in for a hosted checkout page when PAYMENT_PROVIDER=mock. */
export default async function MockCheckoutPage(props: PageProps<"/dashboard/billing/checkout/[orderId]">) {
  if (env().PAYMENT_PROVIDER !== "mock") notFound();
  const { orderId } = await props.params;
  const [{ workspace }, { t, locale }] = await Promise.all([requireAppContext(), getI18n()]);
  const order = await db.query.order.findFirst({ where: and(eq(schema.order.id, orderId), eq(schema.order.workspaceId, workspace.id)) });
  if (!order || !isProductId(order.product)) notFound();
  const product = PRODUCTS[order.product];

  return (
    <div className="mx-auto max-w-md pt-6">
      <Card className="p-7 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-warn-soft text-warn">
          <FlaskConical className="size-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-semibold">{t.billing.mockTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.billing.mockBody}</p>
        <div className="my-6 rounded-2xl bg-paper px-4 py-4">
          <p className="font-medium">{product.name[locale]}</p>
          <p className="mt-1 text-2xl font-semibold tabular">{formatPrice(order.amountCents, order.currency, locale)}</p>
          <p className="mt-1 text-xs text-muted">{t.billing.orderStatus[order.status]}</p>
        </div>
        {order.status === "pending" && (
          <div className="flex flex-col gap-2">
            <ActionButton action={completeMockOrderAction.bind(null, order.id)} size="lg" className="w-full">
              {t.billing.mockPay}
            </ActionButton>
            <ActionButton action={cancelMockOrderAction.bind(null, order.id)} variant="ghost" className="w-full">
              {t.billing.mockCancel}
            </ActionButton>
          </div>
        )}
      </Card>
    </div>
  );
}
