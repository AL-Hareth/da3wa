import { CalendarPlus, Clock, MapPin, Navigation, Phone, Shirt, StickyNote, Megaphone, CalendarClock, MapPinned } from "lucide-react";
import Link from "next/link";
import type { Event } from "@/lib/db/schema";
import { formatEventDate, formatHijriDate, formatTime } from "@/lib/datetime";
import { displayTitle, pick, type Lang } from "@/lib/events/view";
import type { ImageUrls } from "@/lib/images";
import { getTheme, themeStyle } from "@/lib/themes";
import { fmt } from "@/i18n/config";
import { inviteStrings } from "@/i18n/invite";
import { Countdown } from "./countdown";
import { Ornament } from "./ornament";
import { RsvpForm } from "./rsvp-form";
import { InviteShare } from "./share-buttons";
import { TemplateCard } from "./template-card";
import { ViewBeacon } from "./view-beacon";

export type InvitationProps = {
  event: Event;
  lang: Lang;
  langs: Lang[];
  mode: "public" | "preview";
  pageUrl: string;
  langHref: Partial<Record<Lang, string>>;
  calendar: { ics: string; google: string } | null;
  cardImage: ImageUrls | null;
  photos: ImageUrls[];
  rsvp: {
    show: boolean;
    open: boolean;
    full: boolean;
    existing: { fullName: string; status: "attending" | "not_attending" | "maybe"; partySize: number; phone: string | null; note: string | null } | null;
  };
  banner: boolean;
  branding: boolean;
  appUrl: string;
  turnstileSiteKey?: string;
};

