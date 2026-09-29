<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project notes

- Arabic-first: dashboard strings live in `src/i18n/dictionaries/{ar,en}.ts` (English must satisfy the Arabic `Dict` type); guest-facing invitation strings in `src/i18n/invite.ts`. Use logical Tailwind utilities (`ms-`, `pe-`, `start-`, `text-start`) so layouts work in RTL and LTR.
- Two root layouts: `src/app/(site)` (dashboard/marketing, locale from cookie) and `src/app/(invite)` (public invitation pages, direction set per event).
- Feature gating goes through `entitlements()` in `src/lib/plans.ts`; enforce it in server actions, not only in the UI.
- Session data may come from Better Auth's cookie cache — read profile fields via `requireUser()`/`requireAppContext()` (fresh from the DB).
- Schema changes: edit `src/lib/db/schema.ts`, then `pnpm db:generate` and `pnpm db:migrate`.
- Checks: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
