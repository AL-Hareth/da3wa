"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { buttonClass } from "./button";

export function CopyButton({
  value,
  label,
  copiedLabel,
  className,
  variant = "outline",
  size = "sm",
}: {
  value: string;
  label: string;
  copiedLabel: string;
  className?: string;
  variant?: "outline" | "secondary" | "primary" | "ghost";
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button type="button" onClick={copy} className={cn(buttonClass(variant, size), className)} aria-live="polite">
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? copiedLabel : label}
    </button>
  );
}
