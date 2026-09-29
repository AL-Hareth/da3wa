import { Eye } from "lucide-react";
import { BackLink } from "@/components/dashboard/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge, TierBadge } from "@/components/dashboard/status-badge";
import { buttonClass } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import { COMMON_TIMEZONES } from "@/lib/datetime";
import { appUrl, env } from "@/lib/env";
import { requireEvent } from "@/lib/events/queries";
import { displayTitle } from "@/lib/events/view";
import { imageUrls } from "@/lib/images";
import { entitlements } from "@/lib/plans";
import { THEMES } from "@/lib/themes";
import { prettyUrl } from "@/lib/urls";
import { EventEditor, type EditorEvent } from "./event-editor";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.editor.title };
}

function allTimezones(): string[] {
  const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return [...COMMON_TIMEZONES, ...all.filter((tz) => !COMMON_TIMEZONES.includes(tz))];
}

export default async function EditEventPage(props: PageProps<"/dashboard/events/[id]/edit">) {
  const { id } = await props.params;
  const [{ event, user }, { t, locale }] = await Promise.all([requireEvent(id), getI18n()]);
  const ent = entitlements(event.tier, { freePublishEnabled: env().FREE_PUBLISH_ENABLED });
  const img = event.cardImage ? imageUrls(event.cardImage) : null;

  const editorEvent: EditorEvent = {
    id: event.id,
    slug: event.slug,
    clientName: event.clientName,
    designMode: event.designMode,
    themeId: event.themeId,
    languageMode: event.languageMode,
    titleAr: event.titleAr,
    titleEn: event.titleEn,
    hostNamesAr: event.hostNamesAr,
    hostNamesEn: event.hostNamesEn,
    greetingAr: event.greetingAr,
    greetingEn: event.greetingEn,
    eventDate: event.eventDate,
    startTime: event.startTime,
    endTime: event.endTime,
    timezone: event.timezone,
    showHijriDate: event.showHijriDate,
    showCountdown: event.showCountdown,
    venueNameAr: event.venueNameAr,
    venueNameEn: event.venueNameEn,
    venueAddressAr: event.venueAddressAr,
    venueAddressEn: event.venueAddressEn,
    mapsUrl: event.mapsUrl,
    dressCodeAr: event.dressCodeAr,
    dressCodeEn: event.dressCodeEn,
    notesAr: event.notesAr,
    notesEn: event.notesEn,
    contactPhone: event.contactPhone,
    shareMessage: event.shareMessage,
    rsvpEnabled: event.rsvpEnabled,
    rsvpDeadline: event.rsvpDeadline,
    rsvpMaxPartySize: event.rsvpMaxPartySize,
    rsvpAskPhone: event.rsvpAskPhone,
    expectedInvites: event.expectedInvites,
    visibility: event.visibility,
    accessPin: event.accessPin,
    bannerType: event.bannerType,
    bannerTextAr: event.bannerTextAr,
    bannerTextEn: event.bannerTextEn,
    cardThumb: img ? { thumb: img.thumb, width: img.width, height: img.height } : null,
  };

  return (
    <>
      <PageHeader
        back={<BackLink href={`/dashboard/events/${event.id}`} label={displayTitle(event, locale) ?? t.dashboard.untitled} />}
        title={t.editor.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={event.status} t={t} />
            <TierBadge tier={event.tier} t={t} />
          </span>
        }
        actions={
          <a href={`/preview/${event.id}`} target="_blank" rel="noopener" className={buttonClass("outline")}>
            <Eye className="size-4" aria-hidden />
            {t.common.preview}
          </a>
        }
      />
      <EventEditor
        event={editorEvent}
        ent={{
          customSlug: ent.customSlug,
          bilingual: ent.bilingual,
          pinProtection: ent.pinProtection,
          allThemes: ent.allThemes,
          updateBanner: ent.updateBanner,
          rsvpLimit: ent.rsvpLimit,
        }}
        themes={THEMES.map((th) => ({ id: th.id, name: th.name[locale], free: th.free, colors: th.colors }))}
        timezones={allTimezones()}
        slugPrefix={prettyUrl(appUrl("/"))}
        isPro={user.accountType !== "individual"}
      />
    </>
  );
}
