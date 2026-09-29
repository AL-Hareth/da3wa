import type { EventTier } from "./db/schema";

export type ProductId =
  | "event_standard"
  | "event_premium"
  | "event_premium_upgrade"
  | "credits_standard_5"
  | "credits_premium_5";

export type Product = {
  id: ProductId;
  priceCents: number;
  /** Applies a tier to one specific event. */
  eventTier?: EventTier;
  /** Only valid when the event already has this tier. */
  requiresTier?: EventTier;
  /** Adds credits to the workspace balance. */
  credits?: { kind: "standard" | "premium"; amount: number };
  name: { ar: string; en: string };
};

/** Prices are in the smallest currency unit of PRICE_CURRENCY. */
export const PRODUCTS: Record<ProductId, Product> = {
  event_standard: {
    id: "event_standard",
    priceCents: 1900,
    eventTier: "standard",
    name: { ar: "ترقية الدعوة — الباقة الأساسية", en: "Event upgrade — Standard" },
  },
  event_premium: {
    id: "event_premium",
    priceCents: 3900,
    eventTier: "premium",
    name: { ar: "ترقية الدعوة — الباقة المميزة", en: "Event upgrade — Premium" },
  },
  event_premium_upgrade: {
    id: "event_premium_upgrade",
    priceCents: 2000,
    eventTier: "premium",
    requiresTier: "standard",
    name: { ar: "الترقية من الأساسية إلى المميزة", en: "Standard → Premium upgrade" },
  },
  credits_standard_5: {
    id: "credits_standard_5",
    priceCents: 7900,
    credits: { kind: "standard", amount: 5 },
    name: { ar: "٥ أرصدة للباقة الأساسية", en: "5 Standard credits" },
  },
  credits_premium_5: {
    id: "credits_premium_5",
    priceCents: 15900,
    credits: { kind: "premium", amount: 5 },
    name: { ar: "٥ أرصدة للباقة المميزة", en: "5 Premium credits" },
  },
};

export function isProductId(v: string): v is ProductId {
  return v in PRODUCTS;
}

export function formatPrice(cents: number, currency: string, locale: "ar" | "en") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : "en", {
    style: "currency",
    currency: currency.toUpperCase(),
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
