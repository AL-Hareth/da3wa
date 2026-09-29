"use client";

import { useEffect } from "react";
import { useI18n } from "@/i18n/client";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">{t.common.somethingWentWrong}</h1>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted">{error.digest}</p>}
      <Button className="mt-6" onClick={reset}>
        {t.common.tryAgain}
      </Button>
    </div>
  );
}
