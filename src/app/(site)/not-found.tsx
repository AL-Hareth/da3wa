import { ButtonLink } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-7xl font-bold text-gold">404</p>
      <h1 className="mt-4 text-2xl font-semibold">{t.common.notFoundTitle}</h1>
      <p className="mt-2 text-muted">{t.common.notFoundBody}</p>
      <ButtonLink href="/" className="mt-6">
        {t.common.goHome}
      </ButtonLink>
    </div>
  );
}
