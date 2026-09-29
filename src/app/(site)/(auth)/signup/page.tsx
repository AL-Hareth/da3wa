import Link from "next/link";
import { AuthCard, Divider } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";
import { getI18n } from "@/i18n/server";
import { env } from "@/lib/env";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.auth.signup };
}

export default async function SignupPage() {
  const { t } = await getI18n();
  const e = env();
  const googleEnabled = !!(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET);
  return (
    <AuthCard
      title={t.auth.signupTitle}
      subtitle={t.auth.signupSubtitle}
      footer={
        <>
          {t.auth.haveAccount}{" "}
          <Link href="/login" className="font-medium text-gold-dark hover:underline">
            {t.nav.login}
          </Link>
        </>
      }
    >
      {googleEnabled && (
        <>
          <GoogleButton callbackURL="/onboarding" />
          <Divider label={t.common.or} />
        </>
      )}
      <SignupForm requireVerification={e.REQUIRE_EMAIL_VERIFICATION} />
    </AuthCard>
  );
}
