---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
project_type: nextjs-fullstack
version: 1.1.0
last_updated: 2026-09-13
---

# We Care Car Care (car-care)

Customer-facing marketing and booking site for **We Care Car Care**, an auto detailing and ceramic coating studio in Framingham, MA (MetroWest Boston). One page sells the services; a 4-step dialog turns visitors into persisted booking requests; a question dialog captures inquiries. No accounts, no admin surface — leads land in SQLite for the owner to action.

**Tech Stack**: Next.js 16.3.5 (App Router, standalone output), React 19.3, TypeScript 5.9, Tailwind CSS 4.3, shadcn/ui (Radix), Prisma 6.19 + SQLite, Zustand 5, Zod 4.6, Vitest 5, bun 1.3. **Live:** `https://car-care.jesspete.shop` (env-driven SEO). Exact locked versions: `bun pm ls` (or see `car-care_SKILL.md` §2).

## Core Identity & Purpose

- Single-product local-business site: content is fixed, traffic is organic, the conversion goal is a booking or a phone call.
- All business facts (prices, service areas, hours, phone) are real and live in `src/data/wcc/content.ts` — the single source of truth.
- The repo (`nordeim/car-care`) also carries reference material under `docs/` (prompt, skill docs, build archives) that predates the code; treat it as read-only history.
- **PRD:** `PRD.md` (repo root) — canonical requirements (vision, F1–F5, pricing, API contracts, DoD) derived from `docs/prompt-to-create.md` + `content.ts`.

## Foundational Principles

### Meticulous Approach (Six-Phase Workflow)

1. **ANALYZE** — Deep, multi-dimensional requirement mining; never make surface-level assumptions
2. **PLAN** — Structured execution roadmap; present for confirmation before coding
3. **VALIDATE** — Explicit approval checkpoint; address concerns before implementation
4. **IMPLEMENT** — Modular, testable components; document alongside code
5. **VERIFY** — Rigorous QA: lint, typecheck, manual E2E of the booking flow
6. **DELIVER** — Complete handoff with instructions and known-tradeoff notes

### Project-Specific Principles

- **Content as data, not markup**: every price, service, and area shown on the page comes from `content.ts` via typed exports. Never hardcode business facts in JSX.
- **Server re-validates everything**: client-side validation is UX sugar; the API is the authority (zod + business rules).
- **Bots learn nothing**: the honeypot returns a fake success payload; never change it to an error response.
- **Dark-first brand**: the site is dark by design (hardcoded `<html className="dark">`) — do not introduce a light theme.

## Implementation Standards

### Next.js 16 Specific

- App Router, `src/app/` layout; the site is a single route (`page.tsx`) composing server components; dialogs are client islands.
- Route handlers in `src/app/api/{resource}/route.ts` — POST-only for form submissions.
- Fonts via `next/font/google` (Oswald, Archivo) exposed as CSS variables; Metadata API + JSON-LD `AutoWash` schema in `layout.tsx` — now **env-driven** (`NEXT_PUBLIC_SITE_URL` / `SITE_URL` → `metadataBase`, OG, `sitemap.ts`, `robots.ts`); fallback `https://car-care.jesspete.shop` (live), original ref `https://wecarecarcare.com`. Update structured data together with `content.ts` facts.
- `next.config.ts`: `output: "standalone"` (note: standalone `server.js` does `process.chdir(__dirname)` — see Database); `typescript.ignoreBuildErrors: false` (build enforces types); `reactStrictMode: true`.

### React 19 / TypeScript

- Server Components by default; `"use client"` only where interactivity is needed (dialogs, header, slider, carousel).
- Client state: **Zustand** store for dialog state (`src/lib/wcc/booking-store.ts`), local `useState` for form state. Do not add React Context for this.
- `@/*` path alias → `./src/*`.
- No `forwardRef` needed (React 19 ref props).

### Tailwind CSS 4

- **CSS-first**: tokens live in `@theme inline` + `:root` in `src/app/globals.css` (`--background: #0a0b0d`, `--primary: #f2a61c`, `--accent-teal: #5eead4`, …). Extend the CSS variables, not a JS config (`tailwind.config.ts` was removed).
- Two-tone accent system: amber `--primary` for CTAs/key numbers; teal `--accent-teal` (`text-accent-teal`) for keyword highlights in headlines.
- Brand utilities: `.font-display`, `.grain`, `.shine`, `[data-reveal]` — defined in `globals.css`.

