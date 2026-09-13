# PRD — We Care Car Care (car-care)

**Product:** Marketing + booking site for **We Care Car Care**, auto detailing & ceramic coating studio, Framingham MA (MetroWest Boston, since 2010).
**Repo:** `github.com/nordeim/car-care` · **Stack:** Next.js 16.3.5 App Router (standalone) · React 19.3 · TypeScript 5.9 · Tailwind 4.3 · Prisma 6.19 + SQLite · Zustand · Zod · Vitest + Playwright
**Status:** v1.2.0 — 49/49 unit × 3 TZ + 29/29 e2e green · lighthouse a11y/bp/seo 1.0
**Source of truth:** Business facts in `src/data/wcc/content.ts`; this PRD derives from `docs/prompt-to-create.md` (clone `https://wecarecarcare.com/` from `nordeim/home-financing`) plus the contracts in `AGENTS.md` / `CLAUDE.md` / `README.md` / `car-care_SKILL.md`.
**Last updated:** 2026-09-13

---

## 1. Vision & Goals

**One sentence:** A single-page funnel that turns MetroWest organic search into **booked details or phone calls** — dark, warm-charcoal showroom aesthetic, not SaaS.

**Goals:** (1) Rank locally (SEO/JSON-LD), (2) convert via fast 4-step dialog or phone, (3) persist leads to SQLite for owner triage, (4) zero friction (no captcha, no auth), (5) survive bot traffic quietly.

**Non-goals:** No accounts/admin, no CMS, no payments, no analytics/third-party scripts, no light mode.

---

## 2. Target Users & Journeys

| Persona | Need | Happy path |
|---|---|---|
| **Ready to book** (primary) | Price + availability + 1-tap booking | Land → hero → packages (dual pricing) → Book Now → 4 steps → `WCC-XXXXXX` + DB row |
| **Not ready / comparison** | Trust + education | Difference (pillars + before/after sliders) → ceramic upsell/tiers → testimonials (carousel) → FAQ → Final CTA |
| **Phone-preferrer** | Immediate human | Any CTA + sticky header + mobile FAB (`tel:+15082907476`) → call |

---

## 3. Information Architecture — Single Page (`src/app/page.tsx`)

```
SiteHeader (sticky z-50, transparent→blur after 24px) — Logo + nav #anchors + Book CTA
Hero (#top) — grain + gradients, hero-car.webp, eyebrow + headline, rating badge, 3 CTAs, stats band (16+ yrs · 7,500+ · 5.0)
Difference (#difference) — 3 pillars + 2 BeforeAfter sliders (dirty-vision filter, pointer capture)
Packages (#pricing) — 2 cards (essential $240/$295, premium $360/$395 popular) — image band 16:6, DUAL pricing rows, features, Book + Smart Add-On
CeramicUpsell (#ceramic) — $200 add-on pitch (regular $299), 4 benefits
CeramicTiers — 3 cards (1yr $560/$595, 3yr $795/$995 popular + beads image, 5yr $995/$1295)
InteriorOnly — $195/$240 single card
Testimonials (#reviews) — Embla carousel (align:start, loop, md:1/2 xl:1/3, arrows in gutter xl, swipe below), 6 reviews + 5.0 header
Faq (#faq) — 9 items, Radix accordion single collapsible, card per item, sentence case
FinalCta — full-bleed detail-action.webp + 5-star pill + 2 buttons + phone link
SiteFooter — brand, contact, 14 service areas, hours Mon–Sat 8–6, closed Sun
CallFab (fixed z-40 lg:hidden, appears scrollY>400) — tel link
BookingDialog + QuestionDialog — global, Zustand-controlled, Sonner toasts
```

**Anchors (nav contract):** `#top #difference #pricing #ceramic #reviews #faq` — stable.

---

## 4. Functional Requirements

### F1 — Marketing Surface

- **F1.1** All 9 sections render with content from `content.ts` (no hardcoded copy/price in JSX).
- **F1.2** Dual pricing always visible: each package/tier card shows sedan AND SUV rows (label left, amber price right).
- **F1.3** Card image bands: `CARD_IMAGES` map by key, 16:6 crop, border; ceramic popular tier gets `ceramic-beads.webp`.
- **F1.4** Before/after: one photo per scene + CSS dirty-vision filter for "before", pointer capture drag (pos 4–96), `role=slider` + `aria-valuenow` + arrows ±5, `touch-none select-none`.
- **F1.5** Testimonials: Embla, arrows outside content box (`xl:-left-14/right-14`, `max-xl:hidden`), rating `aria-label`.
- **F1.6** FAQ: Radix `single collapsible`, each item `bg-card` rounded, sentence case triggers.
- **F1.7** Final CTA: photo backdrop + gradient, rating pill, 2 buttons, phone text link.
- **F1.8** Motion: `[data-reveal]` IntersectionObserver (−10% margin, one-shot, CSS `opacity/translate` 0.5s), `.shine` CTA sweep, `.grain` overlay — all neutralized under `prefers-reduced-motion`.
- **F1.9** Responsive: mobile Sheet nav (85vw) at `lg` breakpoint, hero responsive srcset, FAB `lg:hidden`.

