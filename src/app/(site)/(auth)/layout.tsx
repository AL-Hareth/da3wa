import Link from "next/link";
import { redirect } from "next/navigation";
import { LocaleSwitch } from "@/components/locale-switch";
import { Logo } from "@/components/ui/logo";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [{ locale }, session] = await Promise.all([getI18n(), getSession()]);
  if (session) redirect("/dashboard");
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,var(--color-gold-soft),transparent_60%)]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" aria-label="Home">
          <Logo locale={locale} />
        </Link>
        <LocaleSwitch />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:pt-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
