"use client";

import { useNowSeconds } from "@/lib/use-client-value";

type Labels = { days: string; hours: string; minutes: string; seconds: string; started: string; title: string };

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

export function Countdown({ target, labels }: { target: string; labels: Labels }) {
  const targetMs = new Date(target).getTime();
  const seconds = useNowSeconds();
  const now = seconds === null ? null : seconds * 1000;

  if (now !== null && now >= targetMs) {
    return <p className="inv-display inv-accent text-center text-2xl">{labels.started}</p>;
  }
  const p = now === null ? null : parts(targetMs - now);
  const units = [
    ["days", labels.days],
    ["hours", labels.hours],
    ["minutes", labels.minutes],
    ["seconds", labels.seconds],
  ] as const;

  return (
    <div role="timer" aria-label={labels.title}>
      <p className="inv-muted mb-3 text-center text-xs tracking-[0.2em] uppercase">{labels.title}</p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {units.map(([key, label]) => (
          <div key={key} className="inv-surface rounded-2xl px-1 py-3 text-center">
            <div className="inv-display text-3xl leading-none tabular sm:text-4xl" suppressHydrationWarning>
              {p ? String(p[key]).padStart(2, "0") : "··"}
            </div>
            <div className="inv-muted mt-1.5 text-[0.7rem] sm:text-xs">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
