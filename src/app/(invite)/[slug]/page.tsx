import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Invitation } from "@/components/invite/invitation";
import { PinGate } from "@/components/invite/pin-gate";
import { inviteStrings } from "@/i18n/invite";
import { formatEventDate } from "@/lib/datetime";
import { appUrl } from "@/lib/env";
import { buildInvitationProps, hasPageAccess, invitationTitle } from "@/lib/events/invitation";
import { isExpired, pick, resolveLang } from "@/lib/events/view";
import { imageUrls } from "@/lib/images";
import { entitlements } from "@/lib/plans";
import { getTheme, themeStyle } from "@/lib/themes";
import { StatusPage } from "../status-page";
import { getPublicEvent } from "./data";

type Props = PageProps<"/[slug]">;

function absolute(url: string) {
  return url.startsWith("http") ? url : appUrl(url);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const event = await getPublicEvent(slug);
  if (!event) return { title: "—", robots: { index: false, follow: false } };
  const lang = resolveLang(event, typeof sp.lang === "string" ? sp.lang : null);
  const s = inviteStrings[lang];
  const robots = { index: false, follow: false };

  // Never leak details of a PIN-protected invitation through link previews.
  if (event.visibility === "private" && entitlements(event.tier).pinProtection) {
    return { title: s.private.title, robots, openGraph: { title: s.private.title, images: [appUrl("/og-default.jpg")] } };
  }

  const title = invitationTitle(event, lang) || s.unavailable.title;
  const venue = pick(event, "venueName", lang);
  const description = [event.eventDate ? formatEventDate(event.eventDate, lang) : null, venue].filter(Boolean).join(" · ") || s.invitePhrase[event.type];
  const image = event.designMode === "upload" && event.cardImage ? absolute(imageUrls(event.cardImage).og) : appUrl("/og-default.jpg");
  return {
    title: { absolute: title },
    description,
    robots,
    openGraph: { title, description, type: "website", url: appUrl(`/${event.slug}`), images: [{ url: image }], locale: lang === "ar" ? "ar_AR" : "en_US" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PublicInvitationPage(props: Props) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  const lang = resolveLang(event, typeof sp.lang === "string" ? sp.lang : null);
  const s = inviteStrings[lang];

  if (event.status === "archived") return <StatusPage title={s.unavailable.title} body={s.unavailable.body} themeId={event.themeId} lang={lang} />;
  if (isExpired(event)) return <StatusPage title={s.expired.title} body={s.expired.body} themeId={event.themeId} lang={lang} />;

  if (!(await hasPageAccess(event))) {
    const theme = getTheme(event.themeId);
    return (
      <div className="inv" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} style={themeStyle(theme) as React.CSSProperties}>
        <PinGate eventId={event.id} lang={lang} labels={s.private} />
      </div>
    );
  }

  const props_ = await buildInvitationProps(event, { requestedLang: lang, mode: "public" });
  return <Invitation {...props_} />;
}
