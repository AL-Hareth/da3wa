import type { Order } from "../db/schema";

export type CheckoutRequest = {
  order: Order;
  productName: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  locale: "ar" | "en";
};

export type WebhookResult =
  | { type: "paid"; orderId: string; providerRef: string }
  | { type: "failed"; orderId: string; providerRef?: string }
  | { type: "ignored" };

/**
 * A payment provider turns a pending order into a hosted checkout and later
 * reports the outcome. Fulfillment is provider-agnostic (see fulfillment.ts),
 * so adding a regional gateway (Tap, Moyasar, HyperPay, PayTabs...) only
 * requires implementing this interface.
 */
export interface PaymentProvider {
  readonly id: string;
  createCheckout(req: CheckoutRequest): Promise<{ redirectUrl: string; providerRef?: string }>;
  handleWebhook(req: Request): Promise<WebhookResult>;
}
