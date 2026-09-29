import { cn } from "@/lib/cn";

export function Stat({ label, value, tone, hint }: { label: string; value: React.ReactNode; tone?: "success" | "danger" | "warn" | "muted"; hint?: React.ReactNode }) {
  const tones = { success: "text-success", danger: "text-danger", warn: "text-warn", muted: "text-muted" };
  return (
    <div className="rounded-2xl border border-line bg-paper/60 px-4 py-3.5">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular", tone && tones[tone])}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
