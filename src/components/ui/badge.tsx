import { cn } from "@/lib/cn";

type Tone = "neutral" | "gold" | "success" | "warn" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-paper text-ink-soft border-line",
  gold: "bg-gold-soft text-gold-dark border-[#eadcc3]",
  success: "bg-success-soft text-success border-[#cfe7da]",
  warn: "bg-warn-soft text-warn border-[#f3dfbd]",
  danger: "bg-danger-soft text-danger border-[#f2d3d1]",
};

export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone], className)}
      {...props}
    />
  );
}
