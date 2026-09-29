"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/i18n/client";

export function SignOutButton() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.replace("/");
        router.refresh();
      }}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-soft hover:bg-gold-soft/70"
    >
      <LogOut className="size-4 rtl:-scale-x-100" aria-hidden />
      <span className="hidden sm:inline">{t.common.signOut}</span>
    </button>
  );
}
