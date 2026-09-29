import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Logo } from "@/components/ui/logo";
import { getI18n } from "@/i18n/server";
import { requireAppContext } from "@/lib/session";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const [{ user }, { t, locale }] = await Promise.all([requireAppContext(true), getI18n()]);
  if (user.onboardedAt) redirect("/dashboard");
  return (
    <div className="flex min-h-dvh flex-col items-center bg-[radial-gradient(ellipse_at_top,var(--color-gold-soft),transparent_60%)] px-4 py-10">
      <Logo locale={locale} className="mb-8" />
      <div className="w-full max-w-lg">
        <AuthCard title={t.onboarding.title} subtitle={t.onboarding.subtitle}>
          <OnboardingForm defaultName={user.name} />
        </AuthCard>
      </div>
    </div>
  );
}
