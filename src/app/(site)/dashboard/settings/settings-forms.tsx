"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { authErrorMessage } from "@/components/auth/auth-errors";
import { updateProfileAction } from "./actions";

export function ProfileForm({ name, accountType }: { name: string; accountType: string }) {
  const { t, locale } = useI18n();
  const [state, action] = useActionState(updateProfileAction, null);
  return (
    <form action={action} className="space-y-4">
      <Field label={t.onboarding.nameLabel} htmlFor="name">
        <Input id="name" name="name" defaultValue={name} required maxLength={80} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.settings.accountType} htmlFor="accountType">
          <Select id="accountType" name="accountType" defaultValue={accountType}>
            {(["individual", "designer", "planner"] as const).map((k) => (
              <option key={k} value={k}>
                {t.onboarding.types[k].title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.settings.locale} htmlFor="locale">
          <Select id="locale" name="locale" defaultValue={locale}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </Select>
        </Field>
      </div>
      {state && (state.ok ? <FormMessage tone="success">{state.message}</FormMessage> : <FormMessage>{state.error}</FormMessage>)}
      <SubmitButton pendingLabel={t.common.saving}>{t.common.save}</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const { t } = useI18n();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const newPassword = String(fd.get("newPassword"));
    if (newPassword.length < 8) return setMsg({ ok: false, text: t.auth.errors.weak });
    setPending(true);
    const { error } = await authClient.changePassword({ currentPassword: String(fd.get("currentPassword")), newPassword, revokeOtherSessions: true });
    setPending(false);
    if (error) return setMsg({ ok: false, text: authErrorMessage(t, error) });
    form.reset();
    setMsg({ ok: true, text: t.settings.passwordChanged });
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.settings.currentPassword} htmlFor="currentPassword">
          <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" dir="ltr" required />
        </Field>
        <Field label={t.auth.newPassword} htmlFor="newPassword" hint={t.auth.passwordHint}>
          <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" dir="ltr" minLength={8} required />
        </Field>
      </div>
      {msg && <FormMessage tone={msg.ok ? "success" : "error"}>{msg.text}</FormMessage>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t.settings.changePassword}
      </Button>
    </form>
  );
}

export function DeleteAccountForm({ hasPassword }: { hasPassword: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.deleteUser(hasPassword ? { password: String(fd.get("password")) } : {});
    setPending(false);
    if (error) {
      setError(error.code === "SESSION_EXPIRED" ? t.settings.sessionExpired : authErrorMessage(t, error));
      return;
    }
    router.replace("/");
    router.refresh();
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{t.settings.deleteAccountBody}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {hasPassword && (
          <Field label={t.settings.passwordForDelete} htmlFor="password">
            <Input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required />
          </Field>
        )}
        <Field label={t.settings.deleteAccountConfirm} htmlFor="confirm">
          <Input id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} dir="ltr" autoComplete="off" />
        </Field>
      </div>
      {error && <FormMessage>{error}</FormMessage>}
      <Button type="submit" variant="danger" disabled={confirm !== "DELETE" || pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t.settings.deleteAccount}
      </Button>
    </form>
  );
}
