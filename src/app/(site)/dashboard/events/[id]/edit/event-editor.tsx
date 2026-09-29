"use client";

import { Check, ExternalLink, Loader2, Lock, Monitor, Smartphone } from "lucide-react";
import { startTransition, useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea, Toggle } from "@/components/ui/form";
import { saveEventAction, type ActionState } from "../../actions";
import { BannerForm } from "./banner-form";
import { CardUploader } from "./card-uploader";

export type EditorEvent = {
  id: string;
  slug: string;
  clientName: string | null;
  designMode: "upload" | "template";
  themeId: string;
  languageMode: "ar" | "en" | "bilingual";
  titleAr: string | null;
  titleEn: string | null;
  hostNamesAr: string | null;
  hostNamesEn: string | null;
  greetingAr: string | null;
  greetingEn: string | null;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  showHijriDate: boolean;
  showCountdown: boolean;
  venueNameAr: string | null;
  venueNameEn: string | null;
  venueAddressAr: string | null;
  venueAddressEn: string | null;
  mapsUrl: string | null;
  dressCodeAr: string | null;
  dressCodeEn: string | null;
  notesAr: string | null;
  notesEn: string | null;
  contactPhone: string | null;
  shareMessage: string | null;
  rsvpEnabled: boolean;
  rsvpDeadline: string | null;
  rsvpMaxPartySize: number;
  rsvpAskPhone: boolean;
  expectedInvites: number | null;
  visibility: "public" | "private";
  accessPin: string | null;
  bannerType: "announcement" | "time_change" | "venue_change" | null;
  bannerTextAr: string | null;
  bannerTextEn: string | null;
  cardThumb: { thumb: string; width: number; height: number } | null;
};

type ThemeOption = { id: string; name: string; free: boolean; colors: { bg: string; accent: string; ink: string; border: string } };

type Props = {
  event: EditorEvent;
  ent: { customSlug: boolean; bilingual: boolean; pinProtection: boolean; allThemes: boolean; updateBanner: boolean; rsvpLimit: number | null };
  themes: ThemeOption[];
  timezones: string[];
  slugPrefix: string;
  isPro: boolean;
};

const TABS = ["design", "details", "venue", "rsvp", "sharing", "updates"] as const;
type Tab = (typeof TABS)[number];

const FIELD_TAB: Record<string, Tab> = {
  themeId: "design",
  languageMode: "details",
  eventDate: "details",
  startTime: "details",
  endTime: "details",
  timezone: "details",
  contactPhone: "details",
  mapsUrl: "venue",
  rsvpDeadline: "rsvp",
  rsvpMaxPartySize: "rsvp",
  expectedInvites: "rsvp",
  slug: "sharing",
  visibility: "sharing",
  accessPin: "sharing",
};

function LockedNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gold-dark">
      <Lock className="size-3.5" aria-hidden />
      {children}
    </p>
  );
}

