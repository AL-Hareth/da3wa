import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { env } from "./env";

/** Best-effort client IP. Assumes the app runs behind a trusted proxy / CDN. */
export function clientIpFrom(h: Headers): string {
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0"
  );
}

export async function clientIp(): Promise<string> {
  return clientIpFrom(await headers());
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hmac(input: string): string {
  return createHmac("sha256", env().AUTH_SECRET).update(input).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** One-way, keyed hash so IPs are never stored in plain text. */
export function hashIp(ip: string): string {
  return hmac(`ip:${ip}`).slice(0, 32);
}

export function deviceFromUserAgent(ua: string | null): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

export function isBot(ua: string | null): boolean {
  return !ua || /bot|crawler|spider|preview|facebookexternalhit|WhatsApp|TelegramBot|Slackbot|Discordbot|headless/i.test(ua);
}
