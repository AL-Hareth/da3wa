"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { failOrder, fulfillOrder } from "@/lib/billing";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { requireAppContext } from "@/lib/session";

async function loadMockOrder(orderId: string) {
  if (env().PAYMENT_PROVIDER !== "mock") throw new Error("Mock payments are disabled");
  const { workspace } = await requireAppContext();
  const order = await db.query.order.findFirst({
    where: and(eq(schema.order.id, orderId), eq(schema.order.workspaceId, workspace.id), eq(schema.order.provider, "mock")),
  });
  if (!order) throw new Error("Order not found");
  return order;
}

function returnPath(order: { eventId: string | null; id: string }, result: "success" | "cancelled") {
  const base = order.eventId ? `/dashboard/events/${order.eventId}` : "/dashboard/billing";
  return `${base}?payment=${result}&order=${order.id}`;
}

export async function completeMockOrderAction(orderId: string) {
  const order = await loadMockOrder(orderId);
  await fulfillOrder(order.id);
  redirect(returnPath(order, "success"));
}

export async function cancelMockOrderAction(orderId: string) {
  const order = await loadMockOrder(orderId);
  await failOrder(order.id, "cancelled");
  redirect(returnPath(order, "cancelled"));
}
