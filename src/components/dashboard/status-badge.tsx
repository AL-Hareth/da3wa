import type { EventStatus, EventTier } from "@/lib/db/schema";
import type { Dict } from "@/i18n/dictionaries/ar";
import { Badge } from "../ui/badge";

export function StatusBadge({ status, t }: { status: EventStatus; t: Dict }) {
  const tone = status === "published" ? "success" : status === "archived" ? "neutral" : "warn";
  return (
    <Badge tone={tone}>
      <span className={`size-1.5 rounded-full ${status === "published" ? "bg-success" : status === "draft" ? "bg-warn" : "bg-muted"}`} />
      {t.statuses[status]}
    </Badge>
  );
}

export function TierBadge({ tier, t }: { tier: EventTier; t: Dict }) {
  return <Badge tone={tier === "free" ? "neutral" : "gold"}>{t.tiers[tier]}</Badge>;
}
