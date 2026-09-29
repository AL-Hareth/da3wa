"use client";

import { Briefcase, Cake, GraduationCap, Heart, Gem, Sparkles, Flower2, ImageUp, LayoutTemplate } from "lucide-react";
import { useActionState } from "react";
import { useClientValue } from "@/lib/use-client-value";
import { useI18n } from "@/i18n/client";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { createEventAction } from "../actions";

const TYPES = [
  { id: "wedding", Icon: Heart },
  { id: "engagement", Icon: Gem },
  { id: "henna", Icon: Flower2 },
  { id: "birthday", Icon: Cake },
  { id: "graduation", Icon: GraduationCap },
  { id: "corporate", Icon: Briefcase },
  { id: "custom", Icon: Sparkles },
] as const;

export function NewEventForm({ showClient }: { showClient: boolean }) {
  const { t } = useI18n();
  const [state, action] = useActionState(createEventAction, null);
  const tz = useClientValue(() => Intl.DateTimeFormat().resolvedOptions().timeZone, "");

  return (
    <form action={action} className="space-y-8">
      {state && !state.ok && <FormMessage>{t.common.somethingWentWrong}</FormMessage>}
      <input type="hidden" name="timezone" value={tz} />
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink-soft">{t.newEvent.typeLabel}</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TYPES.map(({ id, Icon }, i) => (
            <label
              key={id}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-line-strong bg-card px-3 py-5 text-center transition-colors hover:border-gold/60 has-checked:border-gold has-checked:bg-gold-soft/60 has-focus-visible:ring-4 has-focus-visible:ring-gold/20"
            >
              <input type="radio" name="type" value={id} defaultChecked={i === 0} className="sr-only" />
              <Icon className="size-6 text-gold-dark" aria-hidden />
              <span className="text-sm font-medium">{t.eventTypes[id]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink-soft">{t.newEvent.designLabel}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { id: "upload", Icon: ImageUp, title: t.newEvent.uploadOption, body: t.newEvent.uploadOptionBody },
              { id: "template", Icon: LayoutTemplate, title: t.newEvent.templateOption, body: t.newEvent.templateOptionBody },
            ] as const
          ).map(({ id, Icon, title, body }, i) => (
            <label
              key={id}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line-strong bg-card p-4 transition-colors has-checked:border-gold has-checked:bg-gold-soft/60 has-focus-visible:ring-4 has-focus-visible:ring-gold/20"
            >
              <input type="radio" name="designMode" value={id} defaultChecked={i === 0} className="sr-only" />
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-dark">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted">{body}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {showClient && (
        <Field label={t.newEvent.clientLabel} htmlFor="clientName" hint={t.newEvent.clientHint}>
          <Input id="clientName" name="clientName" maxLength={120} />
        </Field>
      )}

      <SubmitButton size="lg" className="w-full sm:w-auto">
        {t.newEvent.create}
      </SubmitButton>
    </form>
  );
}