### F2 — Booking Funnel (4-step dialog, `booking-dialog.tsx`)

- **F2.1** Step 1 Service: lists `BOOKABLE_SERVICES` (6) with one-line `summary` (top-3 features) + `Most Popular` badge on `premium-full`; vehicle selector (sedan/suv) + optional `addOnCeramic` ($200 flat, only if `allowCeramicAddOn`); live total via `quoteFor()`; validation before next.
- **F2.2** Step 2 Date/Time: `buildDayOptions` → 14 days from `America/New_York` today, **Sunday disabled**; `TIME_SLOTS` 6 values (`08:00 AM` … `03:30 PM`); time required.
- **F2.3** Step 3 Contact: name/phone/email required, address+city **required if `serviceMode !== shop`** (`mobile`/`pickup`), `serviceMode` in `SERVICE_MODES` (`mobile/shop/pickup`), notes ≤1000.
- **F2.4** Step 4 Confirm: shows computed quote + selected summary; submit → `POST /api/bookings` → on `201` show `WCC-XXXXXX` confirmation + Sonner toast; inline `submitError` on failure; buttons disabled during async with loading indicator.
- **F2.5** Smart Add-On: `packages.tsx` "Smart Add-On" → `openBooking(key, {addOnCeramic:true})` preselects ceramic; store consumes preset once on open, clears on close.
- **F2.6** Question dialog: 1-step `name/email/question(10–2000)` + optional phone → `POST /api/questions` → toast.

### F3 — Persistence

- **F3.1** Two models: `Booking` (serviceKey/serviceName/vehicleType/serviceMode/date `YYYY-MM-DD`/time/name/phone/email/address?/city?/notes?/priceQuote Int/server-computed/addOnCeramic/status pending/createdAt/updatedAt, indexes `createdAt` + `date`) and `Question` (name/email/phone?/question/createdAt index).
- **F3.2** Confirmation code is last 6 chars of Prisma `cuid`, uppercased, `WCC-XXXXXX`.
- **F3.3** DB file `db/custom.db` gitignored (PII); preview empty seed only; inspect via `bunx prisma studio`.

### F4 — Business Rules (server-authoritative; client checks are UX only)

- **F4.1** Sunday closure: rejected `422` — weekday derived **TZ-safe** from ISO string via UTC (`isSunday`), "today" from `America/New_York` via `Intl`.
- **F4.2** Booking window: date must be within next 60 days inclusive (`isWithinBookingWindow`, UTC-day ordinal math) — `422` otherwise.
- **F4.3** Service key must exist in `BOOKABLE_SERVICES` — `422`.
- **F4.4** Address required for `mobile`/`pickup` — `422`.
- **F4.5** Price quote recomputed server-side via `quoteFor`; ceramic add-on $200 flat only if tier allows; client quote display-only.
- **F4.6** Honeypot: field `company` — if non-empty → fake `201 {ok:true, confirmation:"WCC-000000"}` and **no row written** (bots learn nothing).
- **F4.7** Rate limit: 5 req / 10 min per IP per endpoint, sliding window, `SlidingWindowRateLimiter` with `prune()`, shared instance — `429` with call-us message; trusts `x-forwarded-for` first hop behind Caddy.

### F5 — SEO / A11y / Perf

- **F5.1** Metadata: title/description, `metadataBase https://wecarecarcare.com`, OG/Twitter cards referencing `/images/hero-car.webp`.
- **F5.2** JSON-LD `AutoWash` in `layout.tsx` (name, phone, email, address Framingham, geo, hours, `areaServed` 14 towns, `aggregateRating` 5.0/37) — keep in sync with `content.ts`.
- **F5.3** `public/robots.txt` includes `Sitemap:` directive; `src/app/sitemap.ts` + `icon.svg`.
- **F5.4** A11y: WCAG AA (AAA for main text/accents), axe `critical+serious=0`, `role=slider`/`accordion`/`dialog`, `Label htmlFor`, `role=alert` for errors, icons `aria-hidden` + adjacent text, focus rings amber.
- **F5.5** Perf: hero `fetchPriority high` + responsive srcset (640w 44KB vs 1024w), lazy below-fold, no Framer Motion, standalone output, `sharp` WebP pipeline.

---

## 5. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Perf budget** | Lighthouse a11y/bp/seo 1.0, perf ≥0.80; single RSC page, minimal client JS. |
| **Security** | Zod at boundary, Prisma parameterization, `dangerouslySetInnerHTML` only for static JSON-LD, no secrets in client, `.env` + `db/*.db` gitignored, `bun audit --prod` 0 findings. |
| **Reliability** | Timezone-safe date logic verified `TZ=UTC` + `America/New_York` + `Asia/Singapore`; server re-validates all client state; in-memory rate limit ephemeral by design (ADR-005). |
| **Ops** | `bun` canonical; `bun run dev` (:3000 `dev.log`) / `build` (copies `static`+`public` into `.next/standalone/`) / `start` (bun `server.js` `server.log`); single env var `DATABASE_URL`; no Docker/CI yet. |
| **Testing** | Vitest 49 unit (pricing/slots, dates TZ, schemas, rate-limit, store) + Playwright 29 e2e (smoke, SEO/JSON-LD, funnel with SQLite truth + cleanup, API contracts, axe) on standalone :3100. Gate: `npm test && bun run e2e && bun run lint && bunx tsc --noEmit && bun run build`. |

