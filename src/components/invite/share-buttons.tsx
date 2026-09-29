"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";
import { useClientValue } from "@/lib/use-client-value";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3ZM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8Zm8.4-18.2A11.8 11.8 0 0 0 1.8 17.9L.1 24l6.3-1.7A11.8 11.8 0 0 0 23.9 12c0-3.2-1.2-6.1-3.5-8.4Z" />
    </svg>
  );
}

export function whatsappHref(message: string, url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`;
}

export function InviteShare({
  url,
  message,
  title,
  labels,
}: {
  url: string;
  message: string;
  title: string;
  labels: { whatsapp: string; share: string; copy: string; copied: string };
}) {
  const canShare = useClientValue(() => typeof navigator.share === "function", false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="grid gap-2.5">
      <a href={whatsappHref(message, url)} target="_blank" rel="noopener noreferrer" className="inv-btn flex h-12 items-center justify-center gap-2 rounded-full text-[0.95rem] font-medium">
        <WhatsAppIcon className="size-5" />
        {labels.whatsapp}
      </a>
      <div className="grid grid-cols-2 gap-2.5">
        {canShare ? (
          <button
            type="button"
            onClick={() => navigator.share({ title, text: message, url }).catch(() => {})}
            className="inv-btn-outline flex h-11 items-center justify-center gap-2 rounded-full text-sm"
          >
            <Share2 className="size-4" aria-hidden />
            {labels.share}
          </button>
        ) : null}
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard?.writeText(url).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className={`inv-btn-outline flex h-11 items-center justify-center gap-2 rounded-full text-sm ${canShare ? "" : "col-span-2"}`}
          aria-live="polite"
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
          {copied ? labels.copied : labels.copy}
        </button>
      </div>
    </div>
  );
}
