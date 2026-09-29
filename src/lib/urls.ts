import "server-only";
import { appUrl } from "./env";

export function eventPublicUrl(slug: string) {
  return appUrl(`/${slug}`);
}

/** Display form without protocol, e.g. "da3wa.app/sarah-and-omar". */
export function prettyUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