export function EventEditor({ event, ent, themes, timezones, slugPrefix, isPro }: Props) {
  const { t } = useI18n();
  const ed = t.editor;
  const [tab, setTab] = useState<Tab>("design");
  const [state, action, saving] = useActionState<ActionState, FormData>(saveEventAction.bind(null, event.id), null);
  const [previewKey, setPreviewKey] = useState(0);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [dirty, setDirty] = useState(false);
  const [langMode, setLangMode] = useState(event.languageMode);
  const [designMode, setDesignMode] = useState(event.designMode);
  const [visibility, setVisibility] = useState(event.visibility);
  const [rsvpOn, setRsvpOn] = useState(event.rsvpEnabled);
  const formRef = useRef<HTMLFormElement>(null);

  const refreshPreview = useCallback(() => setPreviewKey((k) => k + 1), []);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const err = (name: string) => errors[name] ?? null;

  // React to a new save result during render (avoids cascading effect updates).
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) {
      setDirty(false);
      setPreviewKey((k) => k + 1);
    } else if (state?.fieldErrors) {
      const first = Object.keys(state.fieldErrors)[0];
      if (first && FIELD_TAB[first]) setTab(FIELD_TAB[first]);
    }
  }

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const showAr = langMode !== "en";
  const showEn = langMode !== "ar";
  const tzOptions = useMemo(() => (timezones.includes(event.timezone) ? timezones : [event.timezone, ...timezones]), [timezones, event.timezone]);

  const sectionClass = (name: Tab) => cn("space-y-5", tab !== name && "hidden");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="min-w-0">
        {/* Tabs */}
        <div className="sticky top-[57px] z-20 -mx-4 mb-5 overflow-x-auto border-b border-line bg-paper/95 px-4 backdrop-blur sm:mx-0 sm:px-0" role="tablist">
          <div className="flex gap-1">
            {TABS.map((name) => (
              <button
                key={name}
                role="tab"
                type="button"
                aria-selected={tab === name}
                onClick={() => setTab(name)}
                className={cn(
                  "relative px-3.5 py-3 text-sm whitespace-nowrap transition-colors",
                  tab === name ? "font-semibold text-ink after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-gold" : "text-muted hover:text-ink",
                  Object.keys(errors).some((f) => FIELD_TAB[f] === name) && "text-danger",
                )}
              >
                {ed.tabs[name]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-7">
          {/* Out-of-form panels (they have their own forms) */}
          {tab === "design" && (
            <div className="mb-6 space-y-5 border-b border-line pb-6">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink-soft">{ed.design.mode}</legend>
                <div className="inline-flex rounded-full border border-line-strong bg-paper p-1">
                  {(["upload", "template"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setDesignMode(m);
                        setDirty(true);
                      }}
                      className={cn("rounded-full px-4 py-1.5 text-sm", designMode === m ? "bg-ink text-white" : "text-ink-soft")}
                      aria-pressed={designMode === m}
                    >
                      {ed.design[m]}
                    </button>
                  ))}
                </div>
              </fieldset>
              {designMode === "upload" && <CardUploader eventId={event.id} current={event.cardThumb} onChanged={refreshPreview} />}
            </div>
          )}
          {tab === "updates" && (
            <BannerForm
              eventId={event.id}
              locked={!ent.updateBanner}
              current={{ type: event.bannerType, textAr: event.bannerTextAr, textEn: event.bannerTextEn }}
              showAr={showAr}
              showEn={showEn}
              onChanged={refreshPreview}
            />
          )}

          <form
            ref={formRef}
            // Submitted manually (not via the `action` prop) so React doesn't reset the form after saving,
            // which would desync the controlled radios from their state.
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(() => action(fd));
            }}
            onChange={() => setDirty(true)}
            noValidate className={cn(tab === "updates" && "hidden")}>
            <input type="hidden" name="designMode" value={designMode} />

            {/* Design */}
            <section className={sectionClass("design")}>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink-soft">{ed.design.theme}</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {themes.map((th) => {
                    const locked = !th.free && !ent.allThemes && th.id !== event.themeId;
                    return (
                      <label
                        key={th.id}
                        className={cn(
                          "relative flex flex-col overflow-hidden rounded-2xl border-2 border-transparent ring-1 ring-line transition has-checked:border-gold",
                          locked ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:ring-line-strong",
                        )}
                      >
                        <input type="radio" name="themeId" value={th.id} defaultChecked={event.themeId === th.id} disabled={locked} className="peer sr-only" />
                        <span className="flex h-16 items-end gap-1.5 p-2.5" style={{ background: th.colors.bg }}>
                          <span className="size-5 rounded-full" style={{ background: th.colors.accent }} />
                          <span className="size-5 rounded-full border" style={{ background: th.colors.ink, borderColor: th.colors.border }} />
                        </span>
                        <span className="flex items-center justify-between gap-1 bg-card px-2.5 py-2 text-xs font-medium">
                          {th.name}
                          {locked ? <Lock className="size-3.5 text-muted" aria-hidden /> : <Check className="size-3.5 text-gold opacity-0 peer-checked:opacity-100" aria-hidden />}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {!ent.allThemes && <LockedNote>{ed.design.themeLocked}</LockedNote>}
                {err("themeId") && <p className="mt-1.5 text-sm text-danger">{err("themeId")}</p>}
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <Toggle name="showCountdown" label={ed.design.countdown} defaultChecked={event.showCountdown} />
                <Toggle name="showHijriDate" label={ed.design.hijri} defaultChecked={event.showHijriDate} />
              </div>
            </section>

            {/* Details */}
            <section className={sectionClass("details")}>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink-soft">{ed.details.languageMode}</legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["ar", ed.details.langAr],
                      ["en", ed.details.langEn],
                      ["bilingual", ed.details.langBoth],
                    ] as const
                  ).map(([value, label]) => {
                    const locked = value === "bilingual" && !ent.bilingual && event.languageMode !== "bilingual";
                    return (
                      <label
                        key={value}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-sm has-checked:border-gold has-checked:bg-gold-soft",
                          locked ? "cursor-not-allowed opacity-55" : "cursor-pointer",
                        )}
                      >
                        <input type="radio" name="languageMode" value={value} checked={langMode === value} onChange={() => setLangMode(value)} disabled={locked} className="sr-only" />
                        {locked && <Lock className="size-3.5" aria-hidden />}
                        {label}
                      </label>
                    );
                  })}
                </div>
                {!ent.bilingual && <LockedNote>{ed.details.bilingualLocked}</LockedNote>}
                {err("languageMode") && <p className="mt-1.5 text-sm text-danger">{err("languageMode")}</p>}
              </fieldset>

              {isPro && (
                <Field label={ed.details.clientName} htmlFor="clientName" optional={t.common.optional} hint={t.newEvent.clientHint}>
                  <Input id="clientName" name="clientName" defaultValue={event.clientName ?? ""} maxLength={120} />
                </Field>
              )}

              <div className={cn("space-y-4 rounded-2xl border border-line p-4", !showAr && "hidden")} dir="rtl" lang="ar">
                <p className="text-xs font-semibold tracking-wide text-gold-dark">{ed.details.arabicSection}</p>
                <Field label={ed.details.hostsAr} htmlFor="hostNamesAr">
                  <Input id="hostNamesAr" name="hostNamesAr" defaultValue={event.hostNamesAr ?? ""} placeholder={ed.details.hostsArPlaceholder} maxLength={200} />
                </Field>
                <Field label={ed.details.titleAr} htmlFor="titleAr">
                  <Input id="titleAr" name="titleAr" defaultValue={event.titleAr ?? ""} placeholder={ed.details.titleArPlaceholder} maxLength={160} />
                </Field>
                <Field label={ed.details.greetingAr} htmlFor="greetingAr" optional={t.common.optional}>
                  <Input id="greetingAr" name="greetingAr" defaultValue={event.greetingAr ?? ""} placeholder={ed.details.greetingArPlaceholder} maxLength={200} />
                </Field>
                <Field label={ed.details.dressCodeAr} htmlFor="dressCodeAr" optional={t.common.optional}>
                  <Input id="dressCodeAr" name="dressCodeAr" defaultValue={event.dressCodeAr ?? ""} placeholder={ed.details.dressCodeArPlaceholder} maxLength={200} />
                </Field>
                <Field label={ed.details.notesAr} htmlFor="notesAr" optional={t.common.optional}>
                  <Textarea id="notesAr" name="notesAr" defaultValue={event.notesAr ?? ""} placeholder={ed.details.notesArPlaceholder} maxLength={2000} />
                </Field>
              </div>

              <div className={cn("space-y-4 rounded-2xl border border-line p-4", !showEn && "hidden")} dir="ltr" lang="en">
                <p className="text-xs font-semibold tracking-wide text-gold-dark">{ed.details.englishSection}</p>
                <Field label={ed.details.hostsEn} htmlFor="hostNamesEn">
                  <Input id="hostNamesEn" name="hostNamesEn" defaultValue={event.hostNamesEn ?? ""} placeholder={ed.details.hostsEnPlaceholder} maxLength={200} />
                </Field>
                <Field label={ed.details.titleEn} htmlFor="titleEn">
                  <Input id="titleEn" name="titleEn" defaultValue={event.titleEn ?? ""} placeholder={ed.details.titleEnPlaceholder} maxLength={160} />
                </Field>
                <Field label={ed.details.greetingEn} htmlFor="greetingEn" optional="optional">
                  <Input id="greetingEn" name="greetingEn" defaultValue={event.greetingEn ?? ""} placeholder={ed.details.greetingEnPlaceholder} maxLength={200} />
                </Field>
                <Field label={ed.details.dressCodeEn} htmlFor="dressCodeEn" optional="optional">
                  <Input id="dressCodeEn" name="dressCodeEn" defaultValue={event.dressCodeEn ?? ""} maxLength={200} />
                </Field>
                <Field label={ed.details.notesEn} htmlFor="notesEn" optional="optional">
                  <Textarea id="notesEn" name="notesEn" defaultValue={event.notesEn ?? ""} maxLength={2000} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={ed.details.date} htmlFor="eventDate" error={err("eventDate")}>
                  <Input id="eventDate" name="eventDate" type="date" defaultValue={event.eventDate ?? ""} dir="ltr" />
                </Field>
                <Field label={ed.details.startTime} htmlFor="startTime" error={err("startTime")}>
                  <Input id="startTime" name="startTime" type="time" defaultValue={event.startTime ?? ""} dir="ltr" />
                </Field>
                <Field label={ed.details.endTime} htmlFor="endTime" optional={t.common.optional} error={err("endTime")}>
                  <Input id="endTime" name="endTime" type="time" defaultValue={event.endTime ?? ""} dir="ltr" />
                </Field>
              </div>
              <Field label={ed.details.timezone} htmlFor="timezone" error={err("timezone")}>
                <Select id="timezone" name="timezone" defaultValue={event.timezone} dir="ltr">
                  {tzOptions.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={ed.details.contactPhone} htmlFor="contactPhone" optional={t.common.optional} error={err("contactPhone")}>
                <Input id="contactPhone" name="contactPhone" type="tel" defaultValue={event.contactPhone ?? ""} placeholder={ed.details.contactPhonePlaceholder} dir="ltr" maxLength={32} />
              </Field>
            </section>

            {/* Venue */}
            <section className={sectionClass("venue")}>
              <div className={cn("grid gap-4", !showAr && "hidden")} dir="rtl" lang="ar">
                <Field label={ed.venue.nameAr} htmlFor="venueNameAr">
                  <Input id="venueNameAr" name="venueNameAr" defaultValue={event.venueNameAr ?? ""} placeholder={ed.venue.nameArPlaceholder} maxLength={200} />
                </Field>
                <Field label={ed.venue.addressAr} htmlFor="venueAddressAr" optional={t.common.optional}>
                  <Input id="venueAddressAr" name="venueAddressAr" defaultValue={event.venueAddressAr ?? ""} placeholder={ed.venue.addressArPlaceholder} maxLength={400} />
                </Field>
              </div>
              <div className={cn("grid gap-4", !showEn && "hidden")} dir="ltr" lang="en">
                <Field label={ed.venue.nameEn} htmlFor="venueNameEn">
                  <Input id="venueNameEn" name="venueNameEn" defaultValue={event.venueNameEn ?? ""} maxLength={200} />
                </Field>
                <Field label={ed.venue.addressEn} htmlFor="venueAddressEn" optional="optional">
                  <Input id="venueAddressEn" name="venueAddressEn" defaultValue={event.venueAddressEn ?? ""} maxLength={400} />
                </Field>
              </div>
              <Field label={ed.venue.mapsUrl} htmlFor="mapsUrl" hint={ed.venue.mapsUrlHint} error={err("mapsUrl")}>
                <Input id="mapsUrl" name="mapsUrl" type="url" inputMode="url" defaultValue={event.mapsUrl ?? ""} placeholder="https://maps.app.goo.gl/…" dir="ltr" />
              </Field>
            </section>

            {/* RSVP */}
            <section className={sectionClass("rsvp")}>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" name="rsvpEnabled" checked={rsvpOn} onChange={(e) => setRsvpOn(e.target.checked)} className="peer sr-only" />
                <span
                  aria-hidden
                  className="relative mt-0.5 inline-flex h-6 w-10 shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-gold peer-focus-visible:ring-4 peer-focus-visible:ring-gold/20 after:absolute after:start-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4"
                />
                <span>
                  <span className="block font-medium">{ed.rsvp.enabled}</span>
                  <span className="mt-0.5 block text-xs text-muted">{ed.rsvp.enabledHint}</span>
                </span>
              </label>
              <div className={cn("space-y-4", !rsvpOn && "pointer-events-none opacity-50")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={ed.rsvp.deadline} htmlFor="rsvpDeadline" optional={t.common.optional} error={err("rsvpDeadline")}>
                    <Input id="rsvpDeadline" name="rsvpDeadline" type="date" defaultValue={event.rsvpDeadline ?? ""} dir="ltr" />
                  </Field>
                  <Field label={ed.rsvp.maxParty} htmlFor="rsvpMaxPartySize" error={err("rsvpMaxPartySize")}>
                    <Input id="rsvpMaxPartySize" name="rsvpMaxPartySize" type="number" min={1} max={30} defaultValue={event.rsvpMaxPartySize} dir="ltr" />
                  </Field>
                </div>
                <Field label={ed.rsvp.expected} htmlFor="expectedInvites" optional={t.common.optional} hint={ed.rsvp.expectedHint} error={err("expectedInvites")}>
                  <Input id="expectedInvites" name="expectedInvites" type="number" min={0} defaultValue={event.expectedInvites ?? ""} dir="ltr" />
                </Field>
                <Toggle name="rsvpAskPhone" label={ed.rsvp.askPhone} defaultChecked={event.rsvpAskPhone} />
                {ent.rsvpLimit !== null && <FormMessage tone="info">{ed.rsvp.freeLimit.replace("{n}", String(ent.rsvpLimit))}</FormMessage>}
              </div>
            </section>

            {/* Sharing & privacy */}
            <section className={sectionClass("sharing")}>
              <Field label={ed.sharing.slug} htmlFor="slug" hint={ent.customSlug ? ed.sharing.slugHint : undefined} error={err("slug")}>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-line-strong bg-card focus-within:border-gold focus-within:ring-4 focus-within:ring-gold/15" dir="ltr">
                  <span className="flex items-center bg-paper px-3 text-sm text-muted">{slugPrefix}/</span>
                  <input
                    id="slug"
                    name="slug"
                    defaultValue={event.slug}
                    disabled={!ent.customSlug}
                    className="h-11 min-w-0 flex-1 bg-transparent px-2 text-[0.95rem] outline-none disabled:text-muted"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={48}
                  />
                </div>
                {!ent.customSlug && <LockedNote>{ed.sharing.slugLocked}</LockedNote>}
              </Field>
              <Field label={ed.sharing.shareMessage} htmlFor="shareMessage" optional={t.common.optional} hint={ed.sharing.shareMessageHint}>
                <Textarea id="shareMessage" name="shareMessage" defaultValue={event.shareMessage ?? ""} maxLength={600} />
              </Field>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink-soft">{ed.sharing.visibility}</legend>
                <div className="space-y-2">
                  {(["public", "private"] as const).map((v) => {
                    const locked = v === "private" && !ent.pinProtection && event.visibility !== "private";
                    return (
                      <label key={v} className={cn("flex items-center gap-3 rounded-xl border border-line-strong px-4 py-3 has-checked:border-gold has-checked:bg-gold-soft/50", locked ? "cursor-not-allowed opacity-55" : "cursor-pointer")}>
                        <input type="radio" name="visibility" value={v} checked={visibility === v} onChange={() => setVisibility(v)} disabled={locked} className="accent-[var(--color-gold)]" />
                        <span className="text-sm">{ed.sharing[v]}</span>
                        {locked && <Lock className="ms-auto size-3.5 text-muted" aria-hidden />}
                      </label>
                    );
                  })}
                </div>
                {!ent.pinProtection && <LockedNote>{ed.sharing.pinLocked}</LockedNote>}
                {err("visibility") && <p className="mt-1.5 text-sm text-danger">{err("visibility")}</p>}
              </fieldset>
              {visibility === "private" && (
                <Field label={ed.sharing.pin} htmlFor="accessPin" error={err("accessPin")}>
                  <Input id="accessPin" name="accessPin" inputMode="numeric" pattern="\d{4,8}" maxLength={8} defaultValue={event.accessPin ?? ""} dir="ltr" className="max-w-40 tracking-[0.3em]" />
                </Field>
              )}
            </section>

            {/* Save bar */}
            <div className="sticky bottom-0 z-10 -mx-5 mt-8 flex flex-wrap items-center gap-3 border-t border-line bg-card/95 px-5 py-3 backdrop-blur sm:-mx-7 sm:px-7">
              <Button type="submit" disabled={saving} aria-busy={saving}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {saving ? t.common.saving : t.common.save}
              </Button>
              <span className="text-sm" aria-live="polite">
                {dirty ? (
                  <span className="text-warn">{ed.unsaved}</span>
                ) : state?.ok ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <Check className="size-4" aria-hidden />
                    {t.common.saved}
                  </span>
                ) : null}
              </span>
              {state && !state.ok && state.error && <span className="text-sm text-danger">{state.error}</span>}
              <a href={`/preview/${event.id}`} target="_blank" rel="noopener" className={buttonClass("ghost", "sm", "ms-auto lg:hidden")}>
                <ExternalLink className="size-4" aria-hidden />
                {t.common.preview}
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Live preview */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-soft">{ed.livePreview}</p>
            <div className="inline-flex rounded-full border border-line-strong bg-card p-0.5">
              {(
                [
                  ["mobile", Smartphone, ed.previewMobile],
                  ["desktop", Monitor, ed.previewDesktop],
                ] as const
              ).map(([d, Icon, label]) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  aria-pressed={device === d}
                  title={label}
                  className={cn("rounded-full p-1.5", device === d ? "bg-ink text-white" : "text-muted")}
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="sr-only">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={cn("overflow-hidden bg-white shadow-soft", device === "mobile" ? "mx-auto w-[22rem] rounded-[2.2rem] border-[10px] border-ink" : "w-full rounded-xl border border-line-strong")}>
            <div className={cn("relative overflow-hidden", device === "mobile" ? "h-[40rem]" : "h-[36rem]")}>
              <iframe
                key={previewKey}
                src={`/preview/${event.id}`}
                title={ed.livePreview}
                className={cn("absolute top-0 border-0", device === "mobile" ? "h-full w-full" : "h-[200%] w-[200%] origin-top-left scale-50 rtl:origin-top-right rtl:right-0")}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
