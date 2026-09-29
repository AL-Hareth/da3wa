import Link from "next/link";
import { LocaleSwitch } from "@/components/locale-switch";
import { NavLinks } from "@/components/dashboard/nav-links";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Logo } from "@/components/ui/logo";
import { getI18n } from "@/i18n/server";
import { requireAppContext } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [{ user }, { t, locale }] = await Promise.all([requireAppContext(), getI18n()]);
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/dashboard" aria-label={t.nav.dashboard}>
            <Logo locale={locale} className="text-xl" />
          </Link>
          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <NavLinks
              links={[
                { href: "/dashboard", label: t.nav.events, exact: true },
                { href: "/dashboard/billing", label: t.nav.billing },
                { href: "/dashboard/settings", label: t.nav.settings },
              ]}
            />
          </div>
          <div className="ms-auto flex items-center gap-1">
            <span className="hidden max-w-40 truncate text-sm text-muted md:inline">{user.name}</span>
            <LocaleSwitch />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
