"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { Button } from "../ui/button";
import { Field, FormMessage, Input } from "../ui/form";
import { authErrorMessage } from "./auth-errors";

export function SignupForm({ requireVerification }: { requireVerification: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 8) {
      setError(t.auth.errors.weak);
      return;
    }
    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")).trim(),
      email: String(form.get("email")).trim(),
      password,
      locale,
      callbackURL: "/onboarding",
    });
    if (error) {
      setError(authErrorMessage(t, error));
      setPending(false);
      return;
    }
    if (requireVerification) {
      setSent(true);
      setPending(false);
      return;
    }
    router.replace("/onboarding");
    router.refresh();
  }

  if (sent) return <FormMessage tone="success">{t.auth.verifyEmailSent}</FormMessage>;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <FormMessage>{error}</FormMessage>}
      <Field label={t.auth.name} htmlFor="name">
        <Input id="name" name="name" autoComplete="name" required maxLength={80} />
      </Field>
      <Field label={t.auth.email} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" dir="ltr" required />
      </Field>
      <Field label={t.auth.password} htmlFor="password" hint={t.auth.passwordHint}>
        <Input id="password" name="password" type="password" autoComplete="new-password" dir="ltr" minLength={8} required />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t.auth.signup}
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted">{t.auth.terms}</p>
    </form>
  );
}
