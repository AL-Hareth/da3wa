import { getTheme, themeStyle } from "@/lib/themes";
import { Ornament } from "@/components/invite/ornament";

/** Minimal themed page for unavailable / expired invitations. */
export function StatusPage({ title, body, themeId, lang = "ar" }: { title: string; body: string; themeId?: string; lang?: "ar" | "en" }) {
  const theme = getTheme(themeId);
  return (
    <div className="inv flex items-center justify-center px-6" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} data-ornament={theme.ornament} style={themeStyle(theme) as React.CSSProperties}>
      <div className="max-w-sm py-24 text-center">
        <Ornament kind={theme.ornament === "arch" ? "geometric" : theme.ornament} className="w-52" />
        <h1 className="inv-display mt-6 text-4xl">{title}</h1>
        <p className="inv-muted mt-3 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
