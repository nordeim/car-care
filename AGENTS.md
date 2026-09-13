# AGENTS.md

Marketing + booking site for We Care Car Care (auto detailing, Framingham MA), pushed to `github.com/nordeim/car-care`. Next.js 16 App Router, single page (`/`) with two dialogs and two JSON APIs, SQLite via Prisma.

## Commands

Package manager is **bun** (`bun.lock`). Node 24 also present but use bun.

| Command | Purpose |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Dev server on :3000, output tee'd to `dev.log` |
| `bun run build` | Prod build **and** copies `static` + `public` into `.next/standalone/` — the copy step is required for `start` to work |
| `bun run start` | Runs `.next/standalone/server.js` under bun with `NODE_ENV=production`, logs to `server.log` |
| `bun run lint` | ESLint 9 flat config |
| `bunx tsc --noEmit` | Typecheck — **run this yourself**; see Gotchas |
| `bun run db:push` | Push Prisma schema to SQLite (`--accept-data-loss` is part of the script) |
| `bun run db:generate` | Regenerate Prisma client after schema edits |
| `bun run db:migrate` / `db:reset` | Prisma migrate dev / reset |

There is **no test suite**. Verification = `bun run lint` + `bunx tsc --noEmit` + manual booking-flow E2E + `curl` the APIs.

## Architecture

- **Content lives in one file**: `src/data/wcc/content.ts` — all services, prices, service areas, business facts, FAQs, testimonials. Change pricing/copy there, never in components. `BOOKABLE_SERVICES` is derived from `PACKAGES` / `CERAMIC_TIERS` / `INTERIOR_ONLY` — don't hand-edit it.
- **Booking logic**: `src/lib/wcc/booking.ts` (`findService`, `quoteFor` — ceramic add-on is flat $200, `buildDayOptions` — Sun closed, 6 slots/day).
- **Dialog state**: zustand store `src/lib/wcc/booking-store.ts` (`useWccDialogs`), **not** React Context. Any component can call `openBooking("premium-full")`.
- **APIs**: `src/app/api/{bookings,questions}/route.ts` — POST-only, zod validation → honeypot check → IP rate limit (5 req / 10 min, in-memory) → business rules (Sunday closed; address required for mobile/pickup) → Prisma insert. Honeypot field is `company`: filled ⇒ fake `201` success, no row written.
- **DB**: SQLite at `db/custom.db` (tracked in repo), `DATABASE_URL` in `.env` (gitignored). Prisma client is a `globalThis` singleton with `log: ['query']` in dev.
- **Route handler** `src/app/api/route.ts` is template scaffolding (hello world) — unused.

## Styling

Tailwind **v4 CSS-first**: tokens are `@theme inline` + `:root` in `src/app/globals.css`. A legacy `tailwind.config.ts` also exists (scaffold) — real tokens are in CSS. Site is dark-first (`<html className="dark">`, hardcoded). Fonts: Oswald (display, `font-display` class) + Archivo (body) via `next/font`, CSS vars `--font-oswald` / `--font-archivo`. Amber brand color `#f2a61c`.

## Gotchas

- `next.config.ts` has `typescript.ignoreBuildErrors: true` and `reactStrictMode: false` — **build will not fail on type errors**, always run `bunx tsc --noEmit` before pushing.
- ESLint ignores: `foundation/**`, `scripts/**`, `examples/**`, `skills`, plus build dirs. Many rules are off (sandbox template defaults).
- `foundation/`, `upload/`, `tool-results/`, `skills/`, `download/` are sandbox-local and gitignored — never import from or commit them.
- `examples/websocket/` and `tests/*.sh` are template scaffolding, unrelated to the site.
- Long date/time strings in the booking dialog come from `buildDayOptions`; the API re-validates everything — client-side checks are UX only.
- Confirmation codes (`WCC-XXXXXX`) are the **last 6 chars of the Prisma cuid**, generated server-side.

## Git

- Branch `main`, conventional commits.
- Pushing from this sandbox: no `openssh` — use the Paramiko wrapper:
  ```bash
  GIT_SSH_COMMAND="/home/z/my-project/docs/ssh_git_wrapper_v3.py -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=accept-new" git push origin main
  ```
- `.env`, `worklog.md`, SSH keys must never be committed (already gitignored).
