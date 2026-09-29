import "server-only";
import { env } from "../env";
import { MockPaymentProvider } from "./mock";
import { StripePaymentProvider } from "./stripe";
import type { PaymentProvider } from "./types";

let provider: PaymentProvider | undefined;

export function paymentProvider(): PaymentProvider {
  if (provider) return provider;
  const e = env();
  if (e.PAYMENT_PROVIDER === "stripe") {
    if (!e.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is required when PAYMENT_PROVIDER=stripe");
    provider = new StripePaymentProvider(e.STRIPE_SECRET_KEY, e.STRIPE_WEBHOOK_SECRET);
  } else {
    provider = new MockPaymentProvider();
  }
  return provider;
}

export function paymentProviderById(id: string): PaymentProvider | null {
  const p = paymentProvider();
  return p.id === id ? p : null;
}

export type { PaymentProvider };
