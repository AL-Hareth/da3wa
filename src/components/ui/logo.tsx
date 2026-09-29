import { cn } from "@/lib/cn";

export function Logo({ locale, className }: { locale: "ar" | "en"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-2xl leading-none font-bold text-ink", className)}>
      <svg viewBox="0 0 32 32" className="size-7 text-gold" aria-hidden>
        <path
          fill="currentColor"
          d="M16 2c1.2 3.6 3.4 5.8 7 7-3.6 1.2-5.8 3.4-7 7-1.2-3.6-3.4-5.8-7-7 3.6-1.2 5.8-3.4 7-7Zm0 14c.8 2.4 2.3 3.9 4.7 4.7-2.4.8-3.9 2.3-4.7 4.7-.8-2.4-2.3-3.9-4.7-4.7 2.4-.8 3.9-2.3 4.7-4.7Z"
        />
        <path fill="none" stroke="currentColor" strokeWidth="1.4" d="M5 29.5h22" opacity=".5" />
      </svg>
      <span>{locale === "ar" ? "دعوة" : "Da3wa"}</span>
    </span>
  );
}
