# We Care Car Care (car-care) — Master Project Architecture Document (PAD) v1.0.0

**Classification:** Internal Engineering Reference
**Status:** DEFINITIVE, PRODUCTION-LOCKED BLUEPRINT
**Companion Documents:** `README.md` (public-facing), `CLAUDE.md` (agent instructions), `AGENTS.md` (compact onboarding), `docs/prompt-to-create.md` (origin brief)
**Last Updated:** 2026-09-13
**Audience:** Senior Engineers, Tech Leads, DevOps, and Onboarding Engineers
**Rule:** Every architectural decision in this document traces to a specific rationale. Nothing is here "because it's popular."

---

#### Revision Block — v1.0.0 (Tracked Changes)

- `[SYN]` Initial PAD generated from full codebase analysis (all 15 site components, 3 API routes, Prisma schema, styling system, build scripts).
- `[SR]` All dependency versions pinned from `bun.lock`; all commands verified against `package.json` scripts.
- `[CA]` Known-issues table includes honest gaps (no automated tests, tracked SQLite file) rather than aspirational claims.

### Table of Contents

1. [System Overview & Decisions](#1-system-overview--decisions)
2. [High-Level System Topology](#2-high-level-system-topology)
3. [Application Architecture](#3-application-architecture)
4. [Data Architecture](#4-data-architecture)
5. [Design System Reference](#5-design-system-reference)
6. [Security Architecture](#6-security-architecture)
8. [Testing Strategy](#8-testing-strategy)
9. [Build & Deployment](#9-build--deployment)
10. [Developer Handbook](#10-developer-handbook)
11. [Known Issues & Outstanding Tasks](#11-known-issues--outstanding-tasks)
12. [Key Files Reference](#12-key-files-reference)
13. [Glossary](#13-glossary)

---

## 1. System Overview & Decisions

### 1.1 Document Metadata & Purpose

This is the single source of truth for how the car-care codebase is built, why it is built that way, and how to work in it safely. It targets three readers: a **new engineer** onboarding to extend the site, a **debugger** tracing a booking failure from browser to SQLite row, and a **reviewer** evaluating whether a technical choice should change. The site itself is a single-page marketing and booking funnel for a real detailing studio — content is fixed, the conversion goal is a phone call or a persisted booking request. There is no admin surface and no authenticated user; the owner actions leads out of the database directly. Everything downstream of that product shape (no auth stack, no CMS, SQLite over Postgres) follows from it.

### 1.2 Technology Stack Summary

| Layer | Technology | Version | Key Rationale |
|-------|-----------|---------|---------------|
| Web framework | Next.js (App Router) | 16.1.3 | Single route + route handlers in one deployable; RSC keeps the page light with client islands only where interactive |
| UI runtime | React | 19.2.3 | Required by Next 16; ref-prop components, no forwardRef boilerplate |
| Language | TypeScript | 5.9.3 | Content-as-data pattern (§3.3) only holds with strict typing |
| Styling | Tailwind CSS | 4.1.18 | CSS-first tokens colocate the brand system with its utilities |
| UI primitives | shadcn/ui (Radix) | 48 components vendored | Dialog/sheet/accordion/carousel for free; fully owned code |
| State | Zustand | 5.0.10 | 23-line dialog store beats Context boilerplate (ADR-004) |
| Validation | Zod | 4.3.5 | One schema per endpoint; server is the authority |
| ORM | Prisma | 6.19.2 | Typed models + `db:push` workflow fits single-file SQLite |
| Database | SQLite | (file: `db/custom.db`) | Zero-ops persistence for a single-operator local business |
| Animation | framer-motion | 12.26.2 | Testimonial/carousel motion primitives |
| Carousel | embla-carousel-react | 8.6.0 | Lightweight testimonial carousel |
| Toasts | sonner | 2.0.7 | Submit feedback in dialogs |
| Package manager / runtime | bun | 1.3.x | Install + dev + prod server in one toolchain |
| Lint | ESLint (flat config) | 9.39.2 | `next/core-web-vitals` + `next/typescript` presets |
| Proxy | Caddy | `:81` (sandbox) | Reverse proxy to Next standalone server on `:3000` |

### 1.3 Architecture Decision Records (ADRs)

**ADR-001: Single-page Next.js 16 App Router site with client-island dialogs**

- **Context:** The product is a local-service marketing funnel: one story, one conversion path (book or call). Content changes monthly at most. The build must remain fast to iterate and cheap to host.
- **Decision:** One route (`src/app/page.tsx`) composing nine server-rendered sections; the only `"use client"` islands are the booking dialog, question dialog, header (mobile sheet), before/after slider, and testimonial carousel. All form submission goes through JSON route handlers (`src/app/api/*/route.ts`).
- **Rationale:** A single RSC page ships minimal client JS; interactive complexity is isolated to two dialogs instead of spread across routes. Multi-page routing would add navigation overhead with zero SEO benefit for a one-location business already covered by JSON-LD.
- **Consequences:** Positive — tiny client bundle, trivial mental model, one page to test E2E. Negative — the page grows long (mitigated by section components); deep links only exist as `#anchors`.
- **Alternatives Rejected:** Separate `/booking` page (breaks the single CTA flow); a site builder / hosted CMS (not a code asset, no custom booking rules); SPA + separate API (two deployables for no gain).

**ADR-002: SQLite via Prisma with `db:push` (no migration files)**

- **Context:** Lead volume is dozens per week, single writer, single operator, no DB ops staff.
- **Decision:** Prisma 6 with `provider = "sqlite"`, database at `db/custom.db`, schema applied with `bun run db:push` (`--accept-data-loss` in the script). Two models: `Booking`, `Question`.
- **Rationale:** SQLite is a file — backup is `cp`, inspection is `prisma studio`, hosting needs no database service. For a schema this small (2 tables, 3 indexes) and a team of one, migration history is ceremony without payoff.
- **Consequences:** Positive — zero infra, atomic reads, perfect dev/prod parity. Negative — no concurrent multi-process writes (irrelevant at this scale); `db:push` can drop columns on schema change (acceptable — schema is stable and the DB holds transient leads).
- **Alternatives Rejected:** PostgreSQL (needs a service; wasted on this write volume); file-based JSON store (no query/index tooling); Drizzle (fine, but Prisma Studio + typed client fit the non-DBA operator better).

**ADR-003: Content as a typed data module (`content.ts`) instead of a CMS**

- **Context:** Every price, service feature, FAQ, service area, and business fact appears in multiple places: marketing sections, booking dialog, API validation, JSON-LD.
- **Decision:** `src/data/wcc/content.ts` exports typed constants (`PACKAGES`, `CERAMIC_TIERS`, `INTERIOR_ONLY`, `BOOKABLE_SERVICES`, `BUSINESS`, `FAQS`, …). Components render from it; the API validates `serviceKey` against `BOOKABLE_SERVICES` and prices quotes with the same `quoteFor()` the client uses for its live quote.
- **Rationale:** One edit site for all business facts eliminates the classic drift bug where the page says $295 and the API charges $240. TypeScript enforces the contract at compile time — a typo'd key is a type error, not a runtime surprise.
- **Consequences:** Positive — single source of truth, typed, diffable in git. Negative — content edits are code edits (fine for this team; would not scale to non-technical editors).
- **Alternatives Rejected:** CMS/headless (operational weight, no editors); per-component constants (drift); config file + runtime validation (weaker typing).

**ADR-004: Zustand for dialog orchestration over React Context or URL state**

- **Context:** Eleven CTAs across the page must open the booking dialog, several with a preselected service; the question dialog can open from hero and footer.
- **Decision:** A 23-line Zustand store (`src/lib/wcc/booking-store.ts`) holds `bookingOpen`, `presetService`, `questionOpen` plus open/close actions; any component subscribes with a selector.
- **Rationale:** No provider to mount, no re-render cascade (selector-based subscriptions), preset service flows through `openBooking(serviceKey?)` naturally. Context would require a provider wrapper and re-render every consumer on every open/close.
- **Consequences:** Positive — minimal API, works outside the React tree if needed. Negative — one more dependency; state is not visible in the URL (back button does not close the dialog — acceptable for this UX).
- **Alternatives Rejected:** React Context (provider + render cost for a global boolean); URL query state (pollutes anchors); lifting state to `page.tsx` (prop drilling).

**ADR-005: Bot defense without authentication — honeypot + in-memory sliding window**

- **Context:** Two public POST endpoints with no accounts. Real users must never see a captcha; abuse must not flood the owner's lead inbox.
- **Decision:** Each endpoint: (1) Zod validation, (2) hidden `company` honeypot field — non-empty returns a **fake `201`** and writes nothing, (3) per-IP sliding-window rate limit (5 requests / 10 minutes, in-memory `Map`), (4) business-rule checks, (5) persist.
- **Rationale:** Honeypot fake-success denies bots feedback; rate limiting caps blast radius from a single IP; Zod kills malformed payloads before they reach Prisma. No captcha preserves conversion.
- **Consequences:** Positive — zero friction, zero external services, cheap. Negative — limit resets on process restart and is per-instance (fine for one container); a distributed bot farm is out of scope for a local detailing shop.
- **Alternatives Rejected:** reCAPTCHA/hCaptcha (friction + third-party script + privacy); Turnstile (external dependency); DB-backed rate limiter (over-engineering); auth tokens (no user accounts exist).

**ADR-006: Standalone output served by bun behind Caddy**

- **Context:** The sandbox/host runs a Caddy edge on `:81` proxying to the app; the app must start fast with minimal node_modules surface.
- **Decision:** `next.config.ts` sets `output: "standalone"`; the `build` script copies `.next/static` and `public` into `.next/standalone/`; `start` runs `bun .next/standalone/server.js` with `NODE_ENV=production`.
- **Rationale:** Standalone output shrinks the deployable to a server.js + traced node_modules subset. Bun starts it faster than node with zero config. Caddy terminates the edge and forwards `X-Forwarded-For` (which the rate limiter keys on).
- **Consequences:** Positive — small artifact, one-command prod, no Docker needed. Negative — the static/public copy step is manual and easy to forget (documented as a troubleshooting item); dev (`next dev`) and prod (standalone) have slightly different module resolution.
- **Alternatives Rejected:** `next start` (needs full node_modules); Docker (no orchestrator here); Vercel (fine, but self-hosted bun is cheaper and matches the sandbox).

**ADR-007: Dark-first hardcoded theme, brand tokens in CSS `:root`**

- **Context:** The brand is automotive-detailing dark (charcoal + amber). A light mode was never requested and would double the QA surface.
- **Decision:** `<html className="dark" suppressHydrationWarning>` is hardcoded in `layout.tsx`; all colors are HSL/hex custom properties in `:root` (`globals.css`) mapped through Tailwind 4's `@theme inline`. No `next-themes` toggle is wired even though the package exists in `package.json`.
- **Rationale:** One theme, tested once. Tokens in CSS (not a JS config) keep Tailwind 4's CSS-first model authoritative — see Known Issues for the legacy `tailwind.config.ts` note.
- **Consequences:** Positive — zero flash-of-wrong-theme, one contrast surface to audit. Negative — adding light mode later requires tokenizing every custom hex.
- **Alternatives Rejected:** next-themes toggle (unwanted UX surface); styled-components/other-in-JS (Tailwind already present).

---

## 2. High-Level System Topology

```mermaid
flowchart TB
    subgraph Client
        B["Browser (desktop / mobile)"]
    end
    subgraph Edge
        C["Caddy :81 — reverse proxy<br/>forwards Host, X-Forwarded-For"]
    end
    subgraph App["Next.js 16 standalone server (bun, :3000)"]
        RSC["GET / — React Server Component page<br/>9 sections, SEO + JSON-LD"]
        API1["POST /api/bookings<br/>zod → honeypot → rate-limit → rules → create"]
        API2["POST /api/questions<br/>zod → honeypot → rate-limit → create"]
    end
    subgraph Data
        DB[("SQLite file — db/custom.db<br/>Booking (createdAt, date indexes)<br/>Question (createdAt index)")]
    end
    B --> C --> RSC
    B --> C --> API1
    B --> C --> API2
    API1 --> DB
    API2 --> DB
    API1 -. "operator reviews leads" .-> Studio["Prisma Studio (manual)"]
    API2 -. "operator reviews inquiries" .-> Studio
```

**Runtime and scaling notes.** The browser talks only to Caddy (`:81` in the sandbox; any TLS terminator in production) which proxies to the standalone Next server on `:3000`. The app is a single bun process — RSC rendering and both API handlers share it. All state lives in the SQLite file; the only in-process state is the rate-limit `Map`, which is deliberately ephemeral (ADR-005). Vertical capacity of this shape (one process, file DB, read-mostly page cached by the proxy) is far beyond the traffic of a single-location detailing business; the first scaling bottleneck would be concurrent writers to SQLite, which is a non-problem at lead volumes of dozens per week.

**Key constraints.** The rate limiter keys on the first `x-forwarded-for` hop — i.e., it trusts the proxy chain, which is valid behind this Caddy but would be spoofable if the app were exposed directly. Bookings are write-once; no update path exists yet (status stays `"pending"` until the owner works the lead out-of-band).

---

## 3. Application Architecture

### 3.1 The Layer Model

```
Layer 0: Content & Domain Data — src/data/wcc/content.ts, src/lib/wcc/booking.ts
         Pure typed constants and pure functions. No React, no I/O.
         Rule: if it is a business fact or a business rule, it lives here.

Layer 1: Persistence — prisma/schema.prisma, src/lib/db.ts
         Prisma client singleton. Only API routes touch this layer.
         Rule: components never import db; content never depends on it.

Layer 2: API Surface — src/app/api/{bookings,questions}/route.ts
         Request boundary: validate (zod), filter (honeypot, rate limit),
         enforce business rules, compute server-side truth (priceQuote),
         persist, respond. Rule: never trust Layer 3 state.

Layer 3: UI Components — src/components/wcc/*, src/components/ui/*
         Server components by default; "use client" islands for
         interactivity. Rule: render from Layer 0 exports only — no
         hardcoded business facts in JSX.

Layer 4: App Shell — src/app/layout.tsx, src/app/page.tsx
         Fonts, metadata, JSON-LD, Toaster; one page composing sections
         plus the two global dialogs. Rule: shell wires, sections render.
```

**The Golden Rule:** business facts flow **down** from `content.ts` (Layer 0) into everything else, and trust flows **up** — the API (Layer 2) re-derives anything a client sent (service existence, price, date rules) rather than believing it. The same `quoteFor()` produces the client's live quote and the server's persisted `priceQuote`, so the two can never disagree.

### 3.2 Annotated Directory Structure

```
car-care/
├── AGENTS.md / CLAUDE.md / README.md   ← agent + human onboarding docs
├── Project_Architecture_Document.md    ← this file
├── prisma/
│   └── schema.prisma                   ← Booking, Question models (Layer 1)
├── db/
│   └── custom.db                       ← SQLite file (tracked as empty preview DB)
├── public/
│   ├── images/                        ← 6 generated WebP assets (sharp-optimized)
│   ├── logo.svg                        ← WCC monogram mark
│   └── robots.txt
├── scripts/                            ← build-time asset helpers (not linted)
│   ├── gen-images.sh                   ← AI image generation batch
│   ├── optimize-images.mjs             ← sharp → WebP pipeline
│   └── vlm-check.mjs                   ← visual verification helper
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── bookings/route.ts       ← POST booking pipeline (Layer 2)
│   │   │   ├── questions/route.ts      ← POST inquiry pipeline (Layer 2)
│   │   │   └── route.ts                ← template hello-world (unused)
│   │   ├── globals.css                 ← Tailwind 4 tokens + brand utilities
│   │   ├── layout.tsx                  ← fonts, metadata, JSON-LD, Toaster
│   │   └── page.tsx                    ← the single page (Layer 4)
│   ├── components/
│   │   ├── wcc/                        ← 15 site sections & dialogs (Layer 3)
│   │   │   ├── site-header.tsx         ← sticky nav, mobile Sheet
│   │   │   ├── hero.tsx                ← image bg, stats band
│   │   │   ├── before-after.tsx        ← drag-compare slider (dirty-vision)
│   │   │   ├── packages.tsx            ← sedan/SUV price toggle
│   │   │   ├── ceramic-upsell.tsx      ← $200 add-on promo
│   │   │   ├── ceramic-tiers.tsx       ← 1/3/5-year tiers
│   │   │   ├── interior-only.tsx       ← interior service block
│   │   │   ├── testimonials.tsx        ← embla carousel
│   │   │   ├── faq.tsx                 ← accordion
│   │   │   ├── booking-dialog.tsx      ← 4-step flow (632 LOC, largest island)
│   │   │   ├── question-dialog.tsx     ← inquiry form
│   │   │   ├── reveal.tsx             ← IntersectionObserver wrapper
│   │   │   └── site-footer.tsx / difference.tsx / final-cta.tsx
│   │   └── ui/                         ← 48 vendored shadcn primitives
│   ├── data/wcc/content.ts             ← ALL business facts (Layer 0)
│   ├── hooks/                          ← use-mobile, use-toast
│   └── lib/
│       ├── wcc/booking.ts              ← findService, quoteFor, buildDayOptions
│       ├── wcc/booking-store.ts        ← zustand dialog store
│       ├── db.ts                        ← Prisma singleton
│       └── utils.ts                     ← cn()
├── docs/                               ← origin prompt, skill refs, SSH wrapper,
│                                       └   reference build archives (read-only)
├── Caddyfile                           ← sandbox edge proxy config
├── next.config.ts                      ← standalone output; ignoreBuildErrors
├── eslint.config.mjs                   ← flat config; sandbox dirs ignored
└── package.json / bun.lock / tsconfig.json
```

Directories **not** part of the shipped app: `foundation/` (cloned reference repo, gitignored), `upload/`, `tool-results/`, `skills/`, `download/` (sandbox-local), `examples/websocket/` and `tests/*.sh` (template scaffolding, tracked but inert).

### 3.3 Critical Code Patterns

**Pattern 1 — The form-endpoint pipeline (every POST route follows this exact order).**

```typescript
// src/app/api/bookings/route.ts (condensed; order is the contract)
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }                    // 1. parse — bad JSON ⇒ 400
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const parsed = bookingSchema.safeParse(body);           // 2. zod — shape ⇒ 422 + issues[]
  if (!parsed.success) { /* ...422 with issue map... */ }

  if (parsed.data.company) {                              // 3. honeypot — fake 201, NO row
    return NextResponse.json({ ok: true, confirmation: "WCC-000000" }, { status: 201 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) { /* ...429 with call-us message... */ }   // 4. rate limit

  // 5. business rules — server-side truth, never trust the client
  if (new Date(`${data.date}T00:00:00`).getDay() === 0) { /* ...422 Sunday closed... */ }
  if (data.serviceMode !== "shop" && !data.address) { /* ...422 address required... */ }

  const priceQuote = quoteFor(data.serviceKey, data.vehicleType, data.addOnCeramic); // 6. re-price

  const booking = await db.booking.create({ data: { /* ... */ } });  // 7. persist
  return NextResponse.json({ ok: true, confirmation: `WCC-${booking.id.slice(-6).toUpperCase()}`, priceQuote }, { status: 201 });
}
```

*Why this pattern:* the order is load-bearing. The honeypot runs **before** the rate limiter so bot traffic never consumes the limit that protects real users; business rules run **after** cheap filters so malformed input can never probe them; the price is computed **after** validation so `priceQuote` in the DB is always server-derived. The confirmation code is the tail of the Prisma cuid — unique, sortable by creation, and meaningless to bots.

**Pattern 2 — Reveal-on-intersect with a CSS reduced-motion contract.**

```tsx
// src/components/wcc/reveal.tsx — children animate in once, then the observer detaches
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }  // fire once
    }
  },
  { rootMargin: "0px 0px -10% 0px" },  // trigger slightly below the fold
);
```

```css
/* src/app/globals.css — the motion system is a pair: JS toggles state, CSS owns transition */
[data-reveal] { transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
@media (prefers-reduced-motion: reduce) {
  [data-reveal] { transition: none !important; opacity: 1 !important; transform: none !important; }
}
```

*Why this pattern:* splitting state (JS) from motion (CSS) means reduced-motion support lives in one stylesheet and covers the `.shine` sweep too — no component has to know about accessibility mode, and the observer self-destructs so a long page carries no ongoing callbacks.

**Pattern 3 — Before/after "dirty-vision" filter (one asset, two worlds).**

```tsx
// src/components/wcc/before-after.tsx — "before" is the SAME photo behind a CSS filter
/**
 * The "before" layer is the same photo as "after", run through a dirty-vision
 * CSS filter (dust, dullness, streaks) so both halves align pixel-perfectly —
 * the same trick used for real transformation shots.
 */
```

*Why this pattern:* real before/after photo pairs never align, which reads as fake even when genuine. Deriving the "before" half from the "after" image via CSS guarantees pixel-perfect registration, halves the image payload (one WebP per scene), and keeps the interaction a pure clip-path/width computation driven by pointer capture.

**Pattern 4 — Single pricing function, two consumers.**

```typescript
// src/lib/wcc/booking.ts — the ONLY place a price is computed
export function quoteFor(key: string, vehicle: VehicleType, addOnCeramic: boolean): number | null {
  const svc = findService(key);
  if (!svc) return null;
  const base = svc.prices[vehicle];                        // sedan | suv from content.ts
  const addOn = addOnCeramic && svc.allowCeramicAddOn ? 200 : 0;  // ceramic tiers can't double up
  return base + addOn;
}
```

*Why this pattern:* the booking dialog calls `quoteFor` for its live total (step 1) and the API calls the same function before persisting (step 6 of Pattern 1). One function means the displayed quote and the stored quote are identical by construction — the drift bug class is structurally impossible. The `allowCeramicAddOn` guard encodes the business rule that a ceramic tier must not add another ceramic layer.

---

## 4. Data Architecture

### 4.1 Database Schema

```mermaid
erDiagram
    BOOKING {
        string id PK "cuid()"
        string serviceKey "premium-full | ceramic-3yr | ..."
        string serviceName "denormalized display name"
        string vehicleType "sedan | suv"
        string serviceMode "mobile | shop | pickup"
        string date "YYYY-MM-DD (not DateTime)"
        string time "08:00 AM .. 03:30 PM labels"
        string name
        string phone
        string email
        string address "NULL for shop mode"
        string city
        string notes "free text, 1000 max"
        int    priceQuote "server-computed USD"
        bool   addOnCeramic "false default"
        string status "pending default"
        datetime createdAt
        datetime updatedAt
    }
    QUESTION {
        string id PK "cuid()"
        string name
        string email
        string phone "optional"
        string question "10-2000 chars"
        datetime createdAt
    }
```

```prisma
model Booking {
  id           String   @id @default(cuid())
  serviceKey   String
  serviceName  String
  vehicleType  String
  serviceMode  String
  date         String   // ISO date "YYYY-MM-DD"
  time         String
  name         String
  phone        String
  email        String
  address      String?
  city         String?
  notes        String?
  priceQuote   Int?
  addOnCeramic Boolean  @default(false)
  status       String   @default("pending")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([createdAt])
  @@index([date])
}

model Question {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String?
  question  String
  createdAt DateTime @default(now())

  @@index([createdAt])
}
```

### 4.2 Data Models

`Booking` denormalizes `serviceName` alongside `serviceKey` deliberately: `content.ts` may rename a service between submission and the owner reading the lead, and the submitted quote must show the name the customer saw. `priceQuote` is `Int?` USD — nullable only as a defensive default; the pipeline always sets it before insert. `date`/`time` are strings, not DateTime, because they are **slot labels** ("08:00 AM") on a shop calendar, not instants — no timezone conversion is ever correct for them. `status` exists as a future-proofing column; the current product has no state machine (see Known Issues).

### 4.3 Persistence Strategy

- **Connection model:** one Prisma client per process via the `globalThis` singleton in `src/lib/db.ts` (prevents connection exhaustion during dev hot reload). SQLite needs no pooling; Prisma's query logging is enabled only outside production.
- **Migrations:** none — `bun run db:push` applies the schema directly (`--accept-data-loss` included in the script). Schema changes are rare, additive, and the data is transient leads.
- **Backups:** the database is a single file — `cp db/custom.db backup/` is the whole procedure. The tracked `db/custom.db` in git is an **empty preview seed** (0 rows in both tables); production lead data must never be committed (see §11).
- **Query paths:** every read is by index — `createdAt` for chronological lead listing, `date` for day-scoped lookups. There is no update/delete path in the app; the owner triages via Prisma Studio.

---

## 5. Design System Reference

### 5.1 Typographic System

| Role | Typeface | Weights | Usage |
|------|----------|---------|-------|
| Display | Oswald (`--font-oswald`, `.font-display` class) | 400/500/600/700 | Headings, section titles, stat numbers — always uppercase with tightened tracking for the automotive identity |
| Body | Archivo (`--font-archivo`, Tailwind `font-sans`) | 400/500/600/700 | Paragraphs, form labels, buttons, nav |

Both load through `next/font/google` with `subsets: ["latin"]` and land as CSS variables consumed by `@theme inline` — zero layout shift from font swap. Archivo's stylistic set 1 (`ss01`) is enabled globally for its straight-legged lowercase.

### 5.2 Color Tokens

| Token | Hex | Usage | Contrast vs background |
|-------|-----|-------|----------------------|
| `--background` | `#0a0b0d` | Page canvas (warm charcoal) | — |
| `--foreground` | `#f2f0ea` | Body text | 17.3:1 (AAA) |
| `--primary` | `#f2a61c` | CTAs, links, focus rings, highlights (signal amber) | 9.6:1 (AAA) |
| `--primary-foreground` | `#17120a` | Text on amber buttons | 9.1:1 on primary (AAA) |
| `--card` | `#121417` | Card surfaces | — |
| `--secondary` | `#1a1d21` | Secondary surfaces, chips | — |
| `--muted-foreground` | `#9c9a92` | Secondary text, captions | 7.0:1 (AAA) |
| `--destructive` | `#e5484d` | Errors, destructive actions | 5.0:1 (AA) |
| `--border` | `rgba(255,255,255,0.09)` | Hairline borders | — |
| `--ring` | `#f2a61c` | Focus outlines | — |

Contrast ratios computed for text tokens against `--background`. The entire interactive surface passes WCAG AA at minimum; the two text/amber pairs pass AAA. The palette is deliberately narrow — one accent (amber), one warm-neutral ramp (charcoal → off-white), one semantic red.

### 5.3 Component Primitives

- **shadcn/ui (48 components)** vendored under `src/components/ui/` — Radix behavior + Tailwind styling, fully owned code. Site usage: `dialog`, `sheet`, `accordion`, `carousel` (embla), `button`, `input`, `label`, `textarea` are load-bearing; the rest are template inventory for future screens.
- **Variant styling** via `class-variance-authority`; class merging via `cn()` (clsx + tailwind-merge) in `src/lib/utils.ts`.
- **Brand utilities in CSS, not components:** `.font-display`, `.grain` (film-grain SVG-noise overlay), `.shine` (amber CTA sweep), `[data-reveal]` (scroll-in), custom thin scrollbars. These are the house style — extend the stylesheet before adding a component.

### 5.4 Motion / Animation

| Name | Trigger | Behavior | Reduced-motion |
|------|---------|----------|----------------|
| `data-reveal` | IntersectionObserver (−10% bottom margin, fires once) | opacity 0→1, translateY 6px (text) / 8px + scale 0.98 (card), 0.5s ease-out, optional per-item delay | Disabled in CSS (`transition: none`, final state forced) |
| `.shine` | CTA hover | skewed white gradient sweeps left → right over 0.6s | Hidden (`display: none`) |
| Carousel | Autoplay/controls (embla) | Testimonial slides | Handled by embla + reduced CSS |
| `scroll-behavior: smooth` | Anchor nav | Eased scrolling with `scroll-padding-top: 5.5rem` (sticky-header offset) | Reverted to `auto` |

Framer-motion 12 is a dependency and powers carousel-adjacent transitions; the reveal/shine system is dependency-free CSS by design.

---

## 6. Security Architecture

### 6.1 Security Rules

| # | Rule | Enforcement |
|---|------|-------------|
| S1 | Every API payload is Zod-validated before any other logic | `bookingSchema` / `questionSchema` `safeParse`, `422` + issue map on failure — `src/app/api/*/route.ts` |
| S2 | Bot submissions receive fake success and write nothing | `company` honeypot field; non-empty ⇒ `201 {ok:true}` with no DB call |
| S3 | Per-IP request rate ≤ 5 per 10-minute sliding window per endpoint | In-memory `Map<string, number[]>` filter; `429` with call-the-shop fallback |
| S4 | Business rules re-checked server-side (Sunday closed, address for mobile/pickup, date ≤ 60 days, service key known) | Route handler logic after validation — client checks are UX only |
| S5 | Prices are computed only by `quoteFor()` on the server before persisting | Pattern 4 (§3.3); client quote is advisory |
| S6 | No secrets in client code; the only env var is `DATABASE_URL` | `.env` gitignored; `.env*` in `.gitignore`; no keys in `content.ts` |
| S7 | No `dangerouslySetInnerHTML` with user input | The single use is the constant JSON-LD block in `layout.tsx` (static object, no user data) |
| S8 | SQL only through Prisma parameterized queries | No raw queries anywhere in `src/` |

### 6.2 Security Utilities

- `src/app/api/bookings/route.ts` — `rateLimited()`, honeypot check, `isoDate` refinement (format + real-date + ≤60-day window), full booking schema.
- `src/app/api/questions/route.ts` — same rate-limit pattern, honeypot, phone regex, length bounds.
- `.gitignore` — excludes `.env*`, `upload/`, `tool-results/`, `foundation/`, `skills/`, `worklog.md`, `download/*` (sandbox artifacts that must never ship).

### 6.3 Authentication & Authorization

**There is none, by design** (ADR-005). No sessions, no tokens, no accounts. Both endpoints are public POST surfaces. The compensating controls are S1–S5. Operator access to leads is out-of-band (Prisma Studio on the server, or the SQLite file directly). If an admin route is ever added, it must introduce its own auth layer — nothing in the current codebase assumes one.

### 6.4 Threat Model

| Vector | Likelihood | Impact | Mitigation in place |
|--------|-----------|--------|--------------------|
| Form spam bots | High | Owner inbox noise | Honeypot fake-success (S2), Zod field bounds, rate limit (S3) |
| Credential-stuffing / auth attacks | N/A | — | No auth surface exists to attack |
| PII exposure (name/phone/email/address at rest) | Low-Med if repo leaks | Customer trust | DB file is server-side; `db/custom.db` in git is an **empty** seed; `.env` never committed; see §11 for the production-data caveat |
| XSS via booking fields | Low | Page integrity | React auto-escaping; fields rendered as text only; no HTML accepted |
| SQL injection | Very Low | Data integrity | Prisma parameterization (S8) |
| Rate-limit evasion (spoofed XFF) | Low | Spam volume behind proxy | Caddy overwrites `X-Forwarded-For` (`header_up … {remote_host}` chain); direct exposure of `:3000` would make the key spoofable — keep the proxy in front |
| Resource exhaustion (huge payloads) | Low | Availability | Zod `max()` on every string (notes ≤1000, question ≤2000) rejects oversized bodies early |

---

## 8. Testing Strategy

### 8.1 Test Distribution

| Category | Files | Automated tests | Location | Framework |
|----------|-------|----------------|----------|-----------|
| Unit (booking logic) | 0 | 0 | — | none configured |
| Component (dialog flows) | 0 | 0 | — | none configured |
| API integration | 0 | 0 | — | none configured |
| E2E | 0 | 0 | — | none configured |
| Manual verification protocol | 1 (this doc, §8.2) | — | — | lint + tsc + curl + browser |

**Honest status:** the repo has **no automated test suite** — no jest/vitest/playwright config exists. `tests/*.sh` are sandbox build scripts, not tests. The verification burden is carried by the protocol below; introducing vitest for `booking.ts`/`content.ts` purity would be the highest-leverage first investment (§11).

### 8.2 Verification Protocol (the current "test suite")

1. **Static:** `bun run lint` (ESLint 9 flat config) and `bunx tsc --noEmit` — the typecheck is manual and **mandatory** because `next.config.ts` sets `typescript.ignoreBuildErrors: true`.
2. **Build:** `bun run build` must complete including the standalone copy step.
3. **API contract (curl):** happy path → `201` with `confirmation` matching `^WCC-[A-Z0-9]{6}$` and a row in `db.booking`; Sunday date → `422`; `serviceMode: "mobile"` without address → `422`; unknown `serviceKey` → `422`; non-empty `company` → fake `201` and **no row**; 6th rapid POST → `429`.
4. **E2E in browser:** `/` renders; sedan/SUV toggle reprices; full 4-step dialog submits and shows the confirmation; question dialog persists; mobile viewport (375px) shows the sheet nav.
5. **Cleanup:** delete test rows via `bunx prisma studio` — the tracked `db/custom.db` must ship empty.

### 8.3 Coverage Thresholds

None configured (no coverage tooling). The de facto gate is §8.2 executed before every push to `main`.

### 8.4 Pre-Deploy Checklist

- [ ] `bun run lint` clean
- [ ] `bunx tsc --noEmit` clean (build will not catch type errors)
- [ ] `bun run build` succeeds (including static/public copy into `.next/standalone/`)
- [ ] Manual booking E2E passed, confirmation code received
- [ ] Honeypot returns fake `201`, zero rows written
- [ ] Test rows removed from `db/custom.db`
- [ ] No changes to `.env`, keys, or `upload/` staged for commit
- [ ] `git status` clean; pushed to `origin/main`

---

## 9. Build & Deployment

### 9.1 Production Build

```bash
bun run build
# = next build  &&  cp -r .next/static .next/standalone/.next/  &&  cp -r public .next/standalone/
bun run start
# = NODE_ENV=production bun .next/standalone/server.js   (logs tee'd to server.log)
```

The copy steps are **part of the product**, not conveniences: `output: "standalone"` traces a minimal server but does not inline static assets or `public/`; running `server.js` without them serves a broken page. Always use the npm scripts, never raw `next build` + `node .next/standalone/server.js`.

### 9.2 Environment Variables

| Name | Required | Description | Default |
|------|----------|-------------|---------|
| `DATABASE_URL` | Yes | SQLite URL for Prisma; path relative to `prisma/`. `file:../db/custom.db` resolves to `<repo>/db/custom.db` | none — set in `.env` (gitignored) |

That is the complete list. There are no third-party API keys, auth secrets, or feature flags.

### 9.3 Docker Configuration

None. The deployment unit is the bun process plus `.next/standalone/` plus `db/` behind Caddy (sandbox config in `Caddyfile`, `:81` → `localhost:3000`). Containerizing would mean copying those three paths — no Dockerfile is present and none is needed for the current host.

### 9.4 CI/CD Pipeline

None configured. Pushes go to `origin/main` on GitHub (from this environment, via the Paramiko SSH wrapper `docs/ssh_git_wrapper_v3.py`, since no `openssh-client` exists in the sandbox). The quality gate is §8.4 executed manually. A minimal GitHub Actions workflow (lint + tsc + build) is the natural first CI addition.

---

## 10. Developer Handbook

### 10.1 Local Setup

```bash
bun install                                       # bun ≥ 1.3 (Node 24 present as fallback)
echo 'DATABASE_URL="file:../db/custom.db"' > .env  # the only env var (relative paths resolve from prisma/)
bun run db:generate                              # Prisma client into node_modules
bun run db:push                                  # apply schema to db/custom.db
bun run dev                                       # http://localhost:3000 (dev.log)
```

Optional inspection: `bunx prisma studio` (browse Booking/Question rows at `http://localhost:5555`).

### 10.2 Common Commands

| Command | Location | Purpose |
|---------|----------|---------|
| `bun run dev` | package.json | Dev server :3000, tee to `dev.log` |
| `bun run build` | package.json | Standalone build + asset copy |
| `bun run start` | package.json | Prod server via bun, tee to `server.log` |
| `bun run lint` | package.json | ESLint 9 |
| `bunx tsc --noEmit` | ad hoc | Type check — mandatory manual gate |
| `bun run db:push` / `db:generate` / `db:migrate` / `db:reset` | package.json | Prisma lifecycle (`push` accepts data loss) |
| `GIT_SSH_COMMAND="docs/ssh_git_wrapper_v3.py -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=accept-new" git push origin main` | sandbox | Push without openssh (see `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`) |

### 10.3 Code Style Rules

- **Mechanisms, not opinions:** ESLint flat config extends `next/core-web-vitals` + `next/typescript` (many template rules are off — see `eslint.config.mjs`); TypeScript `@/* → src/*` alias; Prettier is not configured — match surrounding formatting.
- **House conventions:** named function exports for components (`export function Hero()`); content edits go in `content.ts` with `satisfies`/`as const` typing; API routes follow Pattern 1 ordering exactly; comments explain *why* (see `reveal.tsx`, `before-after.tsx` for the bar).
- **Ignored trees:** `foundation/**`, `scripts/**`, `examples/**`, `skills` are excluded from lint — never import from them into `src/`.

### 10.4 Git Workflow

- Single branch: `main`. Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Atomic commits — one logical change each.
- **Never commit:** `.env`, SSH keys, `worklog.md`, anything under `upload/`, `tool-results/`, `foundation/`, `skills/`, or real lead data in `db/custom.db` (all already gitignored except the DB — see §11).
- History includes a merge of the repo's original uploaded reference materials (`docs/` carries them); treat those files as read-only provenance.

---

## 11. Known Issues & Outstanding Tasks

| Priority | Issue | Impact | Status |
|----------|-------|--------|--------|
| MEDIUM | `db/custom.db` is tracked while also being the runtime DB — real production leads could be committed/pushed accidentally | Customer PII in git history | Open — recommended: untrack the file and `.gitignore` it for production checkouts (dev seed can be regenerated via `db:push`) |
| MEDIUM | No automated test suite (0 unit/integration/E2E tests) | Regressions in booking logic ship undetected | Open — first target: vitest on `src/lib/wcc/booking.ts` (pure functions, zero mocking needed) |
| LOW | In-memory rate limit resets on restart and is not shared across instances | Temporary spam window after deploys | Accepted (ADR-005) at this scale |
| LOW | `typescript.ignoreBuildErrors: true` and `reactStrictMode: false` in `next.config.ts` (template defaults) | Type errors surface only via manual `tsc --noEmit` | Open — flip on once the codebase passes cleanly and CI exists |
| LOW | `package.json` carries unused template dependencies (`next-auth`, `next-intl`, `recharts`, `@mdxeditor/editor`, `@tanstack/*`, …) | Install weight, audit surface, reader confusion | Open — prune when a dependency audit is done |
| LOW | Legacy `tailwind.config.ts` coexists with Tailwind 4 CSS-first tokens | Contributor confusion about the token source of truth | Accepted — CSS is authoritative (ADR-007); config is inert scaffold |
| LOW | `src/app/api/route.ts` is an unused hello-world handler | Dead code, misleading API surface | Open — safe to delete |
| INFO | No admin/lead-management surface; `Booking.status` stays `"pending"` forever | Owner triages via Prisma Studio (by design for now) | Accepted — roadmap candidate |
| INFO | Rate limiter trusts the `X-Forwarded-For` chain | Fine behind Caddy; spoofable if `:3000` were exposed directly | Accepted — keep the proxy in front |

---

## 12. Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/wcc/booking-dialog.tsx` | 632 | 4-step booking flow — the largest interactive island; live quote, per-step validation, submit + confirmation states |
| `src/data/wcc/content.ts` | 357 | **The single source of truth** — services, prices, areas, FAQs, testimonials, business facts, `BOOKABLE_SERVICES` derivation |
| `src/app/globals.css` | 175 | Tailwind 4 `@theme inline` tokens, brand palette, `.grain`/`.shine`/`[data-reveal]` utilities, reduced-motion contract |
| `src/components/wcc/question-dialog.tsx` | 169 | Inquiry dialog — zod-mirrored client checks, honeypot field |
| `src/components/wcc/before-after.tsx` | 166 | Drag-compare slider — pointer capture, dirty-vision filter (Pattern 3) |
| `src/components/wcc/site-header.tsx` | 154 | Sticky header, anchor nav, mobile Sheet, phone CTA |
| `src/components/wcc/packages.tsx` | 148 | Essential/Premium cards with sedan/SUV price toggle |
| `src/components/wcc/ceramic-tiers.tsx` | 148 | 1/3/5-year ceramic tier cards |
| `src/app/api/bookings/route.ts` | 141 | Booking POST pipeline (Pattern 1) — zod, honeypot, rate limit, rules, persist |
| `src/components/wcc/hero.tsx` | 115 | Hero with image background, stats band, dual CTAs |
| `src/components/wcc/site-footer.tsx` | 114 | Footer — contact, hours, service areas, nav |
| `src/app/layout.tsx` | 110 | Fonts, full metadata, OG/Twitter, JSON-LD `AutoWash` schema, Toaster |
| `src/components/wcc/difference.tsx` | 112 | "Why we're different" section w/ before-after sliders |
| `src/components/wcc/ceramic-upsell.tsx` | 106 | $200 ceramic add-on promo block |
| `src/app/api/questions/route.ts` | 81 | Question POST pipeline (same pattern) |
| `src/components/wcc/testimonials.tsx` | 79 | Embla carousel of reviews |
| `src/lib/wcc/booking.ts` | 69 | `findService`, `quoteFor`, `buildDayOptions`, `usd` — pure domain logic |
| `src/lib/wcc/booking-store.ts` | 23 | Zustand dialog store (ADR-004) |
| `prisma/schema.prisma` | 45 | Booking + Question models, indexes |
| `src/lib/db.ts` | 12 | Prisma singleton |
| `src/app/page.tsx` | 35 | The single page — section composition |

---

## 13. Glossary

| Term | Meaning |
|------|---------|
| **WCC** | We Care Car Care — the Framingham, MA detailing studio this site serves |
| **Ceramic coating** | Multi-year liquid polymer paint protection; sold here as 1/3/5-year tiers |
| **MetroWest** | Boston's western suburbs — the 13-town service area around Framingham |
| **Dirty-vision filter** | House term for the CSS filter that derives the "before" half of a comparison slider from the "after" photo |
| **Honeypot** | Hidden `company` form field; bots that fill it get a fake `201` and nothing is persisted |
| **Sliding-window rate limit** | Keeps timestamps of last N requests per key; rejects when 5 fall inside 10 minutes |
| **RSC** | React Server Components — default rendering mode; `"use client"` marks interactive islands |
| **Standalone output** | `next build` mode producing `.next/standalone/server.js` + traced deps, runnable without full `node_modules` |
| **`db:push`** | Prisma command that applies `schema.prisma` directly to the database, bypassing migration files |
| **shadcn/ui** | Vendored (copied-in, not npm-installed) Radix-based component library under `src/components/ui/` |
| **Embla** | Dependency-light carousel library behind the testimonials slider |
| **Booking confirmation code** | `WCC-` + last 6 chars of the Prisma cuid — shown to the customer, sortable by creation |
