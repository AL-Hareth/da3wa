# Da3wa (دعوة)

**Upload your invitation card, add the details, and share one elegant event link.**

Da3wa turns an existing invitation card (from Canva or a local designer) into a fast, mobile-first event page — Arabic-first with full RTL, plus English and bilingual pages. Guests open the link from WhatsApp, see the card, countdown, map and calendar buttons, and RSVP without an account. Hosts and invitation designers manage everything from a dashboard.

## Features

**Public invitation page** (`/{slug}`)
- Uploaded card shown prominently (responsive WebP variants + blur placeholder), or a generated card from a built-in template
- Six themes (ivory/gold, minimal, blush, emerald, royal navy, sage) with Arabic display typography (Amiri, Aref Ruqaa, El Messiri, Reem Kufi) and ornament styles
- Arabic, English or bilingual (language toggle); optional Hijri date
- Countdown, Google Maps directions, add-to-calendar (`.ics` + Google Calendar), WhatsApp / native share / copy link
- Optional RSVP (attending / not attending / maybe, party size, optional phone & note); returning guests can edit their response; guest list is never public
- Update banner (time change, venue change, announcement)
- Optional PIN protection (link previews never leak details of private events)
- Photo gallery (premium), platform branding on free pages, page expiry by plan
- Spam protection: honeypot, Postgres-backed rate limiting, optional Cloudflare Turnstile
- Privacy-friendly analytics beacon (keyed hash of a random visitor id; bots ignored)

**Host dashboard** (`/dashboard`)
- Email/password (with reset + optional verification) and Google sign-in via Better Auth
- Onboarding as individual, invitation designer or planner; designers see client names on every event
- Create, edit (tabbed editor with live mobile/desktop preview), preview, publish, unpublish, archive, duplicate, delete
- Stats: page views, unique visitors, RSVP counts incl. "no response" (from invitations sent)
- RSVP table with search/filter, CSV export (Excel-friendly UTF-8 BOM, formula-injection safe)
- QR code (SVG/PNG), share to WhatsApp / Messenger
- Credits & billing: per-event upgrades, credit packs for designers, order history
- Arabic/English dashboard

## Plans

| | Free | Standard | Premium |
|---|---|---|---|
| Drafts & preview | ✓ | ✓ | ✓ |
| Publish | — ¹ | ✓ | ✓ |
| Themes | 2 | all | all |
| RSVP responses | 25 | unlimited | unlimited |
| Custom slug, no branding, QR, CSV, update banner | — | ✓ | ✓ |
| Bilingual page, PIN, gallery | — | — | ✓ |
| Page lifetime after event | 7 days | 30 days | 1 year |

¹ Set `FREE_PUBLISH_ENABLED=true` to allow publishing free events (with branding and the RSVP cap).

Entitlements live in `src/lib/plans.ts`; prices and products in `src/lib/products.ts`. Publishing consumes an upgrade that is attached to the event permanently, paid either by a one-time checkout or by redeeming a workspace credit.

## Stack

- Next.js 16 (App Router, Server Actions, Turbopack), React 19, TypeScript, Tailwind CSS 4
- PostgreSQL + Drizzle ORM (SQL migrations in `drizzle/`)
- Better Auth (email/password, Google, DB-backed rate limiting)
- sharp for image validation/processing; pluggable storage (local disk or any S3-compatible bucket)
- Pluggable payments (`mock` for development, Stripe Checkout for production)

## Getting started

```bash
cp .env.example .env            # set DATABASE_URL and AUTH_SECRET (openssl rand -hex 32)
pnpm install
pnpm db:migrate
pnpm dev                        # http://localhost:3000
```

With `PAYMENT_PROVIDER=mock`, upgrades go through an in-app test checkout. To give a user credits manually:

```bash
pnpm credits:grant someone@example.com standard 5 "launch promo"
```

### Scripts

| Command | |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | ESLint, TypeScript, Vitest |
| `pnpm db:generate` | Generate a migration after editing `src/lib/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations |
| `pnpm credits:grant` | Grant credits to a user's workspace |

## Deployment

`docker compose up --build` runs Postgres + the app. The Docker image uses Next's standalone output and applies migrations on start (`scripts/migrate.mjs`). Health check: `GET /api/health`.

Production checklist:
- `APP_URL` must be the public origin (used for share links, QR codes, OG images and auth callbacks)
- Use `STORAGE_DRIVER=s3` with a public bucket/CDN (`S3_PUBLIC_BASE_URL`) when running more than one instance
- Stripe: set `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and point a webhook for `checkout.session.*` events at `{APP_URL}/api/payments/webhook/stripe`
- Google sign-in redirect URI: `{APP_URL}/api/auth/callback/google`
- Email (password reset / verification) via Resend: `RESEND_API_KEY`, `EMAIL_FROM`
- Turnstile keys for RSVP spam protection
- Client IPs are read from `cf-connecting-ip` / `x-real-ip` / `x-forwarded-for`, so run behind a trusted proxy

### Adding a payment provider

Implement `PaymentProvider` (`src/lib/payments/types.ts`): `createCheckout` returns a hosted-checkout URL for a pending order, and `handleWebhook` reports `paid` / `failed`. Fulfillment (`fulfillOrder` in `src/lib/billing.ts`) is provider-agnostic and idempotent. Regional gateways (Tap, Moyasar, HyperPay, PayTabs) fit the same interface.

## Project layout

```
src/app/(site)/        marketing, auth, onboarding, dashboard (root layout: dashboard locale)
src/app/(invite)/      public invitation pages, preview, calendar file (root layout: invitation fonts)
src/app/api/           auth, analytics beacon, payment webhooks, health
src/components/invite/ invitation page UI (themes, ornaments, RSVP, countdown, share)
src/lib/               db schema, auth, plans, billing, payments, storage, images, i18n helpers
src/i18n/              dashboard dictionaries (ar/en) and guest-facing invitation strings
```

## Designed for later

Events, orders and credits belong to a **workspace** (every user gets a personal one), with `workspace_member` roles and reserved branding columns, so teams, designer studios, client portals and white-labelling can be added without migrating ownership.
