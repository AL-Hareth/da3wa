import type { EventTier } from "./db/schema";

export type Entitlements = {
  /** Whether an event on this tier may be published publicly. */
  publish: boolean;
  customSlug: boolean;
  branding: boolean;
  /** Maximum RSVP responses accepted, or null for unlimited. */
  rsvpLimit: number | null;
  qrCode: boolean;
  csvExport: boolean;
  updateBanner: boolean;
  bilingual: boolean;
  pinProtection: boolean;
  gallery: boolean;
  allThemes: boolean;
  /** Days the public page stays live after the event date. */
  lifetimeDaysAfterEvent: number;
};

export const FREE_RSVP_LIMIT = 25;

const TIERS: Record<EventTier, Omit<Entitlements, "publish">> = {
  free: {
    customSlug: false,
    branding: true,
    rsvpLimit: FREE_RSVP_LIMIT,
    qrCode: false,
    csvExport: false,
    updateBanner: false,
    bilingual: false,
    pinProtection: false,
    gallery: false,
    allThemes: false,
    lifetimeDaysAfterEvent: 7,
  },
  standard: {
    customSlug: true,
    branding: false,
    rsvpLimit: null,
    qrCode: true,
    csvExport: true,
    updateBanner: true,
    bilingual: false,
    pinProtection: false,
    gallery: false,
    allThemes: true,
    lifetimeDaysAfterEvent: 30,
  },
  premium: {
    customSlug: true,
    branding: false,
    rsvpLimit: null,
    qrCode: true,
    csvExport: true,
    updateBanner: true,
    bilingual: true,
    pinProtection: true,
    gallery: true,
    allThemes: true,
    lifetimeDaysAfterEvent: 365,
  },
};

export function entitlements(tier: EventTier, opts: { freePublishEnabled?: boolean } = {}): Entitlements {
  return { ...TIERS[tier], publish: tier !== "free" || !!opts.freePublishEnabled };
}

export const TIER_RANK: Record<EventTier, number> = { free: 0, standard: 1, premium: 2 };

export function tierAtLeast(tier: EventTier, min: EventTier) {
  return TIER_RANK[tier] >= TIER_RANK[min];
}

/** The lowest tier that unlocks a feature — used to point users at the right upgrade. */
export function requiredTierFor(feature: keyof Omit<Entitlements, "rsvpLimit" | "lifetimeDaysAfterEvent">): EventTier {
  for (const tier of ["free", "standard", "premium"] as const) {
    const ent = entitlements(tier);
    if (feature === "branding" ? !ent.branding : ent[feature]) return tier;
  }
  return "premium";
}

/** When a published page stops being served, or null if the event has no date yet. */
export function pageExpiresAt(tier: EventTier, eventEnd: Date | null): Date | null {
  if (!eventEnd) return null;
  const days = TIERS[tier].lifetimeDaysAfterEvent;
  return new Date(eventEnd.getTime() + days * 24 * 60 * 60 * 1000);
}
