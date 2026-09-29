"use client";

import { MessageCircle, Share2 } from "lucide-react";
import { useClientValue } from "@/lib/use-client-value";
import { WhatsAppIcon, whatsappHref } from "../invite/share-buttons";
import { buttonClass } from "../ui/button";

export function SharePanel({
  url,
  message,
  facebookAppId,
  labels,
}: {
  url: string;
  message: string;
  facebookAppId?: string;
  labels: { whatsapp: string; messenger: string; nativeShare: string; copy: string; copied: string };
}) {
  const mobile = useClientValue(() => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent), false);
  const canShare = useClientValue(() => typeof navigator.share === "function", false);

  const messengerHref = mobile
    ? `fb-messenger://share/?link=${encodeURIComponent(url)}`
    : facebookAppId
      ? `https://www.facebook.com/dialog/send?app_id=${facebookAppId}&link=${encodeURIComponent(url)}&redirect_uri=${encodeURIComponent(url)}`
      : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <a href={whatsappHref(message, url)} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp", "sm")}>
        <WhatsAppIcon className="size-4" />
        {labels.whatsapp}
      </a>
      <a href={messengerHref} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "sm")}>
        <MessageCircle className="size-4" aria-hidden />
        {labels.messenger}
      </a>
      {canShare && (
        <button type="button" className={buttonClass("outline", "sm")} onClick={() => navigator.share({ text: message, url }).catch(() => {})}>
          <Share2 className="size-4" aria-hidden />
          {labels.nativeShare}
        </button>
      )}
    </div>
  );
}
