<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Da3wa (دعوة) — guide for agents

Da3wa turns an invitation card image (made in Canva or by a designer) into a mobile-first event page with one shareable link. Guests arrive mostly from WhatsApp on phones, don't sign in, and can RSVP. Hosts and invitation designers manage events from a dashboard. The product is **Arabic-first**: Arabic is the default language, every screen must work right-to-left, and English/bilingual pages are secondary. `README.md` covers features, plans and deployment; this file covers how the code is organised and the rules that keep it working.

## Stack

Next.js 16 (App Router, Server Actions, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 (tokens in `src/app/globals.css`, no component library) · PostgreSQL + Drizzle ORM · Better Auth · sharp · Vitest. Package manager: **pnpm**.

## Local setup

```bash
cp .env.example .env        # needs DATABASE_URL and AUTH_SECRET (32+ chars)
pnpm install
pnpm db:migrate
pnpm dev
```

Defaults need no external services: `PAYMENT_PROVIDER=mock` (in-app test checkout at `/dashboard/billing/checkout/[orderId]`), `STORAGE_DRIVER=local` (files in `./storage`, served by `/media/...`), and emails are logged to the console. Give a test account credits with `pnpm credits:grant <email> <standard|premium> <n>`.

Before finishing any change, run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. CI (`.github/workflows/ci.yml`) runs the same checks plus migrations against Postgres.

## Map of the code

```
src/app/(site)/           Root layout #1: landing, auth, onboarding, dashboard. <html dir> follows the dashboard locale.
  dashboard/events/actions.ts   Most event mutations (create/save/upload/publish/banner/RSVP delete/upgrades).
  dashboard/events/[id]/        Overview, edit (tabbed editor + live preview iframe), rsvps (+ CSV export), gallery, qr.
  dashboard/billing/            Credits, order history, mock checkout.
src/app/(invite)/         Root layout #2: public invitation pages. Fonts for themes are loaded here.
  [slug]/page.tsx               Public page: draft → 404, archived/expired → status page, private → PIN gate.
  [slug]/calendar.ics/          .ics download.   preview/[eventId]/  owner-only preview in any status.
  actions.ts                    Guest actions: submit RSVP, unlock PIN.
src/app/api/              auth ([...all]), v/[eventId] (page-view beacon), payments/webhook/[provider], health.
src/app/media/            Serves files for the local storage driver.
src/components/invite/    The invitation page UI (Invitation, TemplateCard, Ornament, RsvpForm, Countdown, share buttons).
src/components/ui/        Small primitives (Button, form fields, Card, Badge, CopyButton).
src/lib/db/schema.ts      All tables. Migrations in drizzle/.
src/lib/plans.ts          Tiers (free/standard/premium) and entitlements: the single source of truth for gating.
src/lib/products.ts       Purchasable products and prices.
src/lib/billing.ts        Checkout, idempotent order fulfillment, credit ledger, credit redemption.
src/lib/payments/         PaymentProvider interface + mock and Stripe implementations.
src/lib/storage/          StorageDriver interface + local and S3-compatible drivers.
src/lib/images.ts         Upload validation (decode with sharp) → WebP variants + OG JPEG + blur placeholder.
src/lib/events/           queries.ts (requireEvent, stats), view.ts (pure helpers: language, publish checks, expiry),
                          invitation.ts (builds props for the public page), mutations.ts (duplicate, slug, image release).
src/lib/themes.ts         Invitation themes (colours, ornament, display font) exposed as CSS variables.
src/i18n/                 Dashboard dictionaries (ar is the source type, en must match) + guest strings in invite.ts.
tests/                    Vitest unit tests for pure logic (slug, csv, ics, datetime, plans).
```

## Domain model

- Every user has a personal **workspace**. Events, orders and credits belong to the workspace, not the user, so teams, studios and white-labelling can be added later. Always check access through the workspace (`requireEvent(id)` does this and 404s otherwise).
- An **event** has a `status` (draft/published/archived) and a `tier` (free/standard/premium). A tier is bought once per event, by payment or by redeeming a workspace credit, and never goes down.
- **Wall-clock time:** `eventDate` + `startTime`/`endTime` + `timezone` are what the host typed. `startsAt`/`endsAt` are derived UTC instants, recomputed on every save by `computeEventInstants()`. An end time before the start time means past midnight.
- **Two languages per field:** text fields come in `*Ar` / `*En` pairs. Read them with `pick(event, "field", lang)`, which falls back to the other language.
- **RSVPs:** the guest's browser keeps a cookie holding `rsvpId.token` so the guest can edit their answer; only the token's SHA-256 is stored. The guest list is never shown publicly.
- **Analytics:** one row per page view. A visitor is a keyed hash of a random cookie id; bots are ignored.

## Rules to keep

1. **Gate features on the server.** Use `entitlements(tier)` in server actions and route handlers, not only to disable UI. Render-time checks (e.g. `availableLangs`, `hasPageAccess`) are a second layer, not a replacement.
2. **Keep RTL working.** Use logical utilities (`ms-/me-`, `ps-/pe-`, `start-/end-`, `text-start`) and never hard-code left/right. Flip directional icons with `rtl:`/`ltr:`. Only force `dir="ltr"` on inherently LTR values (emails, URLs, phone numbers, slugs, times entered in inputs).
3. **Add every string twice.** Add each new dashboard string to `src/i18n/dictionaries/ar.ts` first; `en.ts` is typed against it, so it fails to compile until you add the English too. Guest-facing strings go in `src/i18n/invite.ts`. Arabic copy should sound natural, not machine-translated.
4. **Read profile data from the database.** Better Auth may serve the session from a cookie cache, so fields like onboarding state or account type can be stale there. Use `requireUser()` / `requireAppContext()` from `src/lib/session.ts`, which read the user from the database.
5. **Keep the public page light.** It is the most visited page and most guests are on mobile data. Avoid heavy client components or new dependencies there. Images go through `processAndStoreImage` and are rendered with the stored `srcSet`.
6. **Never leak private events.** PIN-protected events must not expose names, dates or images in metadata/OG tags, the `.ics` route, or RSVP actions.
7. **Payments stay provider-agnostic.** New gateways implement `PaymentProvider`. Grant purchases only through `fulfillOrder()`, which is idempotent: webhooks can arrive twice.
8. **Schema changes go through migrations.** Edit `schema.ts`, run `pnpm db:generate`, commit the generated SQL in `drizzle/`, then `pnpm db:migrate`. Never edit a migration that has already been applied.
9. **Don't let editor forms auto-reset.** React 19 resets a `<form action={...}>` after it submits, which desyncs controlled inputs. The event editor therefore submits through `onSubmit` + `startTransition`; keep it that way.
10. **Avoid setState in effects.** The React lint rules reject it. For browser-only values use `useClientValue`/`useNowSeconds` (`src/lib/use-client-value.ts`); to react to a new `useActionState` result, adjust state during render.

## Known gaps / next steps

- No admin UI (credits are granted with the CLI script); no refunds flow.
- No per-event custom RSVP questions, guest-list import, or WhatsApp bulk sending (out of scope for v1 by design).
- The local storage driver only works on a single node; use `STORAGE_DRIVER=s3` in production with several instances.
- Template-based events use a static default OG image (`public/og-default.jpg`); per-event generated OG images would need reliable server-side Arabic text shaping.
- Stripe, Google sign-in, Resend and Turnstile integrations are implemented but only exercised with real keys.
