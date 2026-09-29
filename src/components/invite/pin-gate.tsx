"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";
import { unlockEventAction, type PinState } from "@/app/(invite)/actions";

export function PinGate({
  eventId,
  lang,
  labels,
}: {
  eventId: string;
  lang: "ar" | "en";
  labels: { title: string; body: string; pin: string; submit: string };
}) {
  const [state, action, pending] = useActionState<PinState, FormData>(unlockEventAction.bind(null, eventId), null);
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <form action={action} className="inv-surface w-full max-w-sm rounded-3xl p-7 text-center shadow-sm">
        <input type="hidden" name="lang" value={lang} />
        <div className="inv-btn mx-auto grid size-12 place-items-center rounded-full">
          <Lock className="size-5" aria-hidden />
        </div>
        <h1 className="inv-display mt-4 text-3xl">{labels.title}</h1>
        <p className="inv-muted mt-2 text-sm leading-relaxed">{labels.body}</p>
        <label className="mt-6 block text-start text-sm" htmlFor="pin">
          {labels.pin}
        </label>
        <input
          id="pin"
          name="pin"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d*"
          maxLength={8}
          required
          dir="ltr"
          className="mt-1.5 h-12 w-full rounded-xl px-4 text-center text-xl tracking-[0.5em]"
        />
        {state?.error && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="inv-btn mt-5 h-12 w-full rounded-full font-medium disabled:opacity-60">
          {labels.submit}
        </button>
      </form>
    </div>
  );
}