---

## 6. Content & Pricing (from `content.ts`)

| Key | Name | Sedan | SUV | Popular | Duration |
|---|---|---|---|---|---|
| `essential-full` | Essential Full Detail | $240 | $295 | — | 3–4h |
| `premium-full` | Premium Full Detail | $360 | $395 | ● | 5–6h |
| `ceramic-1yr` | 1-Year Protection | $560 | $595 | — | — |
| `ceramic-3yr` | 3-Year Protection | $795 | $995 | ● | — |
| `ceramic-5yr` | 5-Year Protection | $995 | $1295 | — | — |
| `interior-only` | Interior Only Detail | $195 | $240 | — | — |
| **Add-on** | Ceramic shield add-on | +$200 flat (regular $299) | | | only if `allowCeramicAddOn` |

`BOOKABLE_SERVICES` (6) derived from above + `summary` (top-3 features) + `popular` + `group` + `allowCeramicAddOn`. `SERVICE_AREAS` 14 towns feed footer + JSON-LD `areaServed`. `BUSINESS` phone `(508) 290-7476` / `tel:+15082907476` / Framingham MA / Mon–Sat 8:00–18:00.

---

## 7. API Contracts

| Endpoint | Method | Body (Zod) | Success | Errors |
|---|---|---|---|---|
| `/api/bookings` | POST | `serviceKey, vehicleType, serviceMode, date(YYYY-MM-DD ≤60d), time ∈ TIME_SLOTS, name, phone, email, address?, city?, notes?, addOnCeramic, company?` | `201 {ok:true, confirmation:"WCC-XXXXXX", priceQuote:number}` | `400 Invalid JSON` · `422 {error, issues[]}` (zod/Sun/address/unknown key/window) · `429 rate limit` · `500 call-the-shop` |
| `/api/questions` | POST | `name, email, phone?, question(10–2000), company?` | `201 {ok:true}` | same `400/422/429/500` pattern |
| `company` non-empty on either | — | — | `201 {ok:true, confirmation:"WCC-000000"}` fake, **0 rows** | — (intentional honeypot) |

Pipeline order (load-bearing): parse → zod → honeypot → rate limit → business rules → server price → persist → respond.

---

## 8. Design System

| Token | Value | Use |
|---|---|---|
| `--background` | `#0a0b0d` | canvas |
| `--foreground` | `#f2f0ea` | body (17.3:1 AAA) |
| `--primary` | `#f2a61c` | amber CTAs/prices/stars (9.6:1 AAA) |
| `--accent-teal` | `#5eead4` | teal keyword highlights (13.3:1 AAA) |
| `--card` | `#121417` | cards |
| `--muted-foreground` | `#9c9a92` | secondary (7:1 AA) |
| `--destructive` | `#e5484d` | errors |

Typography: Oswald (display, uppercase tight) + Archivo (body) via `next/font` vars `--font-oswald`/`--font-archivo`. Utilities: `.font-display`, `.grain`, `.shine`, `[data-reveal]`, scrollbar amber. Tailwind 4 CSS-first `@theme inline`; no `tailwind.config.ts`.

---

## 9. Constraints & Anti-Patterns

Hard fails: (1) hardcoding price/copy in JSX, (2) trusting client price/date, (3) honeypot returning error, (4) `new Date(iso).getDay()` for rules, (5) hand-editing `BOOKABLE_SERVICES`, (6) adding `next-themes`/light mode, (7) raw palette classes, (8) committing `.env`/`db/*.db`/`worklog.md`, (9) reading Prisma in client components, (10) animation without `prefers-reduced-motion`.

---

## 10. Acceptance Criteria (Definition of Done for this PRD)

- [ ] `npm test` 49/49 × 3 TZ · `bun run e2e` 29/29 on standalone :3100 · `bun run lint` clean · `bunx tsc --noEmit` clean (src+e2e) · `bun run build` green with asset copy · `bun audit --prod` 0
- [ ] All 9 sections + 16 wcc components render per §3; dual pricing + image bands present; interactions per F1.8 verified by `agent-browser` + axe
- [ ] Full booking E2E persists + cleans SQLite truth; all F4.1–F4.7 API contracts pass (400/422/429/honeypot fake-201)
- [ ] Metadata + JSON-LD + robots/sitemap/icon correct; `DATABASE_URL` resolves to `db/custom.db` (`file:../db/custom.db` relative to `prisma/`)
- [ ] Docs (`AGENTS.md` / `CLAUDE.md` / `README.md` / `car-care_SKILL.md` / `PAD`) claim no drift vs `bun.lock` / `globals.css` / `content.ts`