### Component Conventions

- Site sections: `src/components/wcc/*.tsx`, PascalCase named exports (`export function Hero()`).
- UI primitives: `src/components/ui/*` (shadcn). Import from there; do not restyle globals.
- Copy lives in `content.ts`; components stay presentational.

## Development Workflow

### Environment Setup

```bash
bun install
cp .env.example .env   # DATABASE_URL="file:../db/custom.db" (relative to prisma/) + NEXT_PUBLIC_SITE_URL/SITE_URL="https://car-care.jesspete.shop"
bun run db:generate
bun run db:push         # db.ts normalizes to absolute at runtime for standalone chdir trap
bun run dev             # http://localhost:3000 (live SEO still points to https://car-care.jesspete.shop)
```

### Build Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server on :3000 (output tee'd to `dev.log`) |
| `bun run build` | Prod build + copies `static`/`public` into `.next/standalone/` — type errors fail the build |
| `bun run start` | Serve standalone build with bun (`server.log`) |
| `npm test` | Vitest unit suite (49 tests) |
| `bun run e2e` | Playwright e2e suite (29 tests) on the standalone build — `bun run build` first; suite manages its own server on :3100 (`e2e:all`, `e2e:report`) |
| `bun run lint` | ESLint 9 (flat config) |
| `bunx tsc --noEmit` | Type check — mandatory |
| `bun run db:push` | Apply `prisma/schema.prisma` to SQLite (accepts data loss) |
| `bun run db:generate` | Regenerate Prisma client |

### Database (Prisma + SQLite)

- Models: `Booking`, `Question` (`prisma/schema.prisma`). Client singleton in `src/lib/db.ts` (query logging dev-only, **cwd-aware** absolute resolver for standalone — `file:../db/custom.db` is portable for `db:push` but runtime resolves to repo-root absolute whether cwd is repo root or `.next/standalone`; `e2e/helpers/db.ts` mirrors this).
- Inspect data with `bunx prisma studio`. `db/custom.db` is a **runtime artifact, gitignored** — never commit it (customer PII).

## Testing Strategy

**Vitest unit suite** in `src/lib/wcc/__tests__/` (`npm test`, 49 tests): pricing/quote logic, day-slot generation, **timezone-safe date rules** (verify under multiple `TZ`), zod schemas (accept/reject matrix), the shared rate limiter, and the dialog store. Use TDD for logic changes: write the failing test first (`RED`), implement (`GREEN`), refactor with the suite green.

**Playwright e2e suite** in `e2e/` (`bun run e2e`, 29 tests) — adapted from `nordeim/home-financing`: runs the standalone production server (never `next dev`), asserts booking-funnel server truth in SQLite with test-row cleanup, API contracts (400/422/429/honeypot/201) with unique `x-forwarded-for` per test, SEO/JSON-LD, smoke (sections, dual pricing, sliders, lazy images, mobile FAB), and axe-core a11y gates (critical + serious must be zero). Specs are included in `tsc` typechecking. Setup uses `cp .env.example .env`.

Before delivering changes:

```bash
npm test                 # unit suite green
bun run lint             # lint clean
bunx tsc --noEmit        # type clean
bun run build            # standalone build succeeds (types enforced)
```

Then manual E2E: open `/`, run the booking dialog end-to-end (service → date/time → contact → confirm), expect a `WCC-XXXXXX` confirmation and a row in `db.booking`. API-level checks:

```bash
curl -s -X POST localhost:3000/api/bookings -H 'content-type: application/json' -d '{"serviceKey":"premium-full","vehicleType":"sedan","serviceMode":"shop","date":"<next weekday YYYY-MM-DD>","time":"09:30 AM","name":"Test User","phone":"5551234567","email":"t@t.com","addOnCeramic":false,"company":""}'
```

Expect `201` + `confirmation`; expect `422` for Sunday dates, missing address on `mobile`/`pickup`, and unknown service keys; expect fake `201` + `confirmation: "WCC-000000"` when `company` is non-empty (honeypot). Clean test rows afterward (`bunx prisma studio`).

## Code Quality Standards

- ESLint flat config (`eslint.config.mjs`) extends `next/core-web-vitals` + `next/typescript`; many rules deliberately off (sandbox template). `foundation/**`, `scripts/**`, `examples/**`, `skills` are ignored.
- Keep the `content.ts` typing style: `satisfies` / `as const` for literal data.
- Error paths in APIs return `{ error: string }` JSON with proper status (`400`/`422`/`429`/`500`); user-facing fallback text always includes the shop phone number.

