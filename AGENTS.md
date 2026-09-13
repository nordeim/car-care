# AGENTS.md

Marketing + booking site for We Care Car Care (auto detailing, Framingham MA), pushed to `github.com/nordeim/car-care`. Next.js 16 App Router, single page (`/`) with two dialogs and two JSON APIs, SQLite via Prisma.

> Deep reference: **`car-care_SKILL.md`** (repo root) — design system, coding patterns, anti-patterns, debugging guide, pre-ship checklist. This file is the compact onboarding; that one is the full engineering skill.

## Commands

Package manager is **bun** (`bun.lock`). Node 24 also present but use bun.

| Command | Purpose |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Dev server on :3000, output tee'd to `dev.log` |
| `bun run build` | Prod build **and** copies `static` + `public` into `.next/standalone/` — the copy step is required for `start` to work. TypeScript errors **fail** this build |
| `bun run start` | Runs `.next/standalone/server.js` under bun with `NODE_ENV=production`, logs to `server.log` |
| `npm test` | Vitest — 66 unit tests in 8 files (`npm run test:watch` for watch mode) |
| `bun run e2e` | Playwright — 31 e2e tests on the standalone build (:3100; `bun run build` first; `e2e:all`, `e2e:report` variants) |
| `bun run lint` | ESLint 9 flat config |
| `bunx tsc --noEmit` | Typecheck — clean by default now (reference dirs excluded) |
| `bun run db:push` | Push Prisma schema to SQLite via the `scripts/db.ts` wrapper (pins the runtime-resolved absolute path so CLI and server share one file; `--accept-data-loss` is part of the script) |
| `bun run db:generate` | Regenerate Prisma client after schema edits |
| `bun run db:migrate` / `db:reset` | Prisma migrate dev / reset |

**Verification gate before every commit**: `npm test` && `bun run e2e` && `bun run lint` && `bunx tsc --noEmit` && `bun run build`.

## Architecture

- **Content lives in one file**: `src/data/wcc/content.ts` — all services, prices, service areas, business facts, FAQs, testimonials. Change pricing/copy there, never in components. `BOOKABLE_SERVICES` is derived from `PACKAGES` / `CERAMIC_TIERS` / `INTERIOR_ONLY` (now with one-line `summary` + `popular` flags) — don't hand-edit it.
- **Booking logic**: `src/lib/wcc/booking.ts` (`findService`, `quoteFor` — ceramic add-on is flat $200, `buildDayOptions` — Sun closed, 6 slots/day).
- **Date rules**: `src/lib/wcc/dates.ts` — timezone-safe `isSunday` / `isWithinBookingWindow` (weekday derived from the ISO string via UTC, "today" from `America/New_York` via `Intl`). Never use `new Date(iso).getDay()` (host-TZ dependent) for business rules.
- **Validation schemas**: `src/lib/wcc/schemas.ts` — the zod schemas for bookings + questions. Single source of truth; the API routes import from here. Update tests in `src/lib/wcc/__tests__/schemas.test.ts` when changing fields.
- **Rate limiting**: `src/lib/wcc/rate-limit.ts` — `SlidingWindowRateLimiter` (5 req / 10 min per IP, prunes stale keys). Shared instances used by both routes. `clientIpFrom` prefers `cf-connecting-ip` (Cloudflare) then the first `x-forwarded-for` hop (contract-tested in `client-ip.test.ts`).
- **Dialog state**: zustand store `src/lib/wcc/booking-store.ts` (`useWccDialogs`), **not** React Context. `openBooking(serviceKey?, { addOnCeramic?: boolean })` — the second arg powers the "Smart Add-On" preselect.
- **APIs**: `src/app/api/{bookings,questions}/route.ts` — POST-only, payload-size guard (413 >32KB) → zod validation → honeypot check → rate limit (keyed `cf-connecting-ip` → first XFF hop) → business rules (Sunday closed; address required for mobile/pickup) → Prisma insert. Honeypot field is `company`: filled ⇒ fake `201` success, no row written.
- **DB**: SQLite at `db/custom.db` (**gitignored — never commit customer PII**), `DATABASE_URL` in `.env`. Prisma client is a `globalThis` singleton; `log: ['query']` runs in dev only. `src/lib/wcc/db-url.ts` is the shared, unit-tested resolver (`resolveDatabaseUrl`) used by BOTH `src/lib/db.ts` (runtime) and `scripts/db.ts` (a CLI wrapper that all `db:*` package scripts go through) — it re-anchors any relative `file:*db/custom.db` to an absolute repo-root path so CLI, dev, standalone, and E2E land on one file regardless of inherited env vars (bun auto-loads parent `.env` files; CI shells may export their own `DATABASE_URL`). `e2e/helpers/db.ts` mirrors the runtime resolution. Live URL is `https://car-care.jesspete.shop` (env-driven via `NEXT_PUBLIC_SITE_URL`/`SITE_URL`).

## Styling

Tailwind **v4 CSS-first**: tokens are `@theme inline` + `:root` in `src/app/globals.css` (no `tailwind.config.ts` — it was removed with the Tailwind 3 leftovers). Site is dark-first (`<html className="dark">`, hardcoded). Fonts: Oswald (display, `font-display` class) + Archivo (body) via `next/font`, CSS vars `--font-oswald` / `--font-archivo`. Two-tone accent system: amber `--primary` `#f2a61c` for CTAs/numbers, teal `--accent-teal` `#5eead4` for keyword highlights (`text-accent-teal`).

