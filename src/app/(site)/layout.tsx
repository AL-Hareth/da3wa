import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/i18n/client";
import { dirOf } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { plex, amiri } from "../fonts";
import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
    title: { default: t.meta.title, template: `%s · ${t.common.appName}` },
    description: t.meta.description,
    openGraph: { title: t.meta.title, description: t.meta.description, type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#fbf9f5", width: "device-width", initialScale: 1 };

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();
  return (
    <html lang={locale} dir={dirOf(locale)} className={`${plex.variable} ${amiri.variable}`}>
      <body className="min-h-dvh">
        <I18nProvider locale={locale} t={t}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
