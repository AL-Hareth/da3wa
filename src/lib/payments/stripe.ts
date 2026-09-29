import "server-only";
import Stripe from "stripe";
import type { CheckoutRequest, PaymentProvider, WebhookResult } from "./types";

export class StripePaymentProvider implements PaymentProvider {
  readonly id = "stripe";
  private stripe: Stripe;

  constructor(
    secretKey: string,
    private webhookSecret: string | undefined,
  ) {
    this.stripe = new Stripe(secretKey);
  }

  async createCheckout(req: CheckoutRequest) {
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: req.order.id,
      customer_email: req.customerEmail,
      locale: req.locale === "ar" ? "auto" : "en",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: req.order.currency,
            unit_amount: req.order.amountCents,
            product_data: { name: req.productName },
          },
        },
      ],
      metadata: { orderId: req.order.id },
      payment_intent_data: { metadata: { orderId: req.order.id } },
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { redirectUrl: session.url, providerRef: session.id };
  }

  async handleWebhook(req: Request): Promise<WebhookResult> {
    if (!this.webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("Missing Stripe signature");
    const payload = await req.text();
    const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object;
        const orderId = s.metadata?.orderId ?? s.client_reference_id;
        if (!orderId) return { type: "ignored" };
        if (s.payment_status !== "paid") return { type: "ignored" };
        return { type: "paid", orderId, providerRef: s.id };
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const s = event.data.object;
        const orderId = s.metadata?.orderId ?? s.client_reference_id;
        return orderId ? { type: "failed", orderId, providerRef: s.id } : { type: "ignored" };
      }
      default:
        return { type: "ignored" };
    }
  }
}
