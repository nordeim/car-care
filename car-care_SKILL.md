---
name: car-care
description: >
  Production-grade engineering reference for the We Care Car Care (car-care)
  codebase — a single-page Next.js 16 marketing + booking site for an auto
  detailing studio. Distilled from the full build + audit + remediation history
  so any coding agent can extend, debug, onboard onto, or replicate the site
  without re-learning its hard-won lessons: timezone-safe date rules, honeypot
  + sliding-window bot defense, dark-first two-tone design system, 4-step
  booking dialog, and the test pyramid that locks it all down: 49 Vitest
  unit tests (timezone-verified) plus a 29-test Playwright e2e suite that
  drives the standalone production build.
version: 1.3.0
last_updated: 2026-09-13
project_state: 49/49 unit tests green (UTC + America/New_York + Asia/Singapore) · 29/29 e2e green (standalone build) · lint clean · tsc --noEmit clean (src + e2e) · bun audit --prod clean · lighthouse a11y/bp/seo 1.0, perf 0.80 · live https://car-care.jesspete.shop (env-driven SEO) · standalone DB cwd-aware fix · verified 2026-09-13
tags:
  - nextjs16
  - react19
  - tailwind4
  - prisma
  - sqlite
  - zod
  - vitest
  - single-page-site
  - booking-flow
---

# car-care_SKILL.md — We Care Car Care Engineering Reference

> **How to use this document**
>
> - **Onboarding onto this repo?** Read §1 (identity), §2 (stack), §3 (bootstrap), then §5 (architecture). You can run the site locally within 5 minutes using §3 alone.
> - **Fixing a bug?** Go straight to §10 (Debugging Guide), then §9 (Anti-Patterns) — most failures here are recurrences of a documented pattern.
> - **Touching booking/date logic?** §15.2 (timezone-safe dates) is mandatory reading; the bug class it prevents is invisible in local testing and only fires on UTC hosts.
> - **About to push?** Run the §11 Pre-Ship Checklist gate. Every commit on `main` has passed it.
> - **Changing prices, copy, or services?** §7 tells you the 2-file procedure. Never edit components for content changes.
> - Every claim in this file is verifiable: versions against `bun.lock`, colors against `src/app/globals.css`, counts against `git ls-files` / `npm test`. The verification commands are in the Provenance block at the end.

