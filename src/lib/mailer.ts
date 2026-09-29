import "server-only";
import { env } from "./env";

export type Mail = { to: string; subject: string; html: string; text: string };

/**
 * Sends transactional email through Resend's HTTP API. Without an API key the
 * message is logged, which keeps local development and CI dependency-free.
 */
export async function sendMail(mail: Mail): Promise<void> {
  const { RESEND_API_KEY, EMAIL_FROM } = env();
  if (!RESEND_API_KEY) {
    console.info(`[mail] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text }),
  });
  if (!res.ok) {
    throw new Error(`Email delivery failed (${res.status}): ${await res.text()}`);
  }
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Minimal bilingual action email (Arabic first). */
export function actionEmail(opts: { titleAr: string; titleEn: string; bodyAr: string; bodyEn: string; url: string; ctaAr: string; ctaEn: string }): Pick<Mail, "html" | "text"> {
  const url = escape(opts.url);
  const html = `<!doctype html><html><body style="margin:0;background:#faf7f2;font-family:Tahoma,Arial,sans-serif;color:#2b2622">
<div style="max-width:520px;margin:32px auto;background:#fff;border:1px solid #eadfce;border-radius:16px;padding:32px">
<div dir="rtl" style="text-align:right">
<h1 style="font-size:20px;margin:0 0 12px">${escape(opts.titleAr)}</h1>
<p style="line-height:1.8;margin:0 0 20px">${escape(opts.bodyAr)}</p>
<a href="${url}" style="display:inline-block;background:#8a6a3b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px">${escape(opts.ctaAr)}</a>
</div>
<hr style="border:none;border-top:1px solid #eee;margin:28px 0">
<div dir="ltr" style="text-align:left">
<h2 style="font-size:16px;margin:0 0 8px">${escape(opts.titleEn)}</h2>
<p style="line-height:1.6;margin:0 0 16px;font-size:14px">${escape(opts.bodyEn)}</p>
<a href="${url}" style="color:#8a6a3b;font-size:14px">${escape(opts.ctaEn)}</a>
</div></div></body></html>`;
  const text = `${opts.titleAr}\n${opts.bodyAr}\n\n${opts.titleEn}\n${opts.bodyEn}\n\n${opts.url}`;
  return { html, text };
}
