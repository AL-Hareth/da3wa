import type { Ornament as OrnamentKind } from "@/lib/themes";
import { cn } from "@/lib/cn";

function FloralHalf() {
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <path strokeWidth="0.9" d="M112 24 C 98 25, 88 17, 72 18 C 56 19, 48 29, 30 27 C 20 26, 13 22, 6 23" />
      <path strokeWidth="0.7" d="M84 19.5 C 80 12, 74 9, 68 9" />
      <path strokeWidth="0.7" d="M52 24 C 50 32, 44 36, 38 37" />
      <g fill="currentColor" stroke="none">
        <path d="M0 0c4-4.2 11-4.2 15 0-4 4.2-11 4.2-15 0z" transform="translate(100 23.5) rotate(-155)" />
        <path d="M0 0c4-4.2 11-4.2 15 0-4 4.2-11 4.2-15 0z" transform="translate(94 21.5) rotate(150)" opacity=".7" />
        <path d="M0 0c3.4-3.6 9.4-3.6 12.8 0-3.4 3.6-9.4 3.6-12.8 0z" transform="translate(68 9) rotate(180)" opacity=".85" />
        <path d="M0 0c3.4-3.6 9.4-3.6 12.8 0-3.4 3.6-9.4 3.6-12.8 0z" transform="translate(76 18) rotate(-150)" />
        <path d="M0 0c3.4-3.6 9.4-3.6 12.8 0-3.4 3.6-9.4 3.6-12.8 0z" transform="translate(62 20) rotate(160)" opacity=".7" />
        <path d="M0 0c3.4-3.6 9.4-3.6 12.8 0-3.4 3.6-9.4 3.6-12.8 0z" transform="translate(38 37) rotate(170)" opacity=".85" />
        <path d="M0 0c3-3.2 8.2-3.2 11.2 0-3 3.2-8.2 3.2-11.2 0z" transform="translate(44 27.5) rotate(-165)" />
        <path d="M0 0c3-3.2 8.2-3.2 11.2 0-3 3.2-8.2 3.2-11.2 0z" transform="translate(28 27) rotate(150)" opacity=".7" />
        <circle cx="6" cy="23" r="1.4" />
        <circle cx="68" cy="9" r="1" />
      </g>
    </g>
  );
}

function Floral() {
  return (
    <>
      <FloralHalf />
      <g transform="translate(240 0) scale(-1 1)">
        <FloralHalf />
      </g>
      <g transform="translate(120 24)" fill="currentColor">
        <g opacity=".9">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} rx="3.2" ry="7" transform={`rotate(${r}) translate(0 -6.2)`} />
          ))}
        </g>
        <circle r="3.2" style={{ fill: "var(--inv-bg, #fff)" }} />
        <circle r="1.6" />
      </g>
    </>
  );
}

function Geometric() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="0.9">
      <path d="M8 24 H 92" />
      <path d="M148 24 H 232" />
      <path d="M60 24 l6 -4 l6 4 l-6 4z" />
      <path d="M168 24 l6 -4 l6 4 l-6 4z" />
      <g transform="translate(120 24)">
        <rect x="-12" y="-12" width="24" height="24" />
        <rect x="-12" y="-12" width="24" height="24" transform="rotate(45)" />
        <circle r="6" />
        <circle r="2" fill="currentColor" />
      </g>
      <path d="M92 24 l6 -3 v6z" fill="currentColor" />
      <path d="M148 24 l-6 -3 v6z" fill="currentColor" />
    </g>
  );
}

function Minimal() {
  return (
    <g stroke="currentColor" strokeWidth="0.8" fill="none">
      <path d="M70 24 H 112" />
      <path d="M128 24 H 170" />
      <path d="M120 19 l5 5 l-5 5 l-5 -5z" fill="currentColor" />
    </g>
  );
}

export function Ornament({ kind, className }: { kind: OrnamentKind; className?: string }) {
  return (
    <svg viewBox="0 0 240 48" className={cn("inv-accent mx-auto h-auto", className)} aria-hidden focusable="false">
      {kind === "floral" ? <Floral /> : kind === "minimal" ? <Minimal /> : <Geometric />}
    </svg>
  );
}