## Git & Version Control

- Branch: `main`. Conventional Commits (`feat:`, `fix:`, `chore:`). Atomic commits.
- Sandbox pushes use the Paramiko SSH wrapper (no openssh installed):

```bash
GIT_SSH_COMMAND="/home/z/my-project/docs/ssh_git_wrapper_v3.py -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=accept-new" git push origin main
```

- Never commit `.env`, `worklog.md`, SSH keys, or anything under `upload/`, `tool-results/`, `foundation/`, `skills/`.

## Error Handling & Debugging

- API failures: zod issues surface as `422 {error, issues[]}`; DB failures log to console with a `[api/<route>]` prefix and return `500` with a call-the-shop message.
- Client: `sonner` toasts for submit outcomes (sonner `<Toaster />` mounted in `layout.tsx`); `booking-dialog.tsx` keeps inline `submitError` state.
- Dev server output lands in `dev.log` (tail it). Prisma logs every query in dev.
- Rate limit is in-memory per process — restarting dev resets it.

## Communication & Documentation

- Explain *why* in code comments at non-obvious decisions (see `reveal.tsx`, `before-after.tsx` for the house style).
- Update `content.ts` when business facts change; keep JSON-LD in `layout.tsx` in sync.
- Deep reference: `Project_Architecture_Document.md` (ADRs, security model, data architecture).
- Engineering skill: `car-care_SKILL.md` (repo root) — distilled design system, coding patterns, anti-patterns, debugging guide, pre-ship checklist.

## Project-Specific Standards

### Architecture

- Single page (`src/app/page.tsx`) composes 9 section components + 2 global dialogs mounted once.
- Data flow: `content.ts` → components (render) and API routes (validation/pricing) — one source for both.
- Dialog orchestration via `useWccDialogs` zustand store; CTAs anywhere can `openBooking(serviceKey?, { addOnCeramic? })` (the options object powers the Smart Add-On preselect).

### API Design

| Endpoint | Method | Auth | Notes |
|----------|--------|------|-------|
| `/api/bookings` | POST | none | zod → honeypot → rate limit → rules → persist; returns `{ok, confirmation, priceQuote}` |
| `/api/questions` | POST | none | zod → honeypot → rate limit → persist; returns `{ok}` |
| `/api` | GET | none | template hello-world, unused |

Server-computed rules (do not trust the client): Sunday closure (**timezone-safe** — weekday derived from the ISO date, "today" from `America/New_York`; see `src/lib/wcc/dates.ts`), address required for `mobile`/`pickup`, service key must exist, date within next 60 days, price quote recomputed server-side via `quoteFor`.

### Data Layer

- Prisma + SQLite; no migrations workflow in use (`db:push`). Two models, `createdAt`-indexed for chronological listing.
- Booking `priceQuote` is the server-computed quote at submission time (`Int`, USD).

### Environment Variables

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `DATABASE_URL` | Yes | SQLite file URL for Prisma (relative to `prisma/`; runtime normalized to absolute for standalone) | `file:../db/custom.db` |
| `NEXT_PUBLIC_SITE_URL` | Yes (SEO) | Canonical site URL for `metadataBase`/OG/`sitemap`/`robots` (client + server) | `https://car-care.jesspete.shop` |
| `SITE_URL` | No (server fallback) | Server fallback for sitemap/robots when `NEXT_PUBLIC_` not set | `https://car-care.jesspete.shop` |

## Anti-Patterns to Avoid

- **Hardcoding prices/copy in JSX** — always via `content.ts` exports.
- **Trusting client validation** — the API re-validates; keep it that way.
- **Changing the honeypot to return an error** — fake-success is intentional (bots learn nothing).
- **Adding auth/CMS/payment layers speculatively** — the owner actions leads manually by design.
- **Host-timezone date math** — never `new Date(iso).getDay()` for business rules; use `src/lib/wcc/dates.ts` (UTC-parsed ISO strings + `Intl` business-tz "today").
- **Re-adding removed deps** — 44 unused template packages (next-auth, dnd-kit, recharts, framer-motion…) and 39 unused ui primitives were pruned for security and audit noise; re-add only with a concrete use case.
