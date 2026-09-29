"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { Button } from "../ui/button";
import { Field, FormMessage, Input } from "../ui/form";
import { authErrorMessage } from "./auth-errors";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "pending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setState("pending");
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    if (error && error.status === 429) {
      setError(authErrorMessage(t, error));
      setState("idle");
      return;
    }
    // Always report success so the form can't be used to discover registered emails.
    setState("sent");
  }

  if (state === "sent") return <FormMessage tone="success">{t.auth.linkSent}</FormMessage>;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <FormMessage>{error}</FormMessage>}
      <Field label={t.auth.email} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" dir="ltr" required />
      </Field>
      <Button type="submit" className="w-full" disabled={state === "pending"}>
        {state === "pending" && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t.auth.sendLink}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string | null }) {
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(token ? null : t.auth.resetInvalid);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const newPassword = String(new FormData(e.currentTarget).get("password"));
    if (newPassword.length < 8) return setError(t.auth.errors.weak);
    setState("pending");
    const { error } = await authClient.resetPassword({ newPassword, token });
    if (error) {
      setError(error.code === "INVALID_TOKEN" ? t.auth.resetInvalid : authErrorMessage(t, error));
      setState("idle");
      return;
    }
    setState("done");
  }

  if (state === "done")
    return (
      <div className="space-y-4">
        <FormMessage tone="success">{t.auth.resetDone}</FormMessage>
        <Link href="/login" className="block text-center text-sm font-medium text-gold-dark hover:underline">
          {t.auth.login}
        </Link>
      </div>
    );
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <FormMessage>{error}</FormMessage>}
      <Field label={t.auth.newPassword} htmlFor="password" hint={t.auth.passwordHint}>
        <Input id="password" name="password" type="password" autoComplete="new-password" dir="ltr" minLength={8} required disabled={!token} />
      </Field>
      <Button type="submit" className="w-full" disabled={!token || state === "pending"}>
        {state === "pending" && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t.auth.resetSubmit}
      </Button>
    </form>
  );
}
