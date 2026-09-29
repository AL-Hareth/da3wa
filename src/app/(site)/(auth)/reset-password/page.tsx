import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/password-forms";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.auth.resetTitle };
}

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const { t } = await getI18n();
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" && !sp.error ? sp.token : null;
  return (
    <AuthCard title={t.auth.resetTitle}>
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
