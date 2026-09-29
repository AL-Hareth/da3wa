import Link from "next/link";
import { Suspense } from "react";
import { AuthCard, Divider } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { getI18n } from "@/i18n/server";
import { env } from "@/lib/env";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.auth.login };
}

export default async function LoginPage() {
  const { t } = await getI18n();
  const googleEnabled = !!(env().GOOGLE_CLIENT_ID && env().GOOGLE_CLIENT_SECRET);
  return (
    <AuthCard
      title={t.auth.loginTitle}
      subtitle={t.auth.loginSubtitle}
      footer={
        <>
          {t.auth.noAccount}{" "}
          <Link href="/signup" className="font-medium text-gold-dark hover:underline">
            {t.nav.signup}
          </Link>
        </>
      }
    >
      {googleEnabled && (
        <>
          <GoogleButton />
          <Divider label={t.common.or} />
        </>
      )}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
