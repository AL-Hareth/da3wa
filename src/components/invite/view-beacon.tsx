"use client";

import { useEffect } from "react";

/** Records one page view per browser session. Sent after load so it never delays rendering. */
export function ViewBeacon({ eventId }: { eventId: string }) {
  useEffect(() => {
    const key = `v:${eventId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Private mode: still count the view.
    }
    const body = JSON.stringify({ r: document.referrer ? new URL(document.referrer).hostname : null });
    if (!navigator.sendBeacon?.(`/api/v/${eventId}`, new Blob([body], { type: "application/json" }))) {
      fetch(`/api/v/${eventId}`, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  }, [eventId]);
  return null;
}
