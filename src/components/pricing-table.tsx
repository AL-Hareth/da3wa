import { Check } from "lucide-react";
import type { Dict } from "@/i18n/dictionaries/ar";
import { fmt } from "@/i18n/config";
import { FREE_RSVP_LIMIT } from "@/lib/plans";
import { cn } from "@/lib/cn";
import { ButtonLink } from "./ui/button";

export function PricingTable({ t, prices, cta }: { t: Dict; prices: { standard: string; premium: string; free: string }; cta: string }) {
  const f = t.pricing.features;
  const plans = [
    { id: "free" as const, price: prices.free, features: [f.drafts, f.limitedThemes, fmt(f.limitedRsvp, { n: FREE_RSVP_LIMIT }), f.branding], highlight: false },
    { id: "standard" as const, price: prices.standard, features: [f.publish, f.customSlug, f.noBranding, f.unlimitedRsvp, f.qr, f.csv, f.updates, f.allThemes], highlight: true },
    { id: "premium" as const, price: prices.premium, features: [f.everythingStandard, f.bilingual, f.pin, f.gallery, f.lifetime], highlight: false },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((p) => (
        <div
          key={p.id}
          className={cn(
            "flex flex-col rounded-3xl border bg-card p-6 shadow-soft",
            p.highlight ? "border-gold ring-4 ring-gold/10" : "border-line",
          )}
        >
          <h3 className="text-lg font-semibold">{t.pricing[p.id].name}</h3>
          <p className="mt-1 text-sm text-muted">{t.pricing[p.id].tagline}</p>
          <p className="mt-5 flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tabular">{p.price}</span>
            {p.id !== "free" && <span className="text-sm text-muted">{t.pricing.perEvent}</span>}
          </p>
          <ul className="mt-6 flex-1 space-y-2.5 text-sm">
            {p.features.map((feat) => (
              <li key={feat} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                {feat}
              </li>
            ))}
          </ul>
          <ButtonLink href="/signup" variant={p.highlight ? "primary" : "outline"} className="mt-7 w-full">
            {cta}
          </ButtonLink>
        </div>
      ))}
    </div>
  );
}
