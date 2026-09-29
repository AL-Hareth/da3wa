export type Ornament = "floral" | "geometric" | "arch" | "minimal";
export type DisplayFont = "amiri" | "ruqaa" | "messiri" | "kufi";

export type Theme = {
  id: string;
  free: boolean;
  name: { ar: string; en: string };
  ornament: Ornament;
  displayFont: DisplayFont;
  colors: {
    /** Page background */
    bg: string;
    /** Card / section surface */
    surface: string;
    ink: string;
    muted: string;
    accent: string;
    /** Text on accent backgrounds */
    onAccent: string;
    border: string;
  };
};

export const THEMES: Theme[] = [
  {
    id: "ivory-gold",
    free: true,
    name: { ar: "عاجي وذهبي", en: "Ivory & Gold" },
    ornament: "floral",
    displayFont: "amiri",
    colors: {
      bg: "#fbf8f2",
      surface: "#ffffff",
      ink: "#2d2620",
      muted: "#7c7063",
      accent: "#a88748",
      onAccent: "#ffffff",
      border: "#eadfca",
    },
  },
  {
    id: "modern-minimal",
    free: true,
    name: { ar: "بسيط وعصري", en: "Modern Minimal" },
    ornament: "minimal",
    displayFont: "kufi",
    colors: {
      bg: "#f6f6f4",
      surface: "#ffffff",
      ink: "#1c1c1c",
      muted: "#6b6b6b",
      accent: "#1c1c1c",
      onAccent: "#ffffff",
      border: "#e3e3df",
    },
  },
  {
    id: "blush-rose",
    free: false,
    name: { ar: "وردي ناعم", en: "Blush Rose" },
    ornament: "floral",
    displayFont: "ruqaa",
    colors: {
      bg: "#fcf4f2",
      surface: "#ffffff",
      ink: "#3b2a2a",
      muted: "#8d7270",
      accent: "#b76e6e",
      onAccent: "#ffffff",
      border: "#f0dcd8",
    },
  },
  {
    id: "emerald-night",
    free: false,
    name: { ar: "ليلة زمردية", en: "Emerald Night" },
    ornament: "geometric",
    displayFont: "messiri",
    colors: {
      bg: "#0f2a24",
      surface: "#143630",
      ink: "#f3ecdc",
      muted: "#b9c3b5",
      accent: "#d4b16a",
      onAccent: "#10261f",
      border: "#2a4d45",
    },
  },
  {
    id: "royal-navy",
    free: false,
    name: { ar: "كحلي ملكي", en: "Royal Navy" },
    ornament: "arch",
    displayFont: "amiri",
    colors: {
      bg: "#101a33",
      surface: "#16223f",
      ink: "#f4efe4",
      muted: "#aab3c8",
      accent: "#c9a45c",
      onAccent: "#101a33",
      border: "#2a3656",
    },
  },
  {
    id: "sage-garden",
    free: false,
    name: { ar: "حديقة المريمية", en: "Sage Garden" },
    ornament: "floral",
    displayFont: "messiri",
    colors: {
      bg: "#f3f5ef",
      surface: "#ffffff",
      ink: "#27302a",
      muted: "#6c7a6f",
      accent: "#6f8a6a",
      onAccent: "#ffffff",
      border: "#dbe3d6",
    },
  },
];

export const DEFAULT_THEME_ID = "ivory-gold";

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function themeStyle(theme: Theme): Record<string, string> {
  const c = theme.colors;
  return {
    "--inv-bg": c.bg,
    "--inv-surface": c.surface,
    "--inv-ink": c.ink,
    "--inv-muted": c.muted,
    "--inv-accent": c.accent,
    "--inv-on-accent": c.onAccent,
    "--inv-border": c.border,
    "--inv-display": `var(--font-${theme.displayFont})`,
  };
}
