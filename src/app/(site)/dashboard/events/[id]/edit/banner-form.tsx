"use client";

import { Lock } from "lucide-react";
import { useActionState, useEffect, useTransition } from "react";
import { useI18n } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { clearBannerAction, setBannerAction, type ActionState } from "../../actions";

export function BannerForm({
  eventId,
  locked,
  current,
  showAr,
  showEn,
  onChanged,
}: {
  eventId: string;
  locked: boolean;
  current: { type: "announcement" | "time_change" | "venue_change" | null; textAr: string | null; textEn: string | null };
  showAr: boolean;
  showEn: boolean;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const u = t.editor.updates;
  const [state, action] = useActionState<ActionState, FormData>(setBannerAction.bind(null, eventId), null);
  const [clearing, startClear] = useTransition();
  useEffect(() => {
    if (state?.ok) onChanged();
  }, [state, onChanged]);

  if (locked) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-gold-soft px-4 py-3 text-sm text-gold-dark">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
        {u.locked}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <h3 className="font-semibold">{u.title}</h3>
        <p className="mt-1 text-sm text-muted">{u.body}</p>
      </div>
      {current.type && <FormMessage tone="success">{u.active}</FormMessage>}
      <Field label={u.type} htmlFor="bannerType">
        <Select id="bannerType" name="bannerType" defaultValue={current.type ?? "announcement"}>
          {(["announcement", "time_change", "venue_change"] as const).map((k) => (
            <option key={k} value={k}>
              {u.types[k]}
            </option>
          ))}
        </Select>
      </Field>
      {showAr && (
        <Field label={u.textAr} htmlFor="bannerTextAr">
          <Input id="bannerTextAr" name="bannerTextAr" dir="rtl" lang="ar" maxLength={300} defaultValue={current.textAr ?? ""} />
        </Field>
      )}
      {showEn && (
        <Field label={u.textEn} htmlFor="bannerTextEn">
          <Input id="bannerTextEn" name="bannerTextEn" dir="ltr" lang="en" maxLength={300} defaultValue={current.textEn ?? ""} />
        </Field>
      )}
      {state && !state.ok && state.error && <FormMessage>{state.error}</FormMessage>}
      <div className="flex flex-wrap gap-2">
        <SubmitButton size="sm">{u.add}</SubmitButton>
        {current.type && (
          <Button
            variant="outline"
            size="sm"
            disabled={clearing}
            onClick={() =>
              startClear(async () => {
                await clearBannerAction(eventId);
                onChanged();
              })
            }
          >
            {u.remove}
          </Button>
        )}
      </div>
    </form>
  );
}