export function mapsHref(event: Event, lang: Lang): string | null {
  if (event.mapsUrl) return event.mapsUrl;
  const q = [pick(event, "venueName", lang), pick(event, "venueAddress", lang)].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

export function shareMessage(event: Event, lang: Lang): string {
  if (event.shareMessage) return event.shareMessage;
  const s = inviteStrings[lang];
  const title = [pick(event, "title", lang), pick(event, "hostNames", lang)].filter(Boolean).join(" — ");
  const date = event.eventDate ? formatEventDate(event.eventDate, lang) : "";
  return fmt(s.defaultShare, { title, date }).replace(/\n\n/g, "\n");
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="inv-accent mt-0.5 shrink-0" aria-hidden>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="inv-muted text-xs tracking-wide">{label}</p>
        <div className="mt-1 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`inv-surface inv-reveal rounded-[1.75rem] px-5 py-6 sm:px-7 sm:py-8 ${className}`}>{children}</section>;
}

export function Invitation(p: InvitationProps) {
  const { event, lang } = p;
  const s = inviteStrings[lang];
  const theme = getTheme(event.themeId);
  const names = pick(event, "hostNames", lang);
  const title = pick(event, "title", lang);
  const greeting = pick(event, "greeting", lang);
  const venueName = pick(event, "venueName", lang);
  const venueAddress = pick(event, "venueAddress", lang);
  const dressCode = pick(event, "dressCode", lang);
  const notes = pick(event, "notes", lang);
  const bannerText = pick(event, "bannerText", lang);
  const date = event.eventDate ? formatEventDate(event.eventDate, lang) : null;
  const hijri = event.eventDate && event.showHijriDate ? formatHijriDate(event.eventDate, lang) : null;
  const time = event.startTime
    ? event.endTime
      ? `${formatTime(event.startTime, lang)} ${s.to} ${formatTime(event.endTime, lang)}`
      : formatTime(event.startTime, lang)
    : null;
  const maps = mapsHref(event, lang);
  const phrase = s.invitePhrase[event.type];
  const heading = displayTitle(event, lang) ?? "";
  const BannerIcon = event.bannerType === "time_change" ? CalendarClock : event.bannerType === "venue_change" ? MapPinned : Megaphone;

  return (
    <div className="inv" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} data-ornament={theme.ornament} style={themeStyle(theme) as React.CSSProperties}>
      {p.mode === "preview" && (
        <div className="sticky top-0 z-20 bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">{s.previewBanner}</div>
      )}

      {p.banner && event.bannerType && bannerText && (
        <div className="inv-btn px-4 py-3" role="status">
          <div className="mx-auto flex max-w-xl items-start gap-3">
            <BannerIcon className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="text-sm leading-relaxed">
              <strong className="font-semibold">{s.bannerLabels[event.bannerType]}: </strong>
              {bannerText}
            </p>
          </div>
        </div>
      )}

      <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 pt-5 pb-10 sm:gap-6 sm:px-6 sm:pt-8">
        {p.langs.length > 1 && (
          <nav className="flex justify-end" aria-label="Language">
            <div className="inv-surface inline-flex rounded-full p-1 text-sm">
              {p.langs.map((l) => (
                <Link
                  key={l}
                  href={p.langHref[l] ?? "?"}
                  hrefLang={l}
                  aria-current={l === lang ? "true" : undefined}
                  className={`rounded-full px-3.5 py-1 ${l === lang ? "inv-btn" : "inv-muted"}`}
                  replace
                  scroll={false}
                >
                  {l === "ar" ? "عربي" : "English"}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* Invitation card */}
        {event.designMode === "upload" && p.cardImage ? (
          <figure className="inv-reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.cardImage.src}
              srcSet={p.cardImage.srcSet}
              sizes="(max-width: 640px) 100vw, 576px"
              width={p.cardImage.width}
              height={p.cardImage.height}
              alt={heading || title || ""}
              fetchPriority="high"
              decoding="async"
              className="mx-auto h-auto w-full rounded-[1.5rem] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)]"
              style={{ backgroundImage: `url(${p.cardImage.blurDataUrl})`, backgroundSize: "cover" }}
            />
          </figure>
        ) : (
          <TemplateCard theme={theme} greeting={greeting} names={names} phrase={phrase} title={title} date={date} time={time} venue={venueName} />
        )}

        {/* Heading (the uploaded card already shows it visually; keep it for bilingual/SEO/accessibility) */}
        {event.designMode === "upload" && p.cardImage && (
          <header className="inv-reveal px-2 pt-2 text-center">
            <Ornament kind={theme.ornament === "arch" ? "geometric" : theme.ornament} className="mb-3 w-44" />
            {names && <h1 className="inv-display text-4xl leading-[1.3] text-balance sm:text-5xl">{names}</h1>}
            {title && <p className={`${names ? "inv-muted mt-2 text-lg" : "inv-display text-4xl"} text-balance`}>{title}</p>}
          </header>
        )}

        {event.showCountdown && event.startsAt && (
          <Section>
            <Countdown target={event.startsAt.toISOString()} labels={s.countdown} />
          </Section>
        )}

        {/* Details */}
        <Section className="space-y-6">
          {date && (
            <DetailRow icon={<Clock className="size-5" />} label={s.when}>
              <p className="text-lg font-medium">{date}</p>
              {hijri && <p className="inv-muted text-sm">{hijri}</p>}
              {time && <p className="inv-muted mt-0.5 tabular">{time}</p>}
            </DetailRow>
          )}
          {(venueName || venueAddress) && (
            <DetailRow icon={<MapPin className="size-5" />} label={s.where}>
              {venueName && <p className="text-lg font-medium">{venueName}</p>}
              {venueAddress && <p className="inv-muted text-sm">{venueAddress}</p>}
            </DetailRow>
          )}
          {dressCode && (
            <DetailRow icon={<Shirt className="size-5" />} label={s.dressCode}>
              <p>{dressCode}</p>
            </DetailRow>
          )}
          {notes && (
            <DetailRow icon={<StickyNote className="size-5" />} label={s.notes}>
              <p className="whitespace-pre-line">{notes}</p>
            </DetailRow>
          )}
          {event.contactPhone && (
            <DetailRow icon={<Phone className="size-5" />} label={s.contact}>
              <a href={`tel:${event.contactPhone.replace(/[^\d+]/g, "")}`} dir="ltr" className="inv-accent underline-offset-4 hover:underline">
                {event.contactPhone}
              </a>
            </DetailRow>
          )}

          {(maps || p.calendar) && (
            <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
              {maps && (
                <a href={maps} target="_blank" rel="noopener noreferrer" className="inv-btn flex h-12 items-center justify-center gap-2 rounded-full font-medium">
                  <Navigation className="size-4" aria-hidden />
                  {s.directions}
                </a>
              )}
              {p.calendar && (
                <details className="group relative">
                  <summary className="inv-btn-outline flex h-12 cursor-pointer list-none items-center justify-center gap-2 rounded-full font-medium [&::-webkit-details-marker]:hidden">
                    <CalendarPlus className="size-4" aria-hidden />
                    {s.addToCalendar}
                  </summary>
                  <div className="inv-surface absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-2xl text-sm shadow-lg">
                    <a href={p.calendar.ics} className="block px-4 py-3 hover:opacity-80">
                      {s.appleCalendar}
                    </a>
                    <a href={p.calendar.google} target="_blank" rel="noopener noreferrer" className="inv-border block border-t px-4 py-3 hover:opacity-80">
                      {s.googleCalendar}
                    </a>
                  </div>
                </details>
              )}
            </div>
          )}
        </Section>

        {/* RSVP */}
        {p.rsvp.show && (
          <Section>
            <div className="mb-6 text-center">
              <h2 className="inv-display text-3xl">{s.rsvp.title}</h2>
              <p className="inv-muted mt-1.5 text-sm">{s.rsvp.subtitle}</p>
              {event.rsvpDeadline && p.rsvp.open && (
                <p className="inv-accent mt-2 text-sm">{fmt(s.rsvp.deadline, { date: formatEventDate(event.rsvpDeadline, lang) })}</p>
              )}
            </div>
            {!p.rsvp.open ? (
              <p className="inv-muted text-center">{s.rsvp.closed}</p>
            ) : p.rsvp.full && !p.rsvp.existing ? (
              <p className="inv-muted text-center">{s.rsvp.full}</p>
            ) : (
              <RsvpForm
                eventId={event.id}
                lang={lang}
                s={s.rsvp}
                maxParty={event.rsvpMaxPartySize}
                askPhone={event.rsvpAskPhone}
                existing={p.rsvp.existing}
                disabled={p.mode === "preview"}
                turnstileSiteKey={p.turnstileSiteKey}
              />
            )}
          </Section>
        )}

        {/* Gallery */}
        {p.photos.length > 0 && (
          <Section>
            <h2 className="inv-display mb-5 text-center text-3xl">{s.gallery}</h2>
            <div className="columns-2 gap-2.5 [&>*]:mb-2.5">
              {p.photos.map((ph, i) => (
                <a key={i} href={ph.src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ph.thumb}
                    srcSet={ph.srcSet}
                    sizes="(max-width: 640px) 50vw, 280px"
                    width={ph.width}
                    height={ph.height}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full"
                    style={{ backgroundImage: `url(${ph.blurDataUrl})`, backgroundSize: "cover" }}
                  />
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Share */}
        <Section>
          <InviteShare
            url={p.pageUrl}
            message={shareMessage(event, lang)}
            title={heading}
            labels={{ whatsapp: s.shareWhatsapp, share: s.share, copy: s.copyLink, copied: s.copied }}
          />
        </Section>

        <footer className="pt-2 text-center">
          <Ornament kind={theme.ornament === "arch" ? "geometric" : theme.ornament} className="w-32 opacity-70" />
          {p.branding && (
            <a href={p.appUrl} className="inv-muted mt-4 inline-block text-xs hover:underline">
              {s.madeWith} · {s.createYours}
            </a>
          )}
        </footer>
      </main>
      {p.mode === "public" && <ViewBeacon eventId={event.id} />}
    </div>
  );
}