## Env & Live Deploy

Live deploy: **`https://car-care.jesspete.shop`** (canonical). SEO is env-driven: `NEXT_PUBLIC_SITE_URL` / `SITE_URL` in `.env` (fallback `https://car-care.jesspete.shop`) feeds `metadataBase` in `layout.tsx`, `sitemap.ts`, and dynamic `robots.ts`. Static `public/robots.txt` is a fallback (aligned to live Sitemap). Original source reference remains `https://wecarecarcare.com`.

## Tests

Vitest (`vitest.config.ts`, node env, `@/` alias). `src/lib/wcc/__tests__/` holds the suites: `booking.test.ts` (pricing/slots regression locks), `dates.test.ts` (timezone-safe rules), `schemas.test.ts` (accept/reject matrix), `rate-limit.test.ts` (window + prune), `booking-store.test.ts` (dialog presets). Run green under UTC / America/New_York / Asia/Singapore — keep it that way when touching date logic.

Playwright (`playwright.config.ts`, `e2e/`) drives the **standalone production build** via `bun run start` (never `next dev`) on :3100: smoke (sections, dual pricing, sliders, lazy images, mobile FAB, console-error-free), SEO/JSON-LD, booking funnel with SQLite server-truth assertions + test-row cleanup, API contracts (400/413/422/429/honeypot/201, unique `x-forwarded-for` per test), and axe a11y gates (critical + serious). Specs are typechecked by `tsc` (tsconfig includes `e2e/`). Env template: `.env.example` → `cp .env.example .env`.

## Gotchas

- `next.config.ts` now has `typescript.ignoreBuildErrors: false` and `reactStrictMode: true` — the build enforces types; keep `tsc --noEmit` clean anyway (it checks more than the build).
- ESLint now has `react-hooks/set-state-in-effect: off` — intentional setState in effect for `booking-dialog.tsx` dialog reset and `carousel.tsx` select (see lint gate).
- **Standalone DB trap:** `src/lib/db.ts` does `process.chdir(__dirname)` in `.next/standalone/server.js`, so naive `file:../db/custom.db` (relative to `prisma/`) would resolve to `standalone/db/custom.db` at runtime. The client now normalizes any `file:*db/custom.db` to an absolute repo-root path (cwd-aware: detects `.next/standalone` and walks up). Keep `.env` as `file:../db/custom.db` (portable); both CLI (`db:push`) and runtime (dev + standalone + E2E) now share one file.
- **Site URL:** SEO (`metadataBase`, OG, `sitemap.ts`, `robots.ts`) reads `NEXT_PUBLIC_SITE_URL` / `SITE_URL` (fallback live `https://car-care.jesspete.shop`). `public/robots.txt` is now a static fallback — the dynamic `src/app/robots.ts` is the source of truth.
- ESLint ignores: `foundation/**`, `scripts/**`, `examples/**`, `skills`, plus build dirs. Many rules are off (sandbox template defaults).
- `foundation/`, `upload/`, `tool-results/`, `skills/`, `download/`, `db/` are sandbox-local or runtime artifacts and gitignored — never import from or commit them.
- `examples/websocket/` and `tests/*.sh` are template scaffolding, unrelated to the site.
- Long date/time strings in the booking dialog come from `buildDayOptions`; the API re-validates everything — client-side checks are UX only.
- Confirmation codes (`WCC-XXXXXX`) are the **last 6 chars of the Prisma cuid**, generated server-side.
- Toasts: use `sonner` (`import { toast } from "sonner"`). The sonner `<Toaster />` is mounted in `layout.tsx`; the old radix toast system was removed. Calling `useToast` will fail — it no longer exists.
- Only 9 shadcn primitives remain in `src/components/ui/` (accordion, button, carousel, dialog, input, label, sheet, sonner, textarea). If you need another, add it with the shadcn CLI and its dependency — don't resurrect removed files from git history unless you also restore the dep.

## Git

- Branch `main`, conventional commits.
- Pushing from this sandbox (no `openssh` — use the Paramiko wrapper; path is repo-relative):
  ```bash
  GIT_SSH_COMMAND="docs/ssh_git_wrapper_v3.py -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=accept-new" git push origin main
  ```
  (run from the repo root; see `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`)
- `.env`, `worklog.md`, `db/*.db`, SSH keys must never be committed (already gitignored). Guard: `scripts/skill-verify.sh` check 9 fails the gate if `.env` or any `.db` is tracked — commit `34a172d` regressed this once (re-tracked both); don't repeat it.

## Local gate (post-browser, post-cleanup): 
 
```bash 
  npm test          # 66/66 (8 files) — also TZ=UTC / Asia/Singapore green (reran explicitly) 
  bunx tsc --noEmit # 0 
  bun run lint      # 0 
  bun run build     # Route (app) ○ /, ƒ /api/bookings, ƒ /api/questions, ○ /icon.svg, ○ /sitemap.xml, ○ /robots.txt 
  bun run e2e       # 31/31 using 1 worker — includes 413 payload contracts on both routes
  bash scripts/skill-verify.sh  # ALL CHECKS PASSED (incl. git-invariant check 9: no tracked .env/.db)
```

