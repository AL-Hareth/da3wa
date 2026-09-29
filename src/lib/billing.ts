import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema, type Tx } from "./db";
import type { EventTier, Order } from "./db/schema";
import { env, appUrl } from "./env";
import { paymentProvider } from "./payments";
import { TIER_RANK } from "./plans";
import { PRODUCTS, type ProductId } from "./products";

export class BillingError extends Error {
  constructor(public code: "invalid_product" | "event_required" | "tier_mismatch" | "no_credits" | "already_upgraded") {
    super(code);
  }
}

export async function creditBalances(workspaceId: string): Promise<{ standard: number; premium: number }> {
  const rows = await db
    .select({ kind: schema.creditLedger.kind, total: sql<number>`coalesce(sum(${schema.creditLedger.delta}), 0)::int` })
    .from(schema.creditLedger)
    .where(eq(schema.creditLedger.workspaceId, workspaceId))
    .groupBy(schema.creditLedger.kind);
  const out = { standard: 0, premium: 0 };
  for (const r of rows) out[r.kind] = r.total;
  return out;
}

export async function listOrders(workspaceId: string, limit = 50) {
  return db.query.order.findMany({
    where: eq(schema.order.workspaceId, workspaceId),
    orderBy: desc(schema.order.createdAt),
    limit,
  });
}

function assertProductForEvent(productId: ProductId, event: { tier: EventTier } | null) {
  const product = PRODUCTS[productId];
  if (!product) throw new BillingError("invalid_product");
  if (product.eventTier) {
    if (!event) throw new BillingError("event_required");
    if (product.requiresTier && event.tier !== product.requiresTier) throw new BillingError("tier_mismatch");
    if (TIER_RANK[event.tier] >= TIER_RANK[product.eventTier]) throw new BillingError("already_upgraded");
  }
  return product;
}

/** Creates a pending order and returns the URL of the provider's hosted checkout. */
export async function startCheckout(input: {
  workspaceId: string;
  user: { id: string; email: string };
  productId: ProductId;
  eventId?: string | null;
  locale: "ar" | "en";
}): Promise<string> {
  const ev = input.eventId
    ? await db.query.event.findFirst({
        where: and(eq(schema.event.id, input.eventId), eq(schema.event.workspaceId, input.workspaceId)),
        columns: { id: true, tier: true },
      })
    : null;
  if (input.eventId && !ev) throw new BillingError("event_required");
  const product = assertProductForEvent(input.productId, ev ?? null);

  const provider = paymentProvider();
  const [order] = await db
    .insert(schema.order)
    .values({
      workspaceId: input.workspaceId,
      userId: input.user.id,
      eventId: product.eventTier ? ev!.id : null,
      product: product.id,
      amountCents: product.priceCents,
      currency: env().PRICE_CURRENCY.toLowerCase(),
      provider: provider.id,
      status: "pending",
    })
    .returning();

  const returnPath = product.eventTier ? `/dashboard/events/${ev!.id}` : "/dashboard/billing";
  const { redirectUrl, providerRef } = await provider.createCheckout({
    order,
    productName: product.name[input.locale],
    customerEmail: input.user.email,
    successUrl: appUrl(`${returnPath}?payment=success&order=${order.id}`),
    cancelUrl: appUrl(`${returnPath}?payment=cancelled&order=${order.id}`),
    locale: input.locale,
  });
  if (providerRef) {
    await db.update(schema.order).set({ providerRef }).where(eq(schema.order.id, order.id));
  }
  return redirectUrl;
}

async function applyTier(tx: Tx, eventId: string, tier: EventTier) {
  const ev = await tx.query.event.findFirst({ where: eq(schema.event.id, eventId), columns: { tier: true } });
  if (!ev || TIER_RANK[ev.tier] >= TIER_RANK[tier]) return;
  await tx.update(schema.event).set({ tier }).where(eq(schema.event.id, eventId));
}

/**
 * Marks an order paid and grants what it bought. Idempotent: webhooks may be
 * delivered more than once, and only the first transition from pending applies.
 */
export async function fulfillOrder(orderId: string, providerRef?: string): Promise<Order | null> {
  return db.transaction(async (tx) => {
    const [paid] = await tx
      .update(schema.order)
      .set({ status: "paid", paidAt: new Date(), ...(providerRef ? { providerRef } : {}) })
      .where(and(eq(schema.order.id, orderId), eq(schema.order.status, "pending")))
      .returning();
    if (!paid) return null;

    const product = PRODUCTS[paid.product as ProductId];
    if (!product) throw new Error(`Unknown product on order ${paid.id}: ${paid.product}`);

    if (product.eventTier && paid.eventId) {
      await applyTier(tx, paid.eventId, product.eventTier);
    }
    if (product.credits) {
      await tx.insert(schema.creditLedger).values({
        workspaceId: paid.workspaceId,
        kind: product.credits.kind,
        delta: product.credits.amount,
        reason: "purchase",
        orderId: paid.id,
        actorId: paid.userId,
      });
    }
    return paid;
  });
}

export async function failOrder(orderId: string, status: "failed" | "cancelled" = "failed") {
  await db
    .update(schema.order)
    .set({ status })
    .where(and(eq(schema.order.id, orderId), eq(schema.order.status, "pending")));
}

/** Spends one workspace credit to upgrade an event. Serialized per workspace to prevent double-spend. */
export async function redeemCredit(input: { workspaceId: string; eventId: string; kind: "standard" | "premium"; actorId: string }) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"credits:" + input.workspaceId}))`);

    const ev = await tx.query.event.findFirst({
      where: and(eq(schema.event.id, input.eventId), eq(schema.event.workspaceId, input.workspaceId)),
      columns: { id: true, tier: true },
    });
    if (!ev) throw new BillingError("event_required");
    if (TIER_RANK[ev.tier] >= TIER_RANK[input.kind]) throw new BillingError("already_upgraded");

    const [{ balance }] = await tx
      .select({ balance: sql<number>`coalesce(sum(${schema.creditLedger.delta}), 0)::int` })
      .from(schema.creditLedger)
      .where(and(eq(schema.creditLedger.workspaceId, input.workspaceId), eq(schema.creditLedger.kind, input.kind)));
    if (balance < 1) throw new BillingError("no_credits");

    await tx.insert(schema.creditLedger).values({
      workspaceId: input.workspaceId,
      kind: input.kind,
      delta: -1,
      reason: "redeem",
      eventId: ev.id,
      actorId: input.actorId,
    });
    await tx.update(schema.event).set({ tier: input.kind }).where(eq(schema.event.id, ev.id));
  });
}

export async function grantCredits(input: { workspaceId: string; kind: "standard" | "premium"; amount: number; note?: string }) {
  await db.insert(schema.creditLedger).values({
    workspaceId: input.workspaceId,
    kind: input.kind,
    delta: input.amount,
    reason: "grant",
    note: input.note,
  });
}
