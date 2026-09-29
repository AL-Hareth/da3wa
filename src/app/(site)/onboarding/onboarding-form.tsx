"use client";

import { Briefcase, Heart, Palette } from "lucide-react";
import { useActionState } from "react";
import { useI18n } from "@/i18n/client";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { completeOnboarding } from "./actions";

const TYPES = [
  { id: "individual", Icon: Heart },
  { id: "designer", Icon: Palette },
  { id: "planner", Icon: Briefcase },
] as const;

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const { t, locale } = useI18n();
  const [state, action] = useActionState(completeOnboarding, null);
  return (
    <form action={action} className="space-y-6">
      {state?.error && <FormMessage>{t.common.somethingWentWrong}</FormMessage>}
      <Field label={t.onboarding.nameLabel} htmlFor="name">
        <Input id="name" name="name" defaultValue={defaultName} required maxLength={80} />
      </Field>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-soft">{t.onboarding.typeLabel}</legend>
        <div className="grid gap-3">
          {TYPES.map(({ id, Icon }, i) => (
            <label
              key={id}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line-strong bg-card p-4 transition-colors has-checked:border-gold has-checked:bg-gold-soft/60"
            >
              <input type="radio" name="accountType" value={id} defaultChecked={i === 0} className="sr-only" />
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-dark">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">{t.onboarding.types[id].title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted">{t.onboarding.types[id].body}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-soft">{t.onboarding.localeLabel}</legend>
        <div className="flex gap-2">
          {(["ar", "en"] as const).map((l) => (
            <label
              key={l}
              className="flex-1 cursor-pointer rounded-xl border border-line-strong bg-card px-4 py-2.5 text-center text-sm has-checked:border-gold has-checked:bg-gold-soft/60"
            >
              <input type="radio" name="locale" value={l} defaultChecked={l === locale} className="sr-only" />
              {l === "ar" ? "العربية" : "English"}
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton className="w-full" size="lg">
        {t.onboarding.submit}
      </SubmitButton>
    </form>
  );
}
