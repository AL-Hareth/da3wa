import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/password-forms";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.auth.forgotTitle };
}

export default async function ForgotPasswordPage() {
  const { t } = await getI18n();
  return (
    <AuthCard
      title={t.auth.forgotTitle}
      subtitle={t.auth.forgotSubtitle}
      footer={
        <Link href="/login" className="font-medium text-gold-dark hover:underline">
          {t.auth.login}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