---

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Client-Side State & Custom Utilities Deep Dive](#6-client-side-state--custom-utilities-deep-dive)
7. [Content Management](#7-content-management)
8. [Accessibility Implementation](#8-accessibility-implementation)
9. [Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [Debugging Guide](#10-debugging-guide)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Lessons Learnt & How to Avoid Them](#12-lessons-learnt--how-to-avoid-them)
13. [Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [Best Practices](#14-best-practices)
15. [Coding Patterns](#15-coding-patterns)
16. [Coding Anti-Patterns](#16-coding-anti-patterns)
17. [Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [Z-Index Layer Map](#18-z-index-layer-map)
19. [Color Reference (Complete)](#19-color-reference-complete)
20. [TypeScript Interface Reference](#20-typescript-interface-reference)
- [Appendix A: Architecture Decision Records](#appendix-a-architecture-decision-records)
- [Appendix B: Booking Flow State Machine & API Contract](#appendix-b-booking-flow-state-machine--api-contract)
- [Appendix C: Audit History](#appendix-c-audit-history)
- [Appendix D: Live-Site Validation Methodology](#appendix-d-live-site-validation-methodology)
- [Document Provenance & Drift Maintenance](#document-provenance--drift-maintenance)

---

## 1. Project Identity & Design Philosophy

**One sentence:** A single-page marketing + booking site for **We Care Car Care**, an eco-friendly auto detailing and ceramic coating studio in Framingham, MA (serving MetroWest Boston since 2010), rebuilt as a faithful-but-original clone of `https://wecarecarcare.com/` on Next.js 16 with Prisma/SQLite persistence.

**The design thesis:** *warm-charcoal automotive darkness*. The site is a dark showroom — near-black warm surfaces (`#0a0b0d`), warm off-white type (`#f2f0ea`), a single signal-amber accent for CTAs and key numbers (`#f2a61c`), and a secondary teal for keyword highlights (`#5eead4`). Oswald (condensed uppercase display) carries the automotive identity; Archivo carries the body. A film-grain texture sits over large dark surfaces. It should feel like a detail studio at night under warm lights — not a SaaS dashboard, not a template.

**Non-negotiable design rules:**

1. **Dark-first, always.** `<html className="dark" suppressHydrationWarning>` is hardcoded in `src/app/layout.tsx`. There is no light mode, no theme toggle, no `next-themes`. Any new surface starts from `--background` / `--card`, never from white.
2. **Two-tone accent discipline.** Amber (`text-primary`, `bg-primary`) is for CTAs, prices, key numbers, and the star ratings. Teal (`text-accent-teal`) is *only* for keyword highlights inside section headlines (e.g. "Choose Your Level of **Detail**"). Never teal buttons; never amber body text.
3. **CSS-only animation.** No Framer Motion, no animation libraries. Scroll reveals are `[data-reveal]` CSS transitions toggled by `IntersectionObserver` (`src/components/wcc/reveal.tsx`), the CTA shine is a `::before` sweep (`.shine` in `globals.css`), the before/after "dirty" half is a CSS filter stack. Every one of these is neutralized under `prefers-reduced-motion`.
4. **Original copy, factual business data.** Descriptive copy was written for this build — never copy text verbatim from the source site. Business facts (prices, service areas, hours, phone, address) mirror the real business's public information and live in `src/data/wcc/content.ts`.
5. **Dual pricing is always visible.** Every package card shows sedan AND SUV prices side by side. Nothing pricing-related is hidden behind a toggle (audit finding V2 — fixed by removing the toggle).
6. **Imagery is generated, not scraped.** All six photos are AI-generated brand-consistent WebP assets in `public/images/` (see §7). No assets were copied from the target site.

**CTA hierarchy** (order matters, applies site-wide):

1. **Book Your Detail** — primary amber `Button` with `.shine`, opens the booking dialog (`openBooking()`).
2. **Ask A Question** — outline `Button`, opens the question dialog (`openQuestion()`).
3. **Phone link** — quiet text link `Call or Text (508) 290-7476` (`BUSINESS.phoneHref` = `tel:+15082907476`), never a button.

**The anti-generic mandate:** no purple/blue gradients, no generic icon-card grids on white, no ALL-CAPS body text (display headings only), no default Tailwind palette colors (`bg-blue-500` et al. are forbidden — §19), no emoji in UI, no stock dashboard layouts. If a new section looks like it could be on a template gallery, it fails review.

**Deliberate divergences from the source site** (documented decisions, not defects — see `docs/audit-and-remediation-2026-09.md` §1.2):

- Booking is a **4-step dialog** (service → date/time → contact → confirm) instead of the source's long form page.
- Before/after uses **one photo + a "dirty-vision" CSS filter** for the "before" half instead of separate before photos (pixel-perfect alignment, single asset).
- Testimonials render as an **Embla carousel + aggregate Google rating** instead of a static 6-grid.
- The source's live chat bubble is covered by the question dialog + mobile call FAB instead (no third-party chat script).

---

## 2. Tech Stack & Environment

All versions are **locked versions from `bun.lock`** (verified 2026-09-13 via `bun pm ls`), not ranges.

| Layer | Technology | Locked Version | Critical Note |
|---|---|---|---|
| Web framework | `next` (App Router, standalone output) | 16.3.5 | Security floor — 16.1.x/16.2.0–16.2.4 carry GHSA-26hh-7cqf-hhc6 (middleware bypass), GHSA-8h8q-6873-q5fj (RSC DoS), GHSA-2xp9-vwfh-vxw4 (AVIF RCE). Never downgrade below 16.2.5. |
| UI runtime | `react` / `react-dom` | 19.3.0 | Required by Next 16. Strict mode ON (`reactStrictMode: true` in `next.config.ts`). |
| Language | `typescript` | 5.9.3 | `strict: true`, `noImplicitAny: true`; build fails on type errors (`ignoreBuildErrors: false`). |
| Styling | `tailwindcss` + `@tailwindcss/postcss` | 4.3.3 / 4.3.3 | CSS-first `@theme inline` in `globals.css`. **No `tailwind.config.ts`** — it was deleted with the Tailwind 3 leftovers. |
| Animation CSS | `tw-animate-css` | 1.4.0 | Imported once in `globals.css`; provides shadcn enter/exit utilities. |
| UI primitives | shadcn/ui (vendored in `src/components/ui/`) | 9 files | accordion, button, carousel, dialog, input, label, sheet, sonner, textarea — the only survivors of the v1.1.0 prune (ADR-008). |
| Radix runtime | `@radix-ui/react-accordion` | 1.2.20 | FAQ accordion. |
| Radix runtime | `@radix-ui/react-dialog` | 1.1.23 | Booking + question dialogs (shadcn `dialog.tsx`, `sheet.tsx` both build on it). |
| Radix runtime | `@radix-ui/react-label` / `react-slot` | 2.1.15 / 1.3.3 | Form labels; `Slot` for `asChild`. |
| Carousel | `embla-carousel-react` | 8.6.0 | Testimonials only; arrows hidden below `xl` (§17). |
| Toasts | `sonner` | 2.0.8 | `<Toaster />` mounted in `layout.tsx`; hardcoded dark. The ONLY toast system — the old radix toast was removed (§9, bug C11). |
| State | `zustand` | 5.0.15 | One 36-line store for dialog orchestration (ADR-004). |
| Validation | `zod` | 4.6.4 | Shared schemas in `src/lib/wcc/schemas.ts` — server-authoritative, client-reusable. |
| ORM | `prisma` + `@prisma/client` | 6.19.3 / 6.19.3 | `db:push` workflow (no migration files, ADR-002). |
| Database | SQLite | — | Single file `db/custom.db` (**gitignored — customer PII**). |
| Tests | `vitest` + `@playwright/test` | 5.0.0 / 1.63.0 | Vitest: node env, `@/` alias, 49 unit tests / 5 files. Playwright: chromium, serial, 29 e2e tests / 7 spec files against the standalone build on :3100 (ADR-010). |
| Icons | `lucide-react` | 0.525.0 | Icon usage is `aria-hidden` + adjacent text labels. |
| Image optimization | `sharp` | 0.35.4 | Used by `scripts/optimize-images.mjs` (WebP pipeline). |
| Utility | `class-variance-authority` / `clsx` / `tailwind-merge` | 0.7.1 / 2.1.1 / 3.7.0 | `cn()` in `src/lib/utils.ts`. |
| Lint | `eslint` + `eslint-config-next` | 9.39.5 / 16.3.5 | Flat config; many template rules off (§3). |
| AI SDK | `z-ai-web-dev-sdk` | 0.0.18 | Used only by tracked `scripts/` (image gen, VLM checks) — not by the app runtime. |
| Package manager / runtime | bun | 1.3+ | `bun.lock` is the source of truth; Node 24 + npm also work for `npm test`. |

**Deployment shape:** `output: "standalone"` — `bun run build` also copies `.next/static` and `public` into `.next/standalone/`; `bun run start` serves it on :3000 behind Caddy (`:81` in the sandbox, `443` live per `https://car-care.jesspete.shop`, per `Caddyfile`). Single bun process; the only in-process state is the rate-limiter `Map` (deliberately ephemeral, ADR-005). **Live SEO** is env-driven: `NEXT_PUBLIC_SITE_URL`/`SITE_URL` (fallback live) feeds `metadataBase`/`OG`/`sitemap.ts`/`robots.ts` — build verified `og:image` is `https://car-care.jesspete.shop/...`.

**What is intentionally NOT here:** no auth (public booking site), no CMS (content is a typed TS module, ADR-003), no analytics, no third-party scripts, no i18n, no CI yet (manual §11 gate; a minimal GitHub Actions lint+tsc+test+e2e is the natural first addition), no visual-regression snapshots (deliberate — maintenance-heavy while the design evolves).

---

## 3. Bootstrapping & Configuration

### 3.1 From clone to running dev server

```bash
git clone git@github.com:nordeim/car-care.git
cd car-care
bun install                      # or: npm install (bun.lock is canonical)

# Env — DATABASE_URL (portable file:../db/custom.db, runtime cwd-aware) + site URL
cp .env.example .env   # → DATABASE_URL="file:../db/custom.db" + NEXT_PUBLIC_SITE_URL/SITE_URL="https://car-care.jesspete.shop"
bun run db:generate              # regenerate Prisma client (needed after clone/schema edits)
bun run db:push                  # create/push schema to db/custom.db (--accept-data-loss is in the script)

bun run dev                      # http://localhost:3000 (metadataBase still live URL)
```

> ⚠️ **The `DATABASE_URL` path trap + standalone `chdir` trap:** the URL is resolved **relative to `prisma/`** for the CLI, not the repo root. `file:../db/custom.db` → `<repo>/db/custom.db`. Using `file:./custom.db` silently creates `prisma/custom.db`. Additionally, the standalone server (`.next/standalone/server.js`) does `process.chdir(__dirname)` so cwd becomes `.next/standalone` at runtime — a naive relative `file:../db/custom.db` from repo root would then resolve to `standalone/db/custom.db`. `src/lib/db.ts` now normalizes any `file:*db/custom.db` to an absolute repo-root path (cwd-aware: detects `.next/standalone` and walks up; `e2e/helpers/db.ts` mirrors). Keep `.env` as `file:../db/custom.db` — both CLI and runtime now share `db/custom.db`.

### 3.2 Verification of a working setup

1. `http://localhost:3000` renders the hero + pricing (page 200).
2. Any **Book Now** CTA → walk all 4 dialog steps → submit → `WCC-XXXXXX` confirmation toast appears.
3. `bunx prisma studio` → the row exists in the `Booking` table. (Delete test rows when done — PII hygiene.)
4. `npm test` → 49/49 pass. `bun run lint` → clean.
5. `bun run build` once, then `bun run e2e` → 29/29 pass on the standalone build (funnel + DB truth, API contracts, SEO, axe a11y).

### 3.3 Configuration files

| File | Role | Notes |
|---|---|---|
| `next.config.ts` | Next config | `output: "standalone"`, `typescript.ignoreBuildErrors: false` (build enforces types — keep it that way), `reactStrictMode: true`. |
| `tsconfig.json` | TypeScript | `strict` + `noImplicitAny: true`; `include` scoped to `src/**` + `e2e/**` + `playwright.config.ts` + `vitest.config.ts` + `next-env.d.ts` + `.next/types/**` — **must not** revert to `**/*.ts` (untracked reference dirs like `foundation/` caused 135 phantom errors, §9). `exclude`: `node_modules`, `foundation`, `examples`, `skills`, `docs`, `db`. |
| `eslint.config.mjs` | Lint | Flat config: `next/core-web-vitals` + `next/typescript` + a large off-rules block (sandbox template defaults). Ignores: `node_modules`, `.next`, `out`, `build`, `next-env.d.ts`, `examples`, `skills`, `foundation`, `scripts`. |
| `vitest.config.ts` | Tests | `environment: "node"` (no jsdom — lib-level tests only), `include: src/**/*.test.ts(x)`, excludes `foundation/examples/skills/.next`, `@/` alias → `./src`. |
| `postcss.config.mjs` | CSS pipeline | `@tailwindcss/postcss` only. |
| `prisma/schema.prisma` | Data model | SQLite datasource via `env("DATABASE_URL")`; `Booking` + `Question` models (§20). |
| `.env` | Environment | **Three** variables: `DATABASE_URL` (SQLite, gitignored), `NEXT_PUBLIC_SITE_URL` + `SITE_URL` (canonical SEO URL, live `https://car-care.jesspete.shop`; fallback live). See also `src/app/layout.tsx` (`metadataBase`), `sitemap.ts`, `robots.ts`. Gitignored; commit `.env.example` instead (`.gitignore` carries `!.env.example`). |
| `src/app/robots.ts` + `public/robots.txt` | SEO robots | Dynamic `robots.ts` (env-driven `sitemap: ${siteUrl}/sitemap.xml`) is the source of truth; `public/robots.txt` is the static fallback (aligned to live URL). |
| `components.json` | shadcn config | Registry paths for adding new primitives via CLI. |

### 3.4 Scripts (`package.json`)

| Script | What it does |
|---|---|
| `dev` | `next dev -p 3000` with output tee'd to `dev.log` |
| `build` | `next build` **+ copies `.next/static` and `public` into `.next/standalone/`** — the copy step is part of the script because `start` needs it; running bare `next build` produces a standalone dir missing assets |
| `start` | `NODE_ENV=production bun .next/standalone/server.js`, logs to `server.log` |
| `lint` | `eslint .` |
| `test` / `test:watch` | `vitest run` / watch mode |
| `e2e` / `e2e:all` / `e2e:report` | Playwright: chromium project / all projects / open the HTML report. Needs `bun run build` first; the suite manages its own standalone server on :3100 (`E2E_PORT`, `E2E_BASE_URL` knobs) |
| `db:push` / `db:generate` / `db:migrate` / `db:reset` | Prisma lifecycle (`db:push` includes `--accept-data-loss`) |

### 3.5 Sandbox-only artifacts (never import, never commit)

`foundation/` (reference repo clone), `upload/`, `tool-results/`, `download/`, `skills/`, `db/*.db`, `worklog.md`, `*.pid`, `.env` — all gitignored. `examples/websocket/` and `tests/*.sh` are template scaffolding unrelated to the site. The SSH push wrapper for this sandbox lives at `docs/ssh_git_wrapper_v3.py` (§11.4).


---

## 4. The Design System (Code-First)

Everything lives in `src/app/globals.css` (180 lines). There is **no `tailwind.config.ts`** — Tailwind 4 CSS-first mode maps CSS variables to utilities via one `@theme inline` block.

### 4.1 Token table (`:root`)

| Token | Value | Usage |
|---|---|---|
| `--background` | `#0a0b0d` | Page background (warm near-black) |
| `--foreground` | `#f2f0ea` | Body text (warm off-white) — 17.3:1 on background |
| `--card` / `--card-foreground` | `#121417` / `#f2f0ea` | Card surfaces (package cards, FAQ cards, testimonial figures, dialog) |
| `--popover` / `--popover-foreground` | `#14161a` / `#f2f0ea` | Popover/dialog surfaces |
| `--primary` | `#f2a61c` | **Signal amber** — CTAs, prices, key numbers, star ratings — 9.6:1 on background |
| `--primary-foreground` | `#17120a` | Text on amber buttons — 9.1:1 |
| `--accent-teal` | `#5eead4` | **Keyword highlights only** (`text-accent-teal`) — 13.3:1 on background |
| `--secondary` / `--secondary-foreground` | `#1a1d21` / `#e8e6df` | Alternating section bands (`bg-secondary/40`), footer surface |
| `--muted` / `--muted-foreground` | `#17191d` / `#9c9a92` | Secondary text — 7.0:1 on background (AA) |
| `--accent` / `--accent-foreground` | `#1f2126` / `#f2f0ea` | Hover fill for outline buttons/nav items |
| `--destructive` | `#e5484d` | Errors |
| `--border` | `rgba(255,255,255,0.09)` | Hairline borders on dark surfaces |
| `--input` | `rgba(255,255,255,0.13)` | Form input borders |
| `--ring` | `#f2a61c` | Focus ring (amber) |
| `--radius` | `0.5rem` | Base radius; scale = `sm −4px`, `md −2px`, `lg base`, `xl +4px` |
| `--chart-1…5` | `#f2a61c`, `#d9892b`, `#8a8f97`, `#5c6169`, `#383d45` | Amber→charcoal chart ramp (currently unused by any chart — reserved) |
| `--sidebar-*` (8 tokens) | mirror of base tokens | shadcn sidebar convention; no sidebar exists — kept so future shadcn additions don't reference undefined vars |

### 4.2 Typography hierarchy

| Role | Font | Weight | Treatment |
|---|---|---|---|
| Display (h1–h3, eyebrows, nav, buttons) | **Oswald** (`--font-oswald`, via `.font-display`) | 400/500/600/700 | UPPERCASE, `tracking-tight` on big heads, `tracking-[0.12em–0.34em]` on small labels |
| Body | **Archivo** (`--font-archivo`, `font-sans` default) | 400/500/600/700 | `leading-relaxed` paragraphs; body is NEVER uppercase |

Both loaded via `next/font/google` in `src/app/layout.tsx` with CSS variables. Body enables `font-feature-settings: "ss01" on` (Archivo stylistic set). Type scale in practice: hero h1 `text-[2.6rem] sm:text-6xl lg:text-7xl`, section h2 `text-3xl sm:text-5xl`, card h3 `text-2xl`, eyebrow `text-xs uppercase tracking-[0.28em] text-primary`.

### 4.3 Motion & effects inventory (all CSS-only)

| Name | Selector | What it does |
|---|---|---|
| Scroll reveal | `[data-reveal]` | `transition: opacity .5s ease-out, transform .5s ease-out` — JS (`reveal.tsx`) only toggles classes; default state set by the wrapper (§15.5) |
| CTA shine | `.shine::before` | Skewed white gradient bar sweeps `left: -80% → 130%` on hover (0.6s) |
| Film grain | `.grain::after` | SVG `feTurbulence` data-URI overlay at 5% opacity over large dark surfaces (hero) |
| Custom scrollbars | `*::-webkit-scrollbar` | 10px, `#2a2d33` thumb on `#0a0b0d`, 8px radius |
| Amber selection | `::selection` | `rgba(242,166,28,0.85)` bg, `#17120a` text |

**All three animation systems are neutralized under `@media (prefers-reduced-motion: reduce)`**: `scroll-behavior: auto`, `[data-reveal] { transition: none !important; opacity: 1 !important; transform: none !important }`, `.shine::before { display: none }`. Any new animation MUST add an equivalent reduced-motion rule — this is enforced by review, not lint.

### 4.4 Global base rules

`html { scroll-behavior: smooth; scroll-padding-top: 5.5rem }` (anchor nav clears the 4.5rem sticky header). `body { @apply bg-background text-foreground antialiased }`. `* { @apply border-border outline-ring/50 }` — the shadcn default-border trick.

---

## 5. Component Architecture & Patterns

### 5.1 The three-layer model

```
src/app/            ← route shell: layout.tsx (fonts, metadata, JSON-LD, Toaster),
page.tsx (composition)  + api/{bookings,questions}/route.ts (server)
src/components/wcc/ ← 16 site components (ALL "use client") — feature layer
src/components/ui/  ← 9 vendored shadcn primitives (6 of them "use client")
src/data/wcc/       ← content.ts — typed content, the single source of truth (ADR-003)
src/lib/wcc/        ← pure logic: booking.ts, dates.ts, schemas.ts, rate-limit.ts,
                       booking-store.ts (zustand) + __tests__/ (49 vitest tests)
```

**Boundary rules:** components never fetch or touch Prisma; API routes never render; pure logic (`lib/wcc`) imports nothing from React (except the store, which imports zustand); content flows *down* (data → component), never up. Both server (routes) and client (dialog) import the same `schemas.ts` and `booking.ts` — one source of truth for prices and validation.

### 5.2 Page composition (`src/app/page.tsx`, 37 lines)

```
SiteHeader (sticky z-50)
main:
  Hero            (#top)          — full-bleed hero-car.webp, teal eyebrow, rating badge,
                                    3 CTAs, 3-stat band (16+ yrs · 7,500+ vehicles · 5.0)
  Difference      (#difference)   — "Why We're Different", 3 pillars, 2× BeforeAfter sliders
  Packages        (#pricing)      — 2 package cards (image band, dual pricing, features, CTAs)
  CeramicUpsell   (#ceramic)      — "Smart Add-On" $200 add-on pitch card
  CeramicTiers    (—)             — 3 ceramic tier cards (1yr/3yr/5yr, dual pricing)
  InteriorOnly    (—)             — interior-only detail card
  Testimonials    (#reviews)      — Embla carousel, 6 reviews, Google 5.0 header
  Faq             (#faq)          — 9-item accordion in cards
  FinalCta        (—)            — full-bleed detail-action.webp backdrop, rating pill, 2 CTAs
SiteFooter                       — brand, contact, areas, hours
CallFab (fixed z-40, lg:hidden)  — mobile call FAB after scrollY > 400
BookingDialog + QuestionDialog   — global overlays, zustand-controlled
```

Anchor IDs are the nav contract: `#top #difference #pricing #ceramic #reviews #faq` — keep them stable; the header, footer, and mobile nav all link to them.

### 5.3 Component inventory (16 wcc components, all `"use client"`)

| Component | Lines | Purpose / pattern notes |
|---|---|---|
| `site-header.tsx` | 154 | Fixed `z-50`; transparent → `bg-background/90 backdrop-blur` after `scrollY > 24`; exports `Logo` (amber W tile + wordmark) reused by footer. Desktop nav `hidden lg:flex`; mobile Sheet nav (85vw). |
| `hero.tsx` | 118 | `min-h-[100svh]` section, `grain` overlay, dual gradients (bottom + left), `fetchPriority="high"` img. |
| `difference.tsx` | 113 | 3 pillar bullets + 2 `BeforeAfter` sliders; third image `loading="lazy"`. |
| `packages.tsx` | 152 | `PACKAGES` cards: 16:6 image band (`CARD_IMAGES` map by key), **dual price rows** (Sedan/Coupe + SUV/Truck/Van), features grid, Book Now + Smart Add-On (preselects ceramic via `openBooking(key, {addOnCeramic: true})`), "Most Popular" ribbon. |
| `ceramic-upsell.tsx` | 106 | Single pitch card for the $200 add-on (normally $299). |
| `ceramic-tiers.tsx` | 135 | 3 tier cards; popular tier gets `ceramic-beads.webp` band + ribbon. |
| `interior-only.tsx` | 86 | Interior-only service card. |
| `testimonials.tsx` | 90 | Embla carousel `align:"start", loop:true`; `md:basis-1/2 xl:basis-1/3`; arrows `max-xl:hidden` in the outer gutter (audit fix D1 — never cover card text). |
| `faq.tsx` | 49 | Radix accordion `type="single" collapsible`; each item a rounded `bg-card` (audit fix V5). |
| `final-cta.tsx` | 83 | Photo backdrop (`bg-background/88` + gradient), rating pill, 2 buttons, phone text link. |
| `site-footer.tsx` | 114 | 3-column grid; imports `Logo` from site-header. |
| `reveal.tsx` | 60 | `IntersectionObserver` reveal wrapper — §15.5. |
| `before-after.tsx` | 166 | Drag-compare slider — §15.6 (pointer capture, ARIA slider, dirty-vision filter). |
| `booking-dialog.tsx` | 645 | **The biggest file in the repo.** 4-step wizard — §Appendix B. |
| `question-dialog.tsx` | 169 | 1-step inquiry form → `POST /api/questions` → sonner toast. |
| `call-fab.tsx` | 36 | Mobile-only (`lg:hidden`) fixed `z-40` phone button; appears at `scrollY > 400`; `motion-reduce:transition-none`. |

### 5.4 shadcn primitives in use (9 — the keep-list)

`accordion`, `button` (CVA variants), `carousel` (Embla wrapper), `dialog`, `input`, `label`, `sheet`, `sonner` (Toaster, dark hardcoded), `textarea`. `button/input/textarea` have no `"use client"` (server-compatible); the other six do.

> Adding another primitive: use the shadcn CLI **and its dependency** (`bunx shadcn@latest add <name>`), then verify it imports only existing Radix packages or add the new one to `package.json`. Do NOT resurrect deleted files from git history — 39 unused primitives and their deps were pruned in v1.1.0 precisely because they dragged vulnerable transitive chains (ADR-008).

### 5.5 Client vs Server decision

The RSC surface is deliberately thin: `layout.tsx`, `page.tsx`, `sitemap.ts`, and the two API routes are server; **every visual component is a client island** (they all need dialogs, reveals, or scroll state through the shared zustand store). That is a conscious trade — the page is a single interactive marketing surface, and splitting islands per-section would break the shared dialog store's simplicity. SEO is unaffected (content renders in the initial HTML regardless). If a future section is fully static, make it a server component; nothing forbids mixing inside `page.tsx`.

---

## 6. Client-Side State & Custom Utilities Deep Dive

**There are no custom hooks in this codebase.** Interactive behavior is concentrated in three utilities, each with a specific reason it is NOT a hook:

### 6.1 `useWccDialogs` — zustand store (`src/lib/wcc/booking-store.ts`, 36 lines)

```ts
interface OpenBookingOptions { addOnCeramic?: boolean }
interface WccDialogState {
  bookingOpen: boolean; presetService: string | null; presetAddOnCeramic: boolean | null;
  questionOpen: boolean;
  openBooking: (serviceKey?: string, options?: OpenBookingOptions) => void;
  closeBooking: () => void; openQuestion: () => void; closeQuestion: () => void;
}
export const useWccDialogs = create<WccDialogState>((set) => ({ ... }));
```

- **Why zustand over Context:** 9+ components across the tree (header, hero, every card section, both dialogs, FAB sibling) need to open dialogs; a store avoids provider plumbing and re-render cascades (ADR-004). Subscribe with **selectors** — `useWccDialogs((s) => s.openBooking)` — never without, or every store change re-renders you.
- `openBooking(serviceKey?, { addOnCeramic? })` powers both the card CTAs (preselect the clicked service) and the "Smart Add-On" button (preselect + ceramic add-on checked). The dialog **consumes presets once on open** and clears them on close.

### 6.2 `Reveal` — the scroll-reveal wrapper (`src/components/wcc/reveal.tsx`, 60 lines)

`IntersectionObserver` (rootMargin `0px 0px -10% 0px`) flips one `visible` boolean; CSS classes animate. Key details: observer `disconnect()`s after first intersection (one-shot, no re-hide); full cleanup on unmount; `variant="card"` adds `scale-[0.98]` start; `delay` (ms) staggers card grids via inline `transitionDelay`. Reduced-motion is handled **in CSS** (§4.3), not JS — the classes still toggle, transitions just don't run.

### 6.3 `BeforeAfter` — pointer-capture slider (`src/components/wcc/before-after.tsx`, 166 lines)

Full pattern in §15.6. Essentials: `setPointerCapture` on the divider for drag continuity; `pos` clamped 4–96; arrow keys ±5 with `aria-valuenow`; window-level `pointerup` listener only while `dragging` (added/removed in a `useEffect` keyed on `dragging`); `touch-none select-none` on the container.

---

## 7. Content Management

**All site content is code** in `src/data/wcc/content.ts` (365 lines, ADR-003). No CMS, no `import.meta.glob`, no MDX.

### 7.1 Export inventory

| Export | Shape | Count / values |
|---|---|---|
| `PACKAGES` | `ServicePackage[]` | 2 — `essential-full` ($240/$295), `premium-full` ($360/$395, `popular`) |
| `CERAMIC_TIERS` | `CeramicTier[]` | 3 — `ceramic-1yr` ($560/$595), `ceramic-3yr` ($795/$995, `popular`), `ceramic-5yr` ($995/$1295) |
| `INTERIOR_ONLY` | `ServicePackage` (satisfies) | `interior-only` $195/$240 |
| `CERAMIC_ADDON` | `{price: 200, regularPrice: 299, note}` | flat add-on price used by `quoteFor` |
| `SERVICE_MODES` | const array | 3 — `mobile`, `shop`, `pickup` (address rule keyed on `!== "shop"`) |
| `CERAMIC_BENEFITS` | `{title, body}[]` | 4 — used by `ceramic-upsell.tsx` |
| `TESTIMONIALS` | `Testimonial[]` | 6 — review copy written for this build (spirit of the shop's public Google reviews) |
| `FAQS` | `Faq[]` | 9 — sentence case (audit fix V5 — never ALL-CAPS triggers) |
| `SERVICE_AREAS` | `string[]` | 14 towns (Framingham…Holliston) — drives footer + JSON-LD `areaServed` |
| `BUSINESS` | const object | name, phone `(508) 290-7476`, `phoneHref tel:+15082907476`, email, address, hours "Mon–Sat · 8:00 AM – 6:00 PM", since 2010, stats {16+, 7,500+, 5.0, 37} |
| `TIME_SLOTS` | readonly `string[]` | 6 — `"08:00 AM"…"03:30 PM"` — the ONLY legal `time` values (schema-refined) |
| `BOOKABLE_SERVICES` | `BookableService[]` | 6 — **derived** from the three sources above; each row gets `group`, `allowCeramicAddOn`, one-line `summary` (top-3 features joined), `popular` |

### 7.2 Procedures

**Change a price / copy / feature list:** edit `content.ts` only. Cards, dialog, quote, and API all derive from it. Tests in `booking.test.ts` lock the pricing shape (`booking dialog services all have both vehicle prices`) — run `npm test`.

**Add a new service:** (1) add the object to `PACKAGES` / `CERAMIC_TIERS` / `INTERIOR_ONLY` in `content.ts` — `BOOKABLE_SERVICES` picks it up automatically; (2) if it should have a card image band, add a `CARD_IMAGES[key]` entry in `packages.tsx` (or `ceramic-tiers.tsx`); (3) `npm test` (the pricing regression test now covers it); (4) if it needs a new `group`, extend the `group` union in `BookableService`.

**Add a testimonial/FAQ/area:** append to the array in `content.ts`. Nothing else — `key={name+date}` for testimonials (keep combinations unique), FAQ keys are the question text.

### 7.3 Imagery (`public/images/`, all AI-generated, WebP)

`hero-car.webp` (1344×768, OG image too), `exterior-clean.webp` (essential card), `detail-action.webp` (premium card + final CTA backdrop), `interior-clean.webp`, `interior-detail.webp`, `ceramic-beads.webp` (popular tier band). Regenerate via `scripts/gen-images.sh` + `scripts/optimize-images.mjs` (sharp → WebP). The OG card references `/images/hero-car.webp` with **env-driven** `metadataBase` (`NEXT_PUBLIC_SITE_URL`/`SITE_URL`, fallback `https://car-care.jesspete.shop`; original ref `https://wecarecarcare.com`).

---

## 8. Accessibility Implementation

No automated a11y CI — this is a review-enforced section. The floor is WCAG AA (all body text passes AAA except muted text at AA).

### 8.1 Color contrast (computed via WCAG 2.x relative luminance)

| Pair | Ratio | Level |
|---|---|---|
| `--foreground #f2f0ea` on `--background #0a0b0d` | 17.3:1 | AAA |
| `--foreground` on `--card #121417` | 16.2:1 | AAA |
| `--primary #f2a61c` on background | 9.6:1 | AAA |
| `--primary` on card | 9.0:1 | AAA |
| `--primary-foreground #17120a` on `--primary` | 9.1:1 | AAA |
| `--accent-teal #5eead4` on background | 13.3:1 | AAA |
| `--accent-teal` on card | 12.5:1 | AAA |
| `--muted-foreground #9c9a92` on background | 7.0:1 | AA |
| `--secondary-foreground #e8e6df` on `--secondary #1a1d21` | 13.5:1 | AAA |

Muted text is also used over photo backdrops only where a dark gradient guarantees the backdrop (hero/final CTA use `bg-black/40–88` + `backdrop-blur` behind text).

### 8.2 Patterns by component

| Pattern | Where | Implementation |
|---|---|---|
| Drag slider ARIA | `before-after.tsx` | `role="slider"`, `aria-label` with instructions, `aria-valuemin/max/now`, `tabIndex=0`, arrow-key support, `sr-only` hint text |
| Carousel a11y | `testimonials.tsx` | `aria-label` on the carousel, per-figure star rating `aria-label="Rated 5 out of 5 stars"`, arrows have `aria-label` |
| Accordion | `faq.tsx` | Radix handles `aria-expanded`/`aria-controls` |
| Dialogs | `booking/question-dialog.tsx` | Radix Dialog focus trap; `DialogTitle/Description` present (the dialog header block) |
| Rating pills | hero/final-cta | visible stars `aria-hidden` + `aria-label` with the numbers on the pill |
| Icons | everywhere | `aria-hidden="true"` on decorative lucide icons; text always adjacent |
| Nav landmarks | header/footer | `aria-label="Main"` / `"Mobile"` / `"Site footer"` |
| Section headings | all sections | `aria-labelledby` → the `h2` id |
| Forms | dialogs | `<Label htmlFor>` per input; errors announced via `role="alert"` |

### 8.3 Motion & keyboard

`prefers-reduced-motion` neutralizes all animation (§4.3). Focus ring: `outline-ring/50` global + amber `--ring`; visible focus on the slider (`focus-visible:ring-2`). Touch targets: dialog inputs/buttons ≥ 2.5rem, header CTA `h-10`, card CTAs `h-12`, mobile nav rows `py-3.5`. Full keyboard flow verified during the audit (accordion open/close, slider arrows, carousel, dialog tab trap).


---

## 9. Anti-Patterns & Common Bugs

Every entry below actually happened in this repo's history and either has a test or a config guarding its recurrence. IDs reference `docs/audit-and-remediation-2026-09.md`.

### Bug: Host-timezone date math (C3) — CRITICAL CLASS

**Symptom:** Sunday-closure and 60-day-window rules drift by hours when the server runs UTC but the business is in `America/New_York` — a 00:30 EST booking for "Sunday" may be evaluated as Saturday.
**Root cause:** `new Date("YYYY-MM-DD").getDay()` uses *host-local* parsing; the day-of-week is not stable across hosts.
**Fix:** `src/lib/wcc/dates.ts` — `isSunday()` parses `${iso}T00:00:00Z` and reads `getUTCDay()`; `todayIsoInTz()` derives "today" from `Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TZ })` (en-CA emits `YYYY-MM-DD`). Window math compares UTC-day ordinals.
**Guard:** `dates.test.ts` (9 tests) asserting identical results under `TZ=UTC` and `TZ=America/New_York`, including the early-UTC-instant case.

### Bug: Toast that never rendered (C11)

**Symptom:** Booking succeeds, no toast appears.
**Root cause:** `booking-dialog.tsx` called sonner's `toast.success()`, but `layout.tsx` mounted the **radix** `<Toaster />`; sonner's `<Toaster />` was never mounted, so its queue had no renderer.
**Fix:** mount sonner `<Toaster />` in `layout.tsx`; delete the radix toast files + `@radix-ui/react-toast` + `hooks/use-toast.ts`.
**Lesson:** a toast library is two halves — the `toast.*()` call site and its `<Toaster />` mount; CI typechecks pass when either half is missing, so verify toasts **visually/E2E** (Appendix D).
**Guard:** E2E booking flow now asserts the toast appears.

### Bug: Phantom typecheck errors from untracked dirs (C1)

**Symptom:** `tsc --noEmit` fails with 135 errors in files the site never imports.
**Root cause:** template `tsconfig include: ["**/*.ts"]` picked up the untracked `foundation/`, `examples/`, `skills/` reference dirs; `ignoreBuildErrors: true` then masked it in builds.
**Fix:** `include` scoped to `src/**` + config files; `exclude` for reference dirs; `ignoreBuildErrors: false`.
**Lesson:** `include` must be an allow-list. If `tsc` and `next build` disagree, the config is lying.

### Bug: Customer PII tracked in git (C2)

**Symptom:** `db/custom.db` (real bookings: names, phones, addresses) committed to the repo.
**Fix:** `git rm --cached db/custom.db` + `/db/*.db` in `.gitignore`. Never commit runtime DBs.

### Bug: Prisma query logs in production (C4)

**Symptom:** every insert logs full row data (PII) to stdout in prod.
**Fix:** `src/lib/db.ts` — `log: ['query']` only when `NODE_ENV !== 'production'`.
**Pattern:** the `globalThis` singleton (guarded dev-only assignment) is the standard Prisma-in-Next pattern to avoid connection storms in dev.

### Bug: Rate-limiter memory growth (C6)

**Symptom:** the per-IP `Map` grows forever with one-off visitor IPs.
**Fix:** `SlidingWindowRateLimiter.prune()` on every `check()`; keys with empty windows are deleted. One shared module used by both routes (was duplicated inline code).

### Bug: Carousel arrows over card text (D1)

**Symptom:** the left carousel arrow covered the word "dealer's" in a review card; caused a click-interception error during E2E.
**Root cause:** shadcn's default `CarouselPrevious/Next` position inside the viewport edge (`left-1/right-1`).
**Fix:** arrows moved to the outer gutter at `xl:` with `max-xl:hidden` — below `xl` the carousel is swipe/drag/keyboard driven. **Rule: interactive chrome never overlaps content boxes.**

### Bug: Honeypot leaking validation errors

**Symptom:** bots hitting the honeypot field got a `422` — telling them exactly which field to clear.
**Fix:** the `company` field is schema-optional; the route returns a **fake `201 {ok:true, confirmation:"WCC-000000"}`** and writes nothing. Bots learn nothing; real users never see the hidden field.

### Bug: Missing app icon → 404 on every visit (C7)

**Fix:** `src/app/icon.svg` (amber W mark, text-free so it scales). Plus `sitemap.ts` for completeness.

### Bug: Stray syntax character in JSX (build-phase)

**Symptom:** a lone `";` rendered inside the booking dialog.
**Lesson:** after JSX edits, visually inspect the changed region (Appendix D) — typecheck catches structure, not stray text nodes.

### Bug: Unused dependencies with critical advisories (S1–S3)

**Symptom:** `bun audit` reported 90 vulnerabilities (3 critical) in a site with ~20 real imports.
**Root cause:** template scaffolding shipped `next-auth` (zero imports, CRITICAL homoglyph advisory), `next@16.1.3` (in-advisory-range), and ~40 other unused packages dragging vulnerable transitive chains.
**Fix:** upgrade `next` to 16.3.5; remove 44 unused deps + 39 unused ui files (ADR-008); then in the 2026-09-13 follow-up move `prisma` CLI to devDependencies and pin `defu@6.1.7` / `deepmerge-ts@8.0.2` / `baseline-browser-mapping@2.11.23` via `overrides`. Result: `bun audit --prod` reports zero findings; the full-audit remainder is dev-tool chains (eslint/vitest/tailwind) that never enter the standalone runtime.
**Guard:** before adding ANY dependency, `rg` for real usage; before upgrading, read the advisory range.

---

## 10. Debugging Guide

| Symptom | Cause | Fix |
|---|---|---|
| `bun run start` serves missing styles/images | standalone dir lacks static assets | Run `bun run build` (the script copies `.next/static` + `public` into `.next/standalone/`), not bare `next build` |
| `@prisma/client did not initialize yet` | client not generated after clone/schema edit | `bun run db:generate` |
| Prisma writes to `standalone/db/custom.db` | Standalone `server.js` does `process.chdir(__dirname)` so cwd becomes `.next/standalone` | Fixed in `src/lib/db.ts` (cwd-aware absolute resolver for any `file:*db/custom.db`; keep `.env` as `file:../db/custom.db`) — see §3.1 trap |
| Prisma writes to `prisma/custom.db` | `DATABASE_URL` resolves **relative to `prisma/`** for CLI | Use `file:../db/custom.db` (§3.1 trap) |
| `429` while testing the booking API | in-memory limiter: 5 req / 10 min per IP | Restart the dev server to reset (the `Map` is per-process) |
| Sunday date rejected | intentional — shop closed Sundays (UI **and** API both enforce) | Not a bug |
| `tsc --noEmit` errors in files you never touched | `include` reverted to `**/*.ts` | Restore the §3.3 scoped include list |
| Tests pass locally but fail in CI/another machine | date logic leaked host timezone | The suite is TZ-verified — run `TZ=UTC npm test` and `TZ=Asia/Singapore npm test` before shipping date changes |
| Toast missing after a successful submit | `<Toaster />` not mounted / wrong toast lib | sonner `Toaster` lives in `layout.tsx` — verify it survived edits (§9 C11) |
| Dialog opens without the service preselected | preset consumed twice (e.g. consumed on every render) | Consume presets in an `open`-change `useEffect`, clear on close (see `booking-dialog.tsx`) |
| Dev server port conflicts | script pins `-p 3000` | Free the port or edit the script; `dev.log` shows the bound port |
| `bun audit` shows criticals again | a transitive dep re-entered via a new package | Check `bun pm ls <pkg>`; prefer adding nothing; if needed pin the fixed version |
| Hydration warning on `<html>` | expected — `suppressHydrationWarning` is set for the hardcoded `dark` class | Ignore only this specific warning |

**Log locations:** dev server tee's to `dev.log`, prod to `server.log` (both gitignored runtime artifacts). API routes log failures with `[api/bookings]` / `[api/questions]` prefixes on `console.error`.

---

## 11. Pre-Ship Checklist

The gate every commit on `main` has passed. Run in order; any failure blocks the ship.

### 11.1 Quality gates (commands)

```bash
npm test                      # 49/49 — also run under TZ=UTC and TZ=Asia/Singapore when dates changed
bun run lint                  # eslint . — clean
bunx tsc --noEmit             # 0 errors (checks more than the build does; covers src/ AND e2e/)
bun run build                 # standalone build + asset copy; type errors fail it
bun run e2e                   # 29/29 on the standalone build (funnel + DB truth, API contracts, SEO, axe a11y)
```

### 11.2 Runtime smoke (agent-browser or manual)

1. `/` returns 200; hero + all 9 sections render; console error-free.
2. Mobile 375px: hamburger Sheet opens; call FAB appears after scrolling past hero, hidden at top.
3. Full booking E2E: Book Now → 4 steps → submit → toast appears + `WCC-XXXXXX`; row in Prisma Studio; **delete the test row afterward**.
4. API negative paths: invalid payload → `422` with issue list; honeypot `company` filled → fake `201`, **zero rows written**; 6th rapid request → `429`.
5. Animations: reveals fire on scroll; slider drags; accordion opens; carousel advances; shine sweeps on CTA hover.

### 11.3 Security & hygiene

- [ ] `git status` clean; **no `.env`, no `db/*.db`, no `worklog.md`, no PII** in the commit (`git ls-files | grep -E '\.db$'` must be empty)
- [ ] `bun audit --prod` → no findings; full `bun audit` → 0 critical (dev-tool chains acceptable)
- [ ] No new dependency without an `rg` usage check
- [ ] Rate limit + honeypot + zod validation intact on both routes (they are covered by tests — a red test here is a broken defense)

### 11.4 Commit & push (this sandbox)

Conventional Commits on `main` — no feature branches:

```bash
git add -A && git commit -m "feat|fix|docs|chore: ..."
GIT_SSH_COMMAND="/home/z/my-project/docs/ssh_git_wrapper_v3.py -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=accept-new" git push origin main
```

The wrapper exists because the sandbox has no `openssh` (Paramiko-based; see `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`). Key: Ed25519 `~/.ssh/id_ed25519`. Watch for the sandbox's periodic auto-commits with UUID messages — if one lands, fold it into your commit (never leave unrelated staged changes).

---

## 12. Lessons Learnt & How to Avoid Them

Grouped by project phase. References in parentheses point to §9 bugs, the audit doc, or ADRs.

### Build phase (v1.0)

1. **Scope the typecheck to what you own.** The template's `**/*.ts` include made 135 phantom errors and `ignoreBuildErrors: true` hid them from builds. An allow-listed `include` + a failing build found the truth in one run (C1).
2. **Verify the whole toast path, not the import.** `toast.success()` compiles with or without its renderer mounted (C11). Visual/E2E verification is the only proof a UI event happened.
3. **A honeypot must lie convincingly.** Leaking `422` on the honeypot field taught bots the trap; fake-success is the only correct behavior.
4. **Generated imagery beats scraped imagery** — brand-consistent AI WebP assets avoided licensing/provenance issues entirely while matching the site's dark aesthetic.

### Git/push phase

5. **Merge unrelated histories; never force-push.** The remote had 3 user-uploaded commits with no common ancestor; `git pull --allow-unrelated-histories` + resolving one identical-file add/add conflict preserved everything (worklog Task 3).
6. **Sandbox auto-commits happen.** UUID-message commits appeared between sessions; untrack local-only files (`worklog.md`) and fold strays in before pushing.
7. **A misleading error can point at the wrong layer.** "Invalid key" from the SSH wrapper was actually GitHub rejecting an unregistered RSA key; direct `paramiko` `Transport.auth_publickey` testing isolated the truth (worklog Task 2).

### Documentation phase

8. **Verify doc claims empirically.** The `DATABASE_URL` relative-path behavior was tested by creating throwaway DBs, not assumed — three docs carried the wrong path until tested (worklog Task 4).
9. **Docs drift the moment dependencies move.** The v1.1.0 remediation bumped `react/tailwind/zod/vitest` and the README table still claimed the old versions until a distillation pass re-verified every number against `bun.lock` (found during this SKILL.md's Phase 5). Rule: version claims in docs are written from `bun pm ls` output, never from memory.

### Audit + remediation phase (v1.1.0)

10. **Unused dependencies are a security surface.** 90 findings, 3 critical — all in packages the app never imported. Audit the import graph before the vulnerability list (S1–S3, ADR-008).
11. **TDD pays fastest on pure logic.** Extracting `dates.ts`, `rate-limit.ts`, and `schemas.ts` as pure modules and writing RED tests first turned an invisible bug class (C3) into a 9-test regression lock verified across 3 timezones.
12. **Visual fidelity defects hide behind working code.** Nine defects (D1, V1–V9) shipped on a green typecheck — arrows-over-text, hidden SUV prices, missing accent system. Only side-by-side visual audit (Appendix D) catches these.
13. **Fix the layout primitive, not the instance.** The carousel-arrow overlap (D1) was solved by moving arrows to the gutter for *all* breakpoints rather than nudging one card's padding.
14. **Deliberate divergences must be documented as decisions** (dialog vs form, filter-based before/after) — otherwise every future audit re-litigates them as defects.

---

## 13. Pitfalls to Avoid

**Dates & time**

- ❌ `new Date(iso).getDay()` — host-timezone dependent. ✅ `isSunday(iso)` from `lib/wcc/dates.ts`.
- ❌ `new Date().toLocaleDateString()` for "today". ✅ `todayIsoInTz(new Date(), BUSINESS_TZ)`.
- ❌ Comparing date strings with `<`/`>` across month boundaries. ✅ `isWithinBookingWindow(iso, todayIso)` (UTC-day ordinal math).

**Content & pricing**

- ❌ Hand-editing `BOOKABLE_SERVICES`. ✅ Edit `PACKAGES`/`CERAMIC_TIERS`/`INTERIOR_ONLY` — the derived array regenerates.
- ❌ Hardcoding a price in JSX or a route. ✅ Everything derives from `content.ts` via `quoteFor()`; the server recomputes the quote — the client's number is display-only.
- ❌ Trusting the client's `priceQuote`. ✅ The API computes `priceQuote` server-side from the same module and stores that.

**API**

- ❌ New validation rules in the route file. ✅ Add to `schemas.ts` + a test (accept/reject matrix).
- ❌ Distinguishing bots via `400/422` on the honeypot. ✅ Fake `201`, no row.
- ❌ Skipping the rate-limit check before an expensive operation. ✅ Check-then-work (`rateLimiter.check()` first).

**State & components**

- ❌ `useWccDialogs()` without a selector — re-renders on every store change. ✅ `useWccDialogs((s) => s.openBooking)`.
- ❌ Prop-drilling an "open dialog" callback through 5 levels. ✅ Any component can call the store action directly.
- ❌ Positioning interactive chrome inside the content box (carousel arrows inside the card row). ✅ Outer gutters or below (D1).

**Styling**

- ❌ Raw palette classes (`bg-blue-500`, `text-gray-400`, `amber-400`). ✅ Tokens only — `bg-primary`, `text-muted-foreground`, etc. (§19).
- ❌ Creating `tailwind.config.ts` for custom values. ✅ CSS-first: extend `@theme`/`:root` in `globals.css`.
- ❌ Animation without a reduced-motion rule. ✅ Every animated thing ships its `prefers-reduced-motion` counterpart (§4.3).

**Data & git**

- ❌ Committing `db/custom.db` (PII), `.env`, or `worklog.md`. ✅ All gitignored; keep them that way.
- ❌ Reading Prisma models in client components. ✅ The only DB access is inside the two API routes.

---

## 14. Best Practices

**Organization**

- Feature components in `src/components/wcc/<kebab-case>.tsx`, named exports only (default exports exist only for `layout/page/sitemap` — Next's requirement).
- Pure logic in `src/lib/wcc/` with colocated `__tests__/`; tests import via the `@/` alias like production code does.
- One component = one section = one file; shared pieces (`Logo`, `Reveal`, `BeforeAfter`) are the explicit exceptions.

**TypeScript**

- `interface` for object shapes (`ServicePackage`, `DayOption`), `type` for unions (`VehicleType`, `Step`).
- `satisfies ServicePackage` on standalone content objects (`INTERIOR_ONLY`) — checks shape without widening literal types.
- Content arrays use literal keys (`"essential-full"`) — typos fail typecheck in the dialog/routes that consume them.
- `as const` on `BUSINESS`, `SERVICE_MODES`, `TIME_SLOTS` — readonly + literal types for schema refinement.

**Validation & security**

- Zod at the boundary; the parsed result (not the raw body) is the only thing used downstream.
- Server is the authority: every client-side check (step validation) is UX only; the API re-validates everything.
- Errors to clients are strings fit for display; details go to `console.error` with a route prefix.

**Design**

- Brand tokens first; if a color/radius/spacing value doesn't exist as a token, add it to `:root`/`@theme` instead of a magic value (section paddings use the `py-20 sm:py-28` rhythm; containers `max-w-7xl` full sections, `max-w-4xl` reading sections).
- Motion is CSS, ≤ 0.6s, and reduced-motion-safe.
- Destructive/important states use color **and** text — never color alone.

**Testing**

- TDD for pure logic (RED → GREEN → REFACTOR was the remediation workflow).
- Tests assert behavior, not implementation (prices, rejections, window boundaries — not internals).
- When touching dates: run the suite under at least two `TZ` values (§11.1).

**Git**

- Conventional Commits, atomic commits, `main` only.
- Before push: §11 gates + a `git log --oneline -5` sanity check for stray sandbox commits.


---

## 15. Coding Patterns

### 15.1 The API route pattern (`src/app/api/bookings/route.ts`)

Every mutating endpoint follows the same fixed order — defense layers run cheapest-first:

```ts
export async function POST(request: Request) {
  let body: unknown;                                     // 1. parse (never trust)
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const parsed = bookingSchema.safeParse(body);           // 2. zod at the boundary
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 422 });
  }
  const data = parsed.data;

  if (data.company) {                                     // 3. honeypot: fake success
    return NextResponse.json({ ok: true, confirmation: "WCC-000000" }, { status: 201 });
  }

  if (bookingRateLimiter.check(clientIpFrom(request))) {   // 4. rate limit (per-IP)
    return NextResponse.json({ error: "Too many… call us…" }, { status: 429 });
  }

  const service = findService(data.serviceKey);           // 5. business rules
  if (!service) return NextResponse.json({ error: "Unknown service" }, { status: 422 });
  if (isSunday(data.date)) return NextResponse.json({ error: "…closed on Sundays…" }, { status: 422 });
  if (data.serviceMode !== "shop" && !data.address)
    return NextResponse.json({ error: "Address required…" }, { status: 422 });

  const priceQuote = quoteFor(data.serviceKey, data.vehicleType, data.addOnCeramic); // server-side truth

  try {                                                   // 6. persist
    const booking = await db.booking.create({ data: { …, priceQuote } });
    const confirmation = `WCC-${booking.id.slice(-6).toUpperCase()}`; // last 6 of the cuid
    return NextResponse.json({ ok: true, confirmation, priceQuote }, { status: 201 });
  } catch (error) {
    console.error("[api/bookings] create failed", error);
    return NextResponse.json({ error: "…call (508) 290-7476…" }, { status: 500 });
  }
}
```

Note the error-copy discipline: user-facing messages double as phone-fallback instructions, and the catch-all never leaks internals.

### 15.2 Timezone-safe date rules (`src/lib/wcc/dates.ts`)

```ts
export const BUSINESS_TZ = "America/New_York";
export const BOOKING_WINDOW_DAYS = 60;

export function isSunday(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00Z`);   // UTC midnight — day-of-week is host-independent
  return d.getUTCDay() === 0 && !Number.isNaN(d.getTime());
}

export function todayIsoInTz(instant: string | number | Date = new Date(), tz: string = BUSINESS_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {   // en-CA formats as YYYY-MM-DD
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(instant instanceof Date ? instant : new Date(instant));
}
```

Window membership compares `Date.UTC(y, m-1, d)` ordinals — no DST edge can shift it.

### 15.3 Sliding-window rate limiter (`src/lib/wcc/rate-limit.ts`)

In-memory `Map<key, timestamp[]>`; `check(key, now)` prunes the whole map, filters the key's window, blocks at `max`, else records the hit. Constructor validates `windowMs > 0 && max > 0`. Shared instances: `bookingRateLimiter` / `questionRateLimiter` (both 5 per 10 min). `clientIpFrom(request)` takes the **first** `x-forwarded-for` hop (`?? "local"`). Per-process by design (single-node deployment, ADR-005).

### 15.4 Shared zod schemas (`src/lib/wcc/schemas.ts`)

`isoDate` is a chained refine: regex → real-date check → 60-day window (using 15.2 helpers). `bookingSchema.serviceKey` refines against `BOOKABLE_SERVICES` — adding a service in `content.ts` automatically makes it bookable. `questionSchema` mirrors the lighter inquiry contract. The honeypot `company` field is `optional()` — presence is a bot signal, not a validation error.

### 15.5 Reveal wrapper (one-shot IntersectionObserver)

```tsx
useEffect(() => {
  const el = ref.current; if (!el) return;
  const observer = new IntersectionObserver(
    (entries) => { for (const e of entries) if (e.isIntersecting) { setVisible(true); observer.disconnect(); } },
    { rootMargin: "0px 0px -10% 0px" });
  observer.observe(el);
  return () => observer.disconnect();      // cleanup always
}, []);
```

Render: `visible ? "translate-y-0 opacity-100" : variant === "card" ? "translate-y-8 scale-[0.98] opacity-0" : "translate-y-6 opacity-0"`. One-shot (disconnect on first hit), delay via inline `transitionDelay`.

### 15.6 Before/after "dirty-vision" compare (`before-after.tsx`)

Same photo twice; the before half is clipped (`clipPath: inset(0 ${100-pos}% 0 0)`) and filtered — `grayscale(.55) sepia(.28) brightness(.62) contrast(.86) saturate(.7)` + a `mix-blend-multiply` dust gradient + a repeating streak overlay. Pointer capture on `pointerdown`, window `pointerup` only while dragging, arrows ±5 clamped to [4, 96]. This is the pattern to copy for any compare UI — and it keeps asset count at one photo per slider.

### 15.7 Dialog preset consumption (`booking-dialog.tsx`)

On open (`useEffect` keyed on `bookingOpen`): if `presetService` exists, set the form's service; if `presetAddOnCeramic !== null`, set the add-on; presets are then cleared via `closeBooking()` semantics (the store clears on close). Presets are consumed once — a re-open without them starts clean.

### 15.8 Prisma singleton (`src/lib/db.ts`)

`globalThis` cache assigned only in dev (prevents HMR connection storms), query logging dev-only. Import `db` — never instantiate `PrismaClient` anywhere else.

---

## 16. Coding Anti-Patterns

| ❌ Don't | ✅ Do instead | Why |
|---|---|---|
| `new Date("2026-09-14").getDay()` | `isSunday("2026-09-14")` | host-TZ drift (C3) |
| `quote` computed from a client-sent number | `quoteFor(key, vehicle, addOn)` server-side | client numbers are display-only |
| `toast()` from any lib but sonner | `import { toast } from "sonner"` | one toast system; the old one was deleted (C11) |
| `bg-amber-400`, `text-gray-500` | `text-primary`, `text-muted-foreground` | token discipline (§19) |
| New component without dialog access → prop-drill `onBook` | call `useWccDialogs((s) => s.openBooking)` | the store is the CTA bus |
| `use client` on a pure data module | keep `content.ts`/`lib/wcc` server-safe (except the store) | keeps the import graph honest |
| `any` in a new signature | `unknown` + zod/narrowing | strict mode + review convention |
| Inline `<style>` or styled-components | `@theme` token + utility classes in `globals.css` | one styling system |
| `fetch("/api/bookings", { method: "GET" })` | POST-only API | routes only export `POST` |
| Editing `BOOKABLE_SERVICES` by hand | edit the source arrays in `content.ts` | derived data regenerates (§7.2) |
| Reading `x-forwarded-for` whole string as the key | `clientIpFrom(request)` (first hop) | proxy chains concatenate values |
| Letting a new Radix primitive import a pruned dep | CLI add + verify `package.json` | the prune was a security fix (ADR-008) |

---

## 17. Responsive Breakpoint Reference

Tailwind 4 defaults, no custom breakpoints: **`sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536**.

| Breakpoint | What switches (verified usage scan) |
|---|---|
| `sm` (640) | The workhorse: headings step up (`text-3xl sm:text-5xl`), 3-col stat band, pillar grids (`sm:grid-cols-3`), CTAs go row (`sm:flex-row`), card paddings, header phone + Book button appear (`hidden sm:flex`) |
| `md` (768) | Carousel item basis (`md:basis-1/2`) — the only `md` in the codebase |
| `lg` (1024) | **Layout switchpoint**: desktop nav appears / hamburger hides (`hidden lg:flex` / `lg:hidden`), 2-col section grids (`lg:grid-cols-2`), call FAB hidden (`lg:hidden`), footer 3-col, hero h1 max size |
| `xl` (1280) | Carousel arrows appear in the outer gutter (`max-xl:hidden`) + 3-across cards (`xl:basis-1/3`) |

Mobile-first: base styles ARE the mobile layout. The booking dialog is deliberately mobile-shaped (`max-w-md`) on all viewports — it works as a bottom-sheet-like centered card. Mobile test width used throughout the audit: **375px** (and 390×844 for FAB/sheet checks).

---

## 18. Z-Index Layer Map

| Layer | Element | Location | Notes |
|---|---|---|---|
| `z-50` | Sticky site header | `site-header.tsx` | highest persistent chrome |
| `z-50` | Radix Dialog overlay + content | `ui/dialog.tsx` (portal) | booking + question dialogs render above everything incl. header |
| `z-50` | Radix Sheet overlay + content | `ui/sheet.tsx` (portal) | mobile nav |
| `z-40` | Call FAB | `call-fab.tsx` | below dialogs (a dialog open on mobile must cover the FAB) |
| `z-10` | Section backdrop containers | `hero.tsx`, `final-cta.tsx`, `booking-dialog.tsx` internal | `absolute inset-0 -z-10` photo/gradient backdrops sit behind their section content |
| — | `[data-reveal]` wrappers | `reveal.tsx` | no z-index — opacity/transform only |

**Rules:** new persistent chrome goes below `z-40` unless it must cover the FAB; anything that must cover the header is a Radix portal at `z-50`; backdrops use `-z-10` *inside* an `isolate`d section (the `isolate` class creates the stacking context that stops `-z-10` from escaping behind the page). Do not invent new z values — this is the complete map (verified by scanning `z-\d` across `src/`).

---

## 19. Color Reference (Complete)

Every hex below is copied from the `:root` block of `src/app/globals.css` — a mismatch between this table and the CSS is a bug in one of them.

| Token | Hex / value | RGB | Tailwind class | Usage |
|---|---|---|---|---|
| `--background` | `#0a0b0d` | 10,11,13 | `bg-background` | page |
| `--foreground` | `#f2f0ea` | 242,240,234 | `text-foreground` | body text |
| `--card` | `#121417` | 18,20,23 | `bg-card` | cards, FAQ items |
| `--card-foreground` | `#f2f0ea` | — | `text-card-foreground` | text on cards |
| `--popover` | `#14161a` | 20,22,26 | `bg-popover` | popovers/dialogs |
| `--popover-foreground` | `#f2f0ea` | — | `text-popover-foreground` | — |
| `--primary` | `#f2a61c` | 242,166,28 | `bg-primary`, `text-primary`, `fill-primary` | CTAs, prices, stars, key numbers |
| `--primary-foreground` | `#17120a` | 23,18,10 | `text-primary-foreground` | on-amber text |
| `--accent-teal` | `#5eead4` | 94,234,212 | `text-accent-teal` | keyword highlights ONLY |
| `--secondary` | `#1a1d21` | 26,29,33 | `bg-secondary` (used as `/40` band) | alternating sections |
| `--secondary-foreground` | `#e8e6df` | 232,230,223 | `text-secondary-foreground` | — |
| `--muted` | `#17191d` | 23,25,29 | `bg-muted` | — |
| `--muted-foreground` | `#9c9a92` | 156,154,146 | `text-muted-foreground` | secondary text |
| `--accent` | `#1f2126` | 31,33,38 | `bg-accent`, `hover:bg-accent` | hover fills |
| `--accent-foreground` | `#f2f0ea` | — | `text-accent-foreground` | — |
| `--destructive` | `#e5484d` | 229,72,77 | `text-destructive` | errors |
| `--border` | `rgba(255,255,255,0.09)` | — | `border-border` | hairlines |
| `--input` | `rgba(255,255,255,0.13)` | — | `border-input` | inputs |
| `--ring` | `#f2a61c` | — | `ring-ring`, `outline-ring/50` | focus |
| `--chart-1` | `#f2a61c` | — | — | ramp (reserved) |
| `--chart-2` | `#d9892b` | 217,137,43 | — | ramp (reserved) |
| `--chart-3` | `#8a8f97` | 138,143,151 | — | ramp (reserved) |
| `--chart-4` | `#5c6169` | 92,97,105 | — | ramp (reserved) |
| `--chart-5` | `#383d45` | 56,61,69 | — | ramp (reserved) |
| `--sidebar` + 7 siblings | mirror of base tokens | — | — | shadcn convention; unused |

**Opacity variants in real use:** `bg-background/60` (price rows), `/88` + `/45` + `/40` + `/35` (photo overlays), `bg-black/70` (Before label), `bg-primary/70` (borders), `text-primary/70` (quote glyph), `text-foreground/85–90` (body on dark).

**Forbidden:** raw Tailwind palette colors (`amber-400`, `gray-500`, `blue-600`…) anywhere in `src/` — the brand owns every visible color through tokens. The two greps that enforce this during review: `rg "amber-|gray-|slate-|blue-|red-|green-" src/` should return nothing styled; white/black appear only as overlay alphas (`bg-black/40`, `bg-white/90` divider) and in the icon SVG.

**The singular exception:** the scrollbar thumb greys (`#2a2d33` / `#3a3e45`) are hardcoded in `globals.css` — cosmetic-only, no token needed.

---

## 20. TypeScript Interface Reference

Content shapes (`src/data/wcc/content.ts`):

```ts
export type VehicleType = "sedan" | "suv";

export interface ServicePackage {
  key: string; name: string; tagline: string; description: string;
  prices: Record<VehicleType, number>;
  features: string[]; popular?: boolean; durationHours: string;
}

export interface CeramicTier {
  key: string; name: string; years: string; description: string;
  prices: Record<VehicleType, number>; features: string[]; popular?: boolean;
}

export interface Testimonial { name: string; date: string; text: string; }
export interface Faq { question: string; answer: string; }

export interface BookableService {
  key: string; name: string;
  prices: Record<VehicleType, number>;
  durationHours: string;
  group: "detail" | "ceramic" | "interior";
  allowCeramicAddOn: boolean;
  summary: string;      // one-line "what you get" for the dialog service list
  popular?: boolean;
}
```

Booking domain (`src/lib/wcc/booking.ts`):

```ts
export interface BookingDraft {
  serviceKey: string;
  vehicleType: VehicleType;
  serviceMode: "mobile" | "shop" | "pickup";
  date: string;   // YYYY-MM-DD
  time: string;   // must be in TIME_SLOTS
  name: string; phone: string; email: string;
  address?: string; city?: string; notes?: string;
  addOnCeramic: boolean;
}

export interface DayOption {
  iso: string;        // YYYY-MM-DD
  weekday: string;    // "Mon"
  day: number; month: string;  // "Sep"
  slots: number;      // 6 on open days, 0 on Sundays (display-only — no capacity backend)
  closed: boolean;
}
```

State (`src/lib/wcc/booking-store.ts`): `WccDialogState` + `OpenBookingOptions { addOnCeramic?: boolean }` (§6.1).
Rate limiting (`src/lib/wcc/rate-limit.ts`): `RateLimiterOptions { windowMs: number; max: number }` + class `SlidingWindowRateLimiter`.
Validation (`src/lib/wcc/schemas.ts`): `export type BookingInput = z.infer<typeof bookingSchema>` / `QuestionInput` — the wire contract, shared client + server.

Prisma models (`prisma/schema.prisma`): `Booking` — id (cuid), serviceKey, serviceName, vehicleType, serviceMode, date, time, name, phone, email, address?, city?, notes?, priceQuote? (Int), addOnCeramic (default false), status (default "pending"), createdAt/updatedAt; `@@index([createdAt])`, `@@index([date])`. `Question` — id, name, email, phone?, question, createdAt; `@@index([createdAt])`.

Dialog internals (`booking-dialog.tsx`): `type Step = 1 | 2 | 3 | 4`; `FormState` = the draft + per-step touched flags. Not exported — the dialog owns them.

---

## Appendix A: Architecture Decision Records

Full context/decision/rationale text lives in `Project_Architecture_Document.md` §1.3.

| ADR | Decision | One-line rationale |
|---|---|---|
| ADR-001 | Single-page App Router site, interactive complexity in dialogs | one story, one conversion path; multi-page adds zero SEO for a single-location business |
| ADR-002 | SQLite via Prisma, `db:push` (no migration files) | single-file persistence fits lead volumes of dozens/week; migrations would be ceremony |
| ADR-003 | Content as a typed TS module (`content.ts`), no CMS | monthly-at-most content changes; typecheck beats admin auth surface |
| ADR-004 | Zustand over Context/URL state for dialogs | 9+ components need open-access; selectors avoid re-render cascades |
| ADR-005 | Bot defense without auth: honeypot + in-memory sliding window | public booking site; fake-success honeypot leaks nothing; per-process Map is fine single-node |
| ADR-006 | Standalone output served by bun behind Caddy | single deployable; Caddy terminates TLS |
| ADR-007 | Dark-first hardcoded theme, tokens in `:root`, two-tone amber+teal | brand is a dark showroom; no theming dimension to maintain |
| ADR-008 | Dependency + dead-code pruning (v1.1.0) | 90 audit findings, 3 critical — all via unused template scaffolding; prune beats pin-around |
| ADR-009 | Vitest unit suite with timezone-verified date rules | TDD baseline; the C3 bug class must never regress silently |

---

## Appendix B: Booking Flow State Machine & API Contract

### B.1 Dialog steps (`booking-dialog.tsx`, 645 lines)

```
Step 1  Service     — grouped list (Detail / Ceramic / Interior), each row:
                      name, summary, duration, BOTH vehicle prices, "Most Popular"
                      badge; vehicle radiogroup (sedan/suv); add-on checkbox
                      (disabled + hidden on ceramic tiers — allowCeramicAddOn=false)
Step 2  Date & time — 14 day-chips from buildDayOptions (Sundays disabled, labeled
                      "Closed"), 6 time slots; live quote updates
Step 3  Contact     — name, phone, email; address + city required when mode ≠ shop
                      (mode picker lives on step 3 as well); notes optional
Step 4  Confirm     — summary block + submit (POST /api/bookings)
Success            — confirmation code WCC-XXXXXX + sonner toast
```

Back/Next gate on per-step validity; presets from the store (service, add-on) apply on open (§15.7). The dialog never trusts its own quote as final — the server recomputes.

### B.2 API contract

| Endpoint | Method | Body (zod) | Success | Failures |
|---|---|---|---|---|
| `/api/bookings` | POST | `BookingInput` (serviceKey ∈ BOOKABLE_SERVICES, vehicleType, serviceMode, date (ISO, ≤60d), time ∈ TIME_SLOTS, name 2–80, phone regex, email, address?/city?/notes?, addOnCeramic, company? = honeypot) | `201 {ok, confirmation: "WCC-XXXXXX", priceQuote}` | `400` bad JSON · `422` validation/rules with `issues[]` · `429` rate limit (5/10min/IP) · `500` DB |
| `/api/questions` | POST | `QuestionInput` (name 2–80, email, phone?, question 10–2000, company?) | `201 {ok}` | same shape, minus rule failures |

Honeypot on either route: non-empty `company` → fake `201`, no row written. Sunday dates and (non-shop mode + missing address) are business-rule `422`s.

---

## Appendix C: Audit History

**2026-09-13 — audit cycle 2: e2e suite + a11y + perf (v1.2.0)**

- Added `.env.example` (path semantics verified for CLI + runtime); `.gitignore` un-ignores it.
- Playwright e2e suite adopted from `nordeim/home-financing` (ADR-010): 29 tests — smoke, SEO/JSON-LD, booking funnel with SQLite server-truth + cleanup, API contracts (400/422/429/honeypot/201, unique XFF per test), axe gates (critical + serious). Suite caught the missing `robots.txt` `Sitemap:` directive (red → green).
- Visual parity re-audit vs the source: two VLM passes + DOM verification of every claim — 3 of 6 VLM-flagged gaps were false positives; parity holds; no code changes required.
- Lighthouse on the standalone build: a11y 0.97 → **1.0** (aria-prohibited-attr star spans → `role="img"`; logo Label-in-Name fixed by composing the accessible name from content + `sr-only`; aria-label dropped from the CTA rating `<p>`); performance 0.71 → **0.80** (hero made responsive: 640w/1024w srcset, phones 44 KB vs 161 KB; `fetchPriority="high"` was already present — caught by the plan-validation step).
- Dead `/api` hello-world route deleted; `e2e/` + `playwright.config.ts` added to tsconfig include.
- Full trail: `docs/audit-e2e-2026-09.md`.

**2026-09-13 — full visual + code audit → remediation (v1.1.0, commit `7a4a4e0`)**

- Visual/UX: agent-browser desktop 1440×900 + mobile 390×844 against `https://wecarecarcare.com/`, ~60 screenshots, VLM section-by-section comparisons, animation verification (reveals, drag slider 50→79, carousel, accordion, shine sweep via computed styles).
- Findings: 1 defect (D1 arrows-over-text) + 8 fidelity gaps (V1 missing teal system, V2 hidden SUV price, V3 bare dialog rows, V4/V5 plain CTA/FAQ, V6 hero contrast, V7 no FAB, V9 no add-on preselect) — all fixed; 4 deliberate divergences documented.
- Code review: `bun audit` 90 findings (3 critical — next-auth homoglyph, next 16.1.3 advisories) → next@16.3.5, 44 deps + 39 ui files removed; 135 tsc errors → 0 (scoped include + enforced build); `db/custom.db` untracked; Prisma logs dev-only; toast wiring fixed (C11); icon + sitemap added. 2026-09-13 supply-chain follow-up: prisma CLI → devDependencies + overrides (defu 6.1.7, deepmerge-ts 8.0.2, baseline-browser-mapping 2.11.23) → production dep graph audit-clean.
- Tests: 0 → **49** (5 files) via TDD; new modules `dates.ts` / `rate-limit.ts` / `schemas.ts` extracted + covered.
- Full audit trail with per-task acceptance criteria: `docs/audit-and-remediation-2026-09.md`.
- Open (documented, not fixed): slot capacity/double-booking check, real chat widget, gallery/about sections, next/image migration, component/E2E tests, CI.

---

## Appendix D: Live-Site Validation Methodology

What the §11.2 smoke actually runs (and why CI alone cannot replace it):

1. **agent-browser** (headless CLI): navigate → snapshot (compact a11y-tree) → click/type → screenshot. Used for the E2E booking (dialog steps, submit, toast assertion), mobile 375px checks, FAB visibility after scroll, and negative-path API probes (422/429/honeypot).
2. **VLM screenshot comparison**: side-by-side section screenshots vs the source site catches what DOM assertions can't — text overlap (D1), missing accent systems (V1), contrast feel (V6), spacing rhythm.
3. **Computed-style probes** for animation truth: `::before` left transition (shine), `aria-valuenow` during drag, `aria-expanded` toggles, `[data-reveal]` class flips.
4. **DB row verification + cleanup**: Prisma Studio (or `sqlite3`) after E2E — the row must exist; test rows are then deleted (PII hygiene, §11.3).

What this catches that `tsc`/`vitest`/`build` cannot: toast renderers that were never mounted (C11), visual overlap defects, dead CTAs that compile fine, and mobile-only elements. The rule: **any change that renders differently must be screenshot-verified, not just typechecked.**

---

## Document Provenance & Drift Maintenance

**Provenance.** Distilled 2026-09-13 following the six-phase process (analyze → plan → validate → implement → verify → deliver) from the `to-distill-project-into-skill` meta-skill. Facts were verified against the working tree at `main @ 7a4a4e0`: versions via `bun pm ls`; test counts via `TZ=UTC npm test` (49/49, 5 files); component counts via `find src/components`; colors copied from `globals.css`; z-index and breakpoints via usage scans; contrast ratios computed with the WCAG relative-luminance formula; all referenced file paths spot-checked to exist.

**Drift check** — run when this doc is >1 sprint stale:

```bash
bun pm ls | rg "next@|react@|zod@|vitest@"        # vs §2
TZ=UTC npm test 2>&1 | rg "Tests"                  # vs "49 tests" claims
find src/components/wcc -name '*.tsx' | wc -l       # vs §5.3 (16)
rg -c "amber-|gray-|slate-|blue-" src/ || echo OK   # §19 forbidden-color scan
rg -n "TODO|FIXME" car-care_SKILL.md | rg -v "must stay 0"   # must stay 0 (self-filtering)
```

**Update triggers:** dependency bumps (§2), new components (§5.3, §17–19 if visual), new/changed business rules (§15), any new bug that costs >30 minutes (§9 + §12), test-count changes (§11, §Provenance). Version this file semantically — v1.0.0 initial distillation; bump minor per sprint of changes, major on framework upgrades.
