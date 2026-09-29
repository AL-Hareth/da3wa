import type { Theme } from "@/lib/themes";
import { cn } from "@/lib/cn";
import { Ornament } from "./ornament";

/** Generated invitation card for events that don't upload their own design. */
export function TemplateCard({
  theme,
  greeting,
  names,
  phrase,
  title,
  date,
  time,
  venue,
}: {
  theme: Theme;
  greeting: string | null;
  names: string | null;
  phrase: string;
  title: string | null;
  date: string | null;
  time: string | null;
  venue: string | null;
}) {
  const arch = theme.ornament === "arch";
  return (
    <div className="inv-surface inv-reveal relative mx-auto w-full max-w-md rounded-[2rem] p-3 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.35)]">
      <div
        className={cn(
          "relative flex min-h-[30rem] flex-col items-center justify-center gap-4 border px-6 py-12 text-center",
          arch ? "rounded-t-[12rem] rounded-b-[1.5rem]" : "rounded-[1.5rem]",
        )}
        style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 45%, transparent)" }}
      >
        <div
          aria-hidden
          className={cn("pointer-events-none absolute inset-2 border", arch ? "rounded-t-[11.5rem] rounded-b-[1.1rem]" : "rounded-[1.1rem]")}
          style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 20%, transparent)" }}
        />
        <Ornament kind={theme.ornament === "arch" ? "geometric" : theme.ornament} className="w-52" />
        {greeting && <p className="inv-display inv-muted text-lg">{greeting}</p>}
        {names && <h1 className="inv-display inv-accent text-5xl leading-[1.25] text-balance sm:text-6xl">{names}</h1>}
        <p className="inv-muted max-w-xs text-base leading-relaxed text-balance">{phrase}</p>
        {title && !names && <h1 className="inv-display inv-accent text-4xl leading-tight">{title}</h1>}
        {(date || venue) && (
          <div className="mt-2 space-y-1 text-sm leading-relaxed">
            {date && <p className="font-medium">{date}</p>}
            {time && <p className="inv-muted tabular">{time}</p>}
            {venue && <p className="inv-muted">{venue}</p>}
          </div>
        )}
        <Ornament kind={theme.ornament === "arch" ? "geometric" : theme.ornament} className="w-40 rotate-180 opacity-80" />
      </div>
    </div>
  );
}
