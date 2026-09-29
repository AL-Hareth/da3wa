"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocaleAction } from "@/app/actions";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

export function LocaleSwitch({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setLocaleAction(locale === "ar" ? "en" : "ar");
          router.refresh();
        })
      }
      className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-soft hover:bg-gold-soft/70", className)}
    >
      <Languages className="size-4" aria-hidden />
      {t.common.switchLanguage}
    </button>
  );
}
