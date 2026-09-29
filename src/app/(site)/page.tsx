import { CalendarCheck, Globe2, MapPin, Megaphone, Palette, Smartphone } from "lucide-react";
import Link from "next/link";
import { LocaleSwitch } from "@/components/locale-switch";
import { PricingTable } from "@/components/pricing-table";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Ornament } from "@/components/invite/ornament";
import { getI18n } from "@/i18n/server";
import { env } from "@/lib/env";
import { formatPrice, PRODUCTS } from "@/lib/products";
import { getSession } from "@/lib/session";
import { getTheme, themeStyle } from "@/lib/themes";

const FEATURE_ICONS = [Smartphone, Globe2, MapPin, CalendarCheck, Megaphone, Palette];

function PhoneMock({ locale }: { locale: "ar" | "en" }) {
  const theme = getTheme("ivory-gold");
  const ar = locale === "ar";
  return (
    <div className="relative mx-auto w-[17rem] rounded-[2.6rem] border-[10px] border-ink bg-ink shadow-[0_40px_80px_-30px_rgba(35,31,27,0.55)] sm:w-[19rem]">
      <div
        className="inv flex h-[34rem] flex-col items-center overflow-hidden rounded-[1.9rem] px-5 pt-8 text-center sm:h-[37rem]"
        style={themeStyle(theme) as React.CSSProperties}
        dir={ar ? "rtl" : "ltr"}
        lang={locale}
        aria-hidden
      >
        <div className="inv-surface w-full rounded-[1.4rem] p-2">
          <div className="flex flex-col items-center gap-2 rounded-[1.1rem] border px-4 py-7" style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 40%, transparent)" }}>
            <Ornament kind="floral" className="w-36" />
            <p className="inv-display inv-muted text-sm">{ar ? "بسم الله الرحمن الرحيم" : "Together with their families"}</p>
            <p className="inv-display inv-accent text-4xl leading-snug">{ar ? "سارة وعمر" : "Sarah & Omar"}</p>
            <p className="inv-muted text-xs leading-relaxed">{ar ? "يتشرّفان بدعوتكم لحضور حفل زفافهما" : "request the pleasure of your company"}</p>
            <p className="mt-1 text-xs font-medium">{ar ? "الخميس ١٢ نوفمبر ٢٠٢٦" : "Thursday, 12 November 2026"}</p>
            <Ornament kind="floral" className="w-24 rotate-180 opacity-80" />
          </div>
        </div>
        <div className="mt-3 grid w-full grid-cols-4 gap-1.5">
          {["24", "06", "41", "09"].map((n, i) => (
            <div key={i} className="inv-surface rounded-xl py-2">
              <div className="inv-display text-xl leading-none">{n}</div>
            </div>
          ))}
        </div>
        <div className="inv-btn mt-3 flex h-10 w-full items-center justify-center rounded-full text-xs font-medium">{ar ? "الاتجاهات على الخريطة" : "Get directions"}</div>
        <div className="inv-btn-outline mt-2 flex h-10 w-full items-center justify-center rounded-full text-xs">{ar ? "تأكيد الحضور" : "RSVP"}</div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const [{ t, locale }, session] = await Promise.all([getI18n(), getSession()]);
  const currency = env().PRICE_CURRENCY;
  const l = t.landing;
  return (
    <div className="overflow-x-clip">
      <header className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 sm:px-6">
        <Link href="/" aria-label={t.common.appName}>
          <Logo locale={locale} />
        </Link>
        <nav className="ms-auto flex items-center gap-1 text-sm">
          <a href="#how" className="hidden rounded-full px-3 py-1.5 text-ink-soft hover:bg-gold-soft/70 sm:inline">
            {t.nav.howItWorks}
          </a>
          <a href="#pricing" className="hidden rounded-full px-3 py-1.5 text-ink-soft hover:bg-gold-soft/70 sm:inline">
            {t.nav.pricing}
          </a>
          <LocaleSwitch />
          {session ? (
            <ButtonLink href="/dashboard" size="sm">
              {t.nav.dashboard}
            </ButtonLink>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-gold-soft/70">
                {t.nav.login}
              </Link>
              <ButtonLink href="/signup" size="sm" className="hidden sm:inline-flex">
                {t.nav.signup}
              </ButtonLink>
            </>
          )}
        </nav>
      </header>

      <section className="relative">
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(ellipse_at_top,var(--color-gold-soft),transparent_65%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-8 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div className="text-center lg:text-start">
            <p className="inline-flex rounded-full border border-gold/30 bg-card px-3.5 py-1 text-xs font-medium text-gold-dark">{l.eyebrow}</p>
            <h1 className="mt-5 font-display text-4xl leading-[1.25] font-bold text-balance sm:text-5xl lg:text-6xl">{l.heroTitle}</h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg lg:mx-0">{l.heroBody}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <ButtonLink href={session ? "/dashboard/events/new" : "/signup"} size="lg">
                {l.ctaPrimary}
              </ButtonLink>
              <ButtonLink href="#how" size="lg" variant="outline">
                {l.ctaSecondary}
              </ButtonLink>
            </div>
          </div>
          <PhoneMock locale={locale} />
        </div>
      </section>

      <section id="how" className="border-y border-line bg-card py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">{l.stepsTitle}</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {l.steps.map((s, i) => (
              <li key={i} className="rounded-3xl border border-line bg-paper p-6">
                <span className="grid size-10 place-items-center rounded-full bg-ink font-semibold text-white tabular">{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">{l.featuresTitle}</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {l.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? Palette;
              return (
                <div key={i} className="rounded-3xl border border-line bg-card p-6 shadow-soft">
                  <Icon className="size-6 text-gold" aria-hidden />
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-ink px-6 py-12 text-center text-white sm:px-12">
          <Palette className="mx-auto size-8 text-gold" aria-hidden />
          <h2 className="mt-4 font-display text-3xl font-bold">{l.designersTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-white/75">{l.designersBody}</p>
          <ButtonLink href="/signup" variant="secondary" size="lg" className="mt-7">
            {l.designersCta}
          </ButtonLink>
        </div>
      </section>

      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">{l.pricingTitle}</h2>
          <p className="mt-3 text-center text-muted">{l.pricingBody}</p>
          <div className="mt-12">
            <PricingTable
              t={t}
              cta={l.ctaPrimary}
              prices={{
                free: formatPrice(0, currency, locale),
                standard: formatPrice(PRODUCTS.event_standard.priceCents, currency, locale),
                premium: formatPrice(PRODUCTS.event_premium.priceCents, currency, locale),
              }}
            />
          </div>
          <p className="mt-6 text-center text-sm text-muted">{t.pricing.credits}</p>
        </div>
      </section>

      <section className="border-t border-line bg-card py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold">{l.faqTitle}</h2>
          <div className="mt-10 divide-y divide-line rounded-3xl border border-line bg-paper">
            {l.faq.map((f, i) => (
              <details key={i} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-gold transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-10 text-center text-sm text-muted">
        <Logo locale={locale} className="text-xl" />
        <p className="mt-3">{l.footer}</p>
        <p className="mt-1 text-xs">© {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
