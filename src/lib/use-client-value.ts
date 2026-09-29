"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** Reads a browser-only value without a hydration mismatch (server renders `serverValue`). */
export function useClientValue<T>(get: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, get, () => serverValue);
}

function subscribeSeconds(cb: () => void) {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
}

/** Current time in whole seconds, ticking every second on the client; null during SSR. */
export function useNowSeconds(): number | null {
  return useSyncExternalStore(subscribeSeconds, () => Math.floor(Date.now() / 1000), () => null);
}
