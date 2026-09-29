"use client";

import Script from "next/script";
import { useActionState, useEffect, useState } from "react";
import { Check, HelpCircle, Minus, Plus, X } from "lucide-react";
import { submitRsvpAction, type RsvpState } from "@/app/(invite)/actions";
import type { InviteStrings } from "@/i18n/invite";
import { fmt } from "@/i18n/config";

type Status = "attending" | "not_attending" | "maybe";
type Existing = { fullName: string; status: Status; partySize: number; phone: string | null; note: string | null } | null;

declare global {
  interface Window {
    turnstile?: { reset: (el?: string | HTMLElement) => void };
  }
}

export function RsvpForm({
  eventId,
  lang,
  s,
  maxParty,
  askPhone,
  existing,
  disabled,
  turnstileSiteKey,
}: {
  eventId: string;
  lang: "ar" | "en";
  s: InviteStrings["rsvp"];
  maxParty: number;
  askPhone: boolean;
  existing: Existing;
  disabled?: boolean;
  turnstileSiteKey?: string;
}) {
  const [state, action, pending] = useActionState<RsvpState, FormData>(submitRsvpAction.bind(null, eventId), null);
  const [editing, setEditing] = useState(!existing);
  const [status, setStatus] = useState<Status | null>(existing?.status ?? null);
  const [party, setParty] = useState(Math.max(1, existing?.partySize || 1));

  // A new successful submission closes the form (state adjusted during render, not in an effect).
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) setEditing(false);
  }

  useEffect(() => {
    if (state && !state.ok) window.turnstile?.reset();
  }, [state]);

  const statusLabel = (st: Status) => (st === "attending" ? s.attending : st === "not_attending" ? s.notAttending : s.maybe);

  if (!editing) {
    const message = state?.ok ? state.message : existing ? fmt(s.yourResponse, { status: statusLabel(existing.status) }) : null;
    return (
      <div className="text-center" role="status">
        <div className="inv-btn mx-auto grid size-12 place-items-center rounded-full">
          <Check className="size-6" aria-hidden />
        </div>
        <p className="mt-4 text-lg leading-relaxed">{message}</p>
        <button type="button" onClick={() => setEditing(true)} className="inv-accent mt-3 text-sm underline underline-offset-4">
          {s.change}
        </button>
      </div>
    );
  }

  const options: { value: Status; label: string; Icon: typeof Check }[] = [
    { value: "attending", label: s.attending, Icon: Check },
    { value: "not_attending", label: s.notAttending, Icon: X },
    { value: "maybe", label: s.maybe, Icon: HelpCircle },
  ];

  return (
    <form action={action} className="space-y-5 text-start" noValidate>
      <input type="hidden" name="lang" value={lang} />
      {/* Honeypot */}
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="rsvp-name" className="mb-1.5 block text-sm font-medium">
          {s.name}
        </label>
        <input
          id="rsvp-name"
          name="fullName"
          required
          maxLength={120}
          autoComplete="name"
          defaultValue={existing?.fullName}
          className="h-12 w-full rounded-xl px-4 text-base"
          aria-invalid={state && !state.ok && state.field === "fullName" ? true : undefined}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{s.status}</legend>
        <div className="grid grid-cols-3 gap-2">
          {options.map(({ value, label, Icon }) => (
            <label
              key={value}
              className="inv-border flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-sm transition-colors has-checked:[background:var(--inv-accent)] has-checked:[color:var(--inv-on-accent)] has-checked:[border-color:var(--inv-accent)] has-focus-visible:ring-2"
            >
              <input
                type="radio"
                name="status"
                value={value}
                required
                className="sr-only"
                checked={status === value}
                onChange={() => setStatus(value)}
              />
              <Icon className="size-5" aria-hidden />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {status !== "not_attending" && maxParty > 1 && (
        <div>
          <span id="party-label" className="mb-1.5 block text-sm font-medium">
            {s.party}
          </span>
          <div className="flex items-center gap-3" role="group" aria-labelledby="party-label">
            <button
              type="button"
              onClick={() => setParty((p) => Math.max(1, p - 1))}
              className="inv-btn-outline grid size-11 place-items-center rounded-full disabled:opacity-40"
              disabled={party <= 1}
              aria-label="−"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <output className="inv-display w-10 text-center text-2xl tabular" aria-live="polite">
              {party}
            </output>
            <button
              type="button"
              onClick={() => setParty((p) => Math.min(maxParty, p + 1))}
              className="inv-btn-outline grid size-11 place-items-center rounded-full disabled:opacity-40"
              disabled={party >= maxParty}
              aria-label="+"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
      <input type="hidden" name="partySize" value={status === "not_attending" ? 1 : party} />

      {askPhone && (
        <div>
          <label htmlFor="rsvp-phone" className="mb-1.5 block text-sm font-medium">
            {s.phone} <span className="inv-muted text-xs">({s.optional})</span>
          </label>
          <input
            id="rsvp-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={32}
            dir="ltr"
            defaultValue={existing?.phone ?? ""}
            className="h-12 w-full rounded-xl px-4 text-base"
          />
        </div>
      )}

      <div>
        <label htmlFor="rsvp-note" className="mb-1.5 block text-sm font-medium">
          {s.note} <span className="inv-muted text-xs">({s.optional})</span>
        </label>
        <textarea id="rsvp-note" name="note" rows={3} maxLength={600} defaultValue={existing?.note ?? ""} className="w-full rounded-xl px-4 py-3 text-base" />
      </div>

      {turnstileSiteKey && !disabled && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile flex justify-center" data-sitekey={turnstileSiteKey} data-language={lang} data-theme="light" />
        </>
      )}

      {state && !state.ok && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending || disabled || !status} className="inv-btn h-12 w-full rounded-full text-base font-medium disabled:opacity-50">
        {pending ? s.submitting : existing ? s.update : s.submit}
      </button>
    </form>
  );
}
