"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { buttonClass } from "../ui/button";

type Result = { ok: boolean; error?: string; message?: string } | null | void;

/** Runs a bound server action, with optional confirmation and inline error display. */
export function ActionButton({
  action,
  children,
  confirm,
  variant = "primary",
  size = "md",
  className,
  disabled,
}: {
  action: () => Promise<Result>;
  children: React.ReactNode;
  confirm?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className={cn("inline-flex flex-col", className?.includes("w-full") && "w-full")}>
      <button
        type="button"
        disabled={pending || disabled}
        className={buttonClass(variant, size, className)}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError(null);
          start(async () => {
            const res = await action();
            if (res && !res.ok) setError(res.error ?? null);
          });
        }}
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
