import "server-only";
import type { PaymentProvider } from "./types";

/**
 * Development/test provider: redirects to an in-app confirmation page where the
 * signed-in owner can simulate a successful or cancelled payment.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly id = "mock";

  async createCheckout({ order }: Parameters<PaymentProvider["createCheckout"]>[0]) {
    return { redirectUrl: `/dashboard/billing/checkout/${order.id}`, providerRef: `mock_${order.id}` };
  }

  async handleWebhook() {
    return { type: "ignored" as const };
  }
}
