# Visual/UX Audit + Code Review — Remediation Plan (2026-09)

Audit performed against the source site `https://wecarecarcare.com/` using
agent-browser (desktop 1440×900, mobile 390×844) with VLM-assisted section
comparisons, plus a tiered code review (lint, typecheck, dependency/security
audit, 12-category manual review) per the `code-review-and-audit` skill.

---

## Part 1 — Visual / UI-UX / Animation Audit Findings

### 1.1 Verified working (no action needed)

| Area | Evidence |
|------|----------|
| Scroll-reveal animations | IntersectionObserver flips `translate-y-6 opacity-0` → `translate-y-0 opacity-100` (28 reveal wrappers verified in DOM) |
| Before/after drag sliders | Pointer drag moves divider (aria-valuenow 50 → 79); keyboard arrows work; `role="slider"` + labels |
| Testimonial carousel | Embla next/prev advance visible cards; Google 5.0 rating header present |
| FAQ accordion | 9 items, `aria-expanded` toggles, panel animates open |
| CTA shine sweep | `::before` sweep verified via computed styles (`left` transitions −80% → 130%); disabled under `prefers-reduced-motion` |
| Booking dialog (4 steps) | E2E submission → confirmation code → DB row (test row cleaned after) |
| Mobile nav Sheet | Hamburger opens labeled nav with phone + CTA |
| Sticky header | Present; `Book Your Detail` always reachable |

### 1.2 Defects and fidelity gaps (ranked by impact)

| ID | Severity | Finding |
|----|----------|---------|
| D1 | 🔴 Defect | Testimonial carousel arrows render **on top of card text** (left arrow covered the word "dealer's"); also caused a click-interception error during testing. Arrows sit inside the card row (`left-1`/`right-1`). |
| V1 | 🟠 High | **Missing teal/cyan secondary accent.** Source uses a two-tone system (amber CTAs + teal keyword highlights: "Ever", "Interior", "Questions"). Rebuild is amber-only. |
| V2 | 🟠 High | **Pricing display hides SUV price.** Source stacks both prices (Sedan + SUV) inside each card; rebuild gates SUV behind a global toggle. Source also tops cards with vehicle imagery. |
| V3 | 🟠 High | **Booking dialog step 1 shows bare rows** (name/duration/price) — no included-features summary, no "Most Popular"/"Featured" badge on Premium (source: "Featured Package"). |
| V4 | 🟠 High | **Final CTA is plain** — source uses a full-bleed background image + 5-star rating + 2 clear buttons; rebuild is a flat card with 3 stacked options. |
| V5 | 🟠 Med | **FAQ styling** — source: dark rounded cards, sentence case, large teal "Questions" heading; rebuild: divider list, ALL CAPS triggers, no teal. |
| V6 | 🟠 Med | **Hero differences** — source: eyebrow label, single CTA + phone, interior shot, heavier overlay; rebuild: rating badge, 3 CTAs, lighter overlay on exterior shot (slightly lower text contrast). |
| V7 | 🟡 Low-Med | No floating help affordance — source ships a persistent chat bubble ("Questions? Talk to Us Live!") and a mobile phone FAB. |
| V8 | 🟡 Low | Logo/nav labels differ from source (line-art car + About/Gallery vs amber "W" + different anchors). Functional labels; acceptable, but hero eyebrow + accent words should align. |
| V9 | 🟡 Low | "Smart Add-On" button on package cards duplicates Book Now behavior — should preselect the ceramic add-on in the dialog. |

**Kept intentionally (documented decisions):** original descriptive copy (not verbatim); before/after uses one photo + CSS "dirty-vision" filter instead of separate before photos; booking as a 4-step dialog (vs source's long form page) with service → date → contact → confirm order; testimonials as carousel + aggregate Google rating (source: static 6-grid). These remain deliberate divergences, not defects.

---

## Part 2 — Code Review Findings

### 2.1 Security (bun audit: 90 vulns — 3 critical, 48 high, 34 moderate, 5 low)

| ID | Severity | Finding |
|----|----------|---------|
| S1 | 🔴 High | `next@16.1.3` is in the affected range `>=16.0.0 <16.2.5` (Middleware/Proxy bypass GHSA-26hh-7cqf-hhc6, Server Components DoS GHSA-8h8q-6873-q5fj, AVIF RCE GHSA-2xp9-vwfh-vxw4). Fix: upgrade to 16.3.5 (latest stable 16.x). |
| S2 | 🔴 High | `next-auth` has a CRITICAL advisory (homoglyph bypass GHSA-7rqj-j65f-68wh) + HIGH (getToken throw). App has **zero imports** → remove dependency entirely. |
| S3 | 🟠 Med | ~28 unused template dependencies (`@dnd-kit/*`, `@mdxeditor/editor`, `framer-motion`, `recharts`, `uuid`, `socket.io` chain, etc.) dragging vulnerable transitive chains. Remove with their unused `ui/` components. |

### 2.2 Correctness / quality

| ID | Severity | Finding |
|----|----------|---------|
| C1 | 🟠 Med | `tsc --noEmit` fails: tsconfig `include: ["**/*.ts", ...]` picks up untracked `foundation/`, `examples/`, `skills/` (135 errors). Masked in builds by `typescript.ignoreBuildErrors: true` in `next.config.ts`. |
| C2 | 🟠 Med | `db/custom.db` is **tracked in git** (PII risk + repo bloat). Untrack + ignore. |
| C3 | 🟠 Med | **Timezone-unsafe Sunday rule** — server checks `new Date(date + "T00:00:00").getDay()` in server-local time; a UTC host shifts the boundary hours away from the business timezone (America/New_York). Same risk in the 60-day window check. |
| C4 | 🟠 Med | `src/lib/db.ts` enables `log: ['query']` **unconditionally** — noisy in production and logs customer PII. Make it dev-only. |
| C5 | 🟠 Med | **No test suite** (zero tests). User requires TDD remediation: add Vitest + unit/integration tests for pricing/date logic, validation schemas, and API route rules. |
| C6 | 🟡 Low | Rate-limiter `hits` Map never prunes stale IP entries (slow memory growth); logic duplicated across both API routes. Extract shared module + prune. |
| C7 | 🟡 Low | Missing favicon/app icon (404 on every visit); no `sitemap.ts` (single-page site, minor). |
| C8 | 🟡 Low | `difference.tsx` `<img>` lacks `loading="lazy"` (below-fold); other `<img>` usages are fine (hero uses `fetchPriority="high"`). |
| C9 | 🟡 Low | `tsconfig.json` sets `noImplicitAny: false` (weaker strictness). |
| C10 | 🟡 Low | No double-booking/capacity check on slots (`slots: 6` placeholder). Out of scope — documented as future work. |
| C11 | 🟠 Med | **Broken toast wiring** — `booking-dialog` calls sonner `toast.success()`, but `layout.tsx` mounts the radix `Toaster` (ui/toaster.tsx); sonner's `Toaster` is never mounted → the booking success toast **never renders**. Fix: mount sonner Toaster, drop radix toast files + `@radix-ui/react-toast`. |

### 2.3 Passed checks

ESLint clean; app `src/` typechecks clean; honeypot fake-success; sliding-window rate limit; zod validation on both routes; Sunday + address rules enforced server-side; strong ARIA coverage (slider/radiogroup/dialog/alert); no secrets tracked (`.env` ignored); JSON-LD `AutoWash` schema + OG/Twitter metadata; standalone build output; browser console free of page errors.

---

## Part 3 — Remediation Plan (TDD)

Dependency order: tooling first, then pure-logic modules (test-first), then config/hygiene, then UI, then docs. Every task leaves `lint`/`tsc`/`test` green (checkpoint gates).

### Phase A — Test tooling (foundation for TDD)

- [x] **Task A1: Add Vitest + test scripts.**
  Install `vitest` (dev). Add `npm test` / `npm run test:watch`. Config: node environment for lib tests, jsdom not required (no component tests in this pass — behavior-level coverage only).
  **Acceptance:** `npm test` runs and passes with one smoke test; `vitest.config.ts` excludes `foundation/`, `examples/`, `skills/`, `node_modules/`.
  **Verification:** `npm test` exit 0. **Files:** `vitest.config.ts`, `package.json`. **Deps:** none. **Size:** S.

### Phase B — Pure logic, test-first (RED → GREEN → REFACTOR)

- [x] **Task B1: Shared rate limiter module.**
  RED: write failing tests for a new `src/lib/wcc/rate-limit.ts` (window 10 min, max 5, prune-on-read, map cleanup when empty). GREEN: implement. REFACTOR: replace the two inline copies in `api/bookings` + `api/questions` with the module.
  **Acceptance:** both routes use the shared module; tests cover allow/deny boundary (5th vs 6th), window expiry, prune.
  **Verification:** `npm test`; `rg "WINDOW_MS" src/` only matches the module. **Files:** `src/lib/wcc/rate-limit.ts`, `src/lib/wcc/__tests__/rate-limit.test.ts`, both `route.ts`. **Deps:** A1. **Size:** M.

- [x] **Task B2: Timezone-safe date rules.**
  RED: failing tests for `isSunday(iso)` and `isWithinBookingWindow(iso, todayIso)` computed from the ISO string itself (UTC day-of-week), independent of host TZ. GREEN: implement `src/lib/wcc/dates.ts`. REFACTOR: use in `api/bookings` (Sunday rule + 60-day window).
  **Acceptance:** Sunday rejected regardless of host timezone (test with `TZ=UTC` and `TZ=America/New_York`); dates >60 days out rejected; today accepted.
  **Verification:** `npm test`. **Files:** `src/lib/wcc/dates.ts`, `src/lib/wcc/__tests__/dates.test.ts`, `api/bookings/route.ts`. **Deps:** A1. **Size:** M.

- [x] **Task B3: Booking lib coverage (existing behavior locked by tests).**
  Tests for `quoteFor` (base, add-on only when allowed, unknown key), `buildDayOptions` (14 days, Sunday closed, ISO format, month/weekday labels), `findService`, `usd`. No behavior change expected — locks current logic for the refactor phases.
  **Acceptance:** all green; edge cases (unknown key → null, add-on on ceramic tier ignored) covered.
  **Verification:** `npm test`. **Files:** `src/lib/wcc/__tests__/booking.test.ts`. **Deps:** A1. **Size:** S.

- [x] **Task B4: API validation schemas extracted + tested.**
  Extract the two zod schemas to `src/lib/wcc/schemas.ts` (bookings + questions) with tests: valid payload passes; bad phone/email rejected; unknown service rejected; honeypot field optional. Routes import from the module (single source of truth client/server).
  **Acceptance:** schemas imported by routes; tests cover accept/reject matrix.
  **Verification:** `npm test`; `npx tsc --noEmit` clean. **Files:** `src/lib/wcc/schemas.ts`, `src/lib/wcc/__tests__/schemas.test.ts`, both `route.ts`. **Deps:** B1, B2. **Size:** M.

- [x] **Task B5: Dialog store supports ceramic preselect.**
  RED: failing test — `openBooking("premium-full", { addOnCeramic: true })` sets `presetAddOnCeramic`. GREEN: extend zustand store (backward-compatible optional arg). Consumed in Task E4.
  **Verification:** `npm test`. **Files:** `src/lib/wcc/booking-store.ts`, `src/lib/wcc/__tests__/booking-store.test.ts`. **Deps:** A1. **Size:** S.

**Checkpoint 1:** `npm test` green (≥25 tests), `npm run lint` clean, dev site unaffected.

### Phase C — Security & hygiene

- [x] **Task C1: Upgrade Next to 16.3.5.**
  `bun install next@16.3.5 eslint-config-next@16.3.5`; verify dev boot, build, and `bun audit` no longer lists `next`.
  **Verification:** `bun audit | grep -c "next "` → 0 direct hits; `npm run build` succeeds. **Deps:** none. **Size:** S.

- [x] **Task C2: Remove unused deps + unused ui components (validated).**
  Keep `src/components/ui/`: accordion, button, carousel, dialog, input, label, sheet, sonner, textarea. Delete the other 39 ui files + `hooks/use-toast.ts` + `hooks/use-mobile.ts` (used only by sidebar). Remove deps: `next-auth`, `@dnd-kit/*` (3), `@hookform/resolvers`, `@mdxeditor/editor`, unused `@radix-ui/react-*` (alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dropdown-menu, hover-card, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, toggle, toggle-group, tooltip), `@reactuses/core`, `@tanstack/react-query`, `@tanstack/react-table`, `cmdk`, `date-fns`, `framer-motion`, `input-otp`, `next-intl`, `next-themes` (simplify ui/sonner.tsx to hardcoded dark), `react-day-picker`, `react-hook-form`, `react-markdown`, `react-resizable-panels`, `react-syntax-highlighter`, `recharts`, `uuid`, `vaul`, `tailwindcss-animate` (only if unreferenced by CSS). Keep: embla, sonner, z-ai-web-dev-sdk (used by tracked scripts), sharp, prisma stack, radix (accordion/dialog/label/slot).
  **Sub-task C2a (fixes C11):** layout mounts sonner `<Toaster />` (from simplified `ui/sonner.tsx`); delete radix toast path.
  **Acceptance:** `bun audit` critical count 0; only keep-list ui files remain; site visually unchanged; booking toast now renders.
  **Verification:** `npm run lint && npx tsc --noEmit` clean; agent-browser smoke pass + booking E2E shows toast. **Deps:** C1 (do together, single lockfile churn). **Size:** M.

- [x] **Task C3: tsconfig + next.config hardening.**
  `exclude` gains `foundation`, `examples`, `skills`, `docs`, `scripts`, `db`. Remove `typescript.ignoreBuildErrors` from `next.config.ts`. Set `noImplicitAny: true`.
  **Verification:** `npx tsc --noEmit` exits 0 with zero errors; `npm run build` fails fast on type errors. **Deps:** C2 (ui files must be gone first). **Size:** S.

- [x] **Task C4: Untrack database + quiet Prisma logs.**
  `git rm --cached db/custom.db`; add `/db/*.db` to `.gitignore` (keep `db/.gitignore` note + ensure runtime dir exists via `lib/db.ts` or README note). `src/lib/db.ts`: `log: ['query']` only when `NODE_ENV !== 'production'`.
  **Verification:** `git ls-files | grep '\.db$'` empty; page 200 + booking E2E still works. **Deps:** none. **Size:** S.

- [x] **Task C5: Small web hygiene.**
  Add `src/app/icon.svg` (amber W mark, no text = scalable); add `src/app/sitemap.ts` (single URL); add `loading="lazy"` to `difference.tsx` third image.
  **Verification:** `/favicon.ico`→icon route returns 200 (or icon link in HTML head); build output contains sitemap. **Deps:** none. **Size:** S.

**Checkpoint 2:** `bun audit` — 0 critical / 0 high in runtime deps; `npx tsc --noEmit` clean; `npm run build` succeeds; full section smoke via agent-browser.

### Phase D — Visual-fidelity remediation (UI)

- [x] **Task D1: Fix carousel arrow overlap (D1).**
  Move `CarouselPrevious/Next` outside the card flow: position at `xl:-left-14` / `xl:-right-14` with `max-xl:hidden`-style treatment plus an inline mobile fallback under the carousel (dot pagination already exists via scroll). Cards gain `px` breathing room so arrows never cover text.
  **Verification:** agent-browser — arrows' bounding boxes don't intersect any `figure` text box; both arrows clickable (no interception). VLM screenshot check.
  **Files:** `src/components/wcc/testimonials.tsx`. **Deps:** none. **Size:** S.

- [x] **Task D2: Teal secondary accent system (V1).**
  Add `--accent-teal` token (teal ~`#4fd1c5` family, tuned for ≥4.5:1 on `#0a0b0d`) in `globals.css` + `text-teal` utility. Apply to keyword spans: hero headline accent word stays amber (brand), but add teal to: FAQ heading "Questions"-style eyebrow, interior section keyword, ceramic headline keyword, difference headline keyword, footer company name. Match source's two-tone headline pattern.
  **Verification:** VLM section comparison — teal keyword highlights present; contrast spot-check via computed styles. **Files:** `globals.css`, `hero.tsx` (eyebrow), `faq.tsx`, `interior-only.tsx`, `ceramic-upsell.tsx`, `difference.tsx`, `site-footer.tsx`. **Deps:** none. **Size:** M.

- [x] **Task D3: Dual pricing in cards (V2).**
  `packages.tsx` + `ceramic-tiers.tsx`: remove the vehicle `radiogroup` toggle from the section; inside each card render a two-row price block (Sedan $X / SUV-Truck-Van $Y) styled like the source (label left, price right, amber price). Booking dialog keeps its own vehicle toggle.
  **Verification:** both prices visible in every card without interaction (agent-browser text check + VLM); mobile stacks gracefully. **Files:** `packages.tsx`, `ceramic-tiers.tsx`. **Deps:** D2 (token reuse optional). **Size:** M.

- [x] **Task D4: Package card imagery (V2).**
  Top each package card with an image band (existing webp assets: `interior-clean`/`exterior-clean`/`detail-action` as appropriate), 16:6 crop, subtle border. Ceramic tier cards get the beads image on the popular tier only (avoid triple repetition).
  **Verification:** VLM card comparison vs source — image-topped cards; no CLS (fixed aspect). **Files:** `packages.tsx`, `ceramic-tiers.tsx`. **Deps:** D3. **Size:** M.

- [x] **Task D5: Final CTA parity (V4).**
  Full-bleed background image (`detail-action.webp`) + gradient overlay, 5-star rating line ("5.0 · 37 Google reviews"), two buttons (Book Now primary, Ask a Question outline), phone as quiet text link under.
  **Verification:** VLM comparison vs source final CTA; contrast maintained. **Files:** `final-cta.tsx`. **Deps:** D2. **Size:** S.

- [x] **Task D6: FAQ card style + sentence case (V5).**
  Each item inside a rounded `bg-card` card with border; trigger text sentence case (remove uppercase); heading keeps display font with teal accent on "Questions". Keep Accordion semantics.
  **Verification:** VLM vs source; keyboard open/close still works (aria-expanded). **Files:** `faq.tsx`, (FAQS copy already sentence case). **Deps:** D2. **Size:** S.

- [x] **Task D7: Hero eyebrow + overlay contrast (V6).**
  Add small eyebrow label above the rating badge ("Why We're Different" → keep ours consistent with nav), strengthen bottom gradient slightly, keep 3 CTAs (mobile-friendly), keep exterior shot (brand asset). Minor only.
  **Verification:** VLM hero contrast check; text ≥4.5:1 computed on darkest band. **Files:** `hero.tsx`. **Deps:** D2. **Size:** S.

- [x] **Task D8: Mobile call FAB (V7).**
  Fixed bottom-right circular amber phone button (`tel:` link), mobile-only (`lg:hidden`), appears after scrolling past hero (`scrollY > 400`), respects reduced motion, `aria-label="Call We Care Car Care"`.
  **Verification:** agent-browser mobile — FAB visible after scroll, hidden at top, not covering footer content. **Files:** new `src/components/wcc/call-fab.tsx`, `page.tsx`. **Deps:** none. **Size:** S.

**Checkpoint 3:** Full-page VLM pass (desktop + mobile) — no text/element overlaps, all sections match source patterns within documented divergences; animations still work (slider drag, reveals, carousel, accordion, shine).

### Phase E — Booking dialog UX parity (V3, V9)

- [x] **Task E4: Service rows show includes summary + badge.**
  Each service row in dialog step 1 gets a one-line "includes" summary (top 3 features, from content data) + "Most Popular" badge on `premium-full`.
  **Verification:** agent-browser snapshot shows badge + summary lines; VLM comparison. **Files:** `booking-dialog.tsx`, `content.ts` (add `summary` to BOOKABLE_SERVICES mapping). **Deps:** B4. **Size:** M.

- [x] **Task E5: Smart Add-On preselect (V9).**
  Packages "Smart Add-On" button → `openBooking(pkg.key, { addOnCeramic: true })` (B5 store API). Booking dialog consumes `presetAddOnCeramic` on open.
  **Verification:** unit test (B5) + agent-browser click-through — dialog opens with add-on checked. **Files:** `packages.tsx`, `booking-dialog.tsx`. **Deps:** B5, E4. **Size:** S.

**Checkpoint 4 (final):** `npm test` green; `npm run lint`; `npx tsc --noEmit`; `npm run build`; agent-browser E2E booking flow; DB cleaned of test rows.

### Phase F — Documentation alignment

- [x] **Task F1:** Update `README.md` (test commands, dependency changes, new components), `AGENTS.md` (test/lint gates), `CLAUDE.md` (commands + verification section), `Project_Architecture_Document.md` (resolve known-issues rows: db untracked, tests added, deps pruned, ignoreBuildErrors removed; add ADRs: dependency pruning, dual-pricing display, timezone-safe dates; update layer diagram with new lib modules).
  **Verification:** docs cross-checked against actual file list and scripts; no stale commands. **Deps:** all above. **Size:** M.

### Phase G — Ship

- [x] **Task G1:** Final full verification (test + lint + tsc + build + smoke), `git add` code/docs, single conventional commit, push to `origin main` with the Ed25519 key via SSH wrapper. No new branches.

### Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Next 16.1.3 → 16.3.5 behavior change | Full build + section smoke + booking E2E after upgrade; revert pin if regressions |
| Removing ui components breaks an import | `rg` import graph check before each deletion; tsc gate in CI-equivalent local run |
| Dual pricing changes layout on mobile | Mobile screenshots after change; stack rows vertically |
| Lockfile churn breaks standalone build | `npm run build` re-verified in Checkpoint 2/4 |

### Out of scope (documented, not fixed now)

- C10 slot capacity/double-booking (needs business rules + availability API)
- Real chat widget (question-dialog + phone FAB cover the intent)
- Gallery section + About/Service-area body section (source-only content)
- next/image migration (AVIF advisory resolved by upgrade; current static webp + priorities are adequate)


---

## Part 4 — Execution Record (2026-09-13)

All phases executed. Verification evidence:

- **Tests:** 49/49 green under `TZ=UTC`, `TZ=America/New_York`, `TZ=Asia/Singapore` (timezone-safety regression proof for B2).
- **Lint / types:** `eslint .` clean; `tsc --noEmit` exits 0 (was 135+ errors from unscoped reference dirs).
- **Build:** production build succeeds with `ignoreBuildErrors: false`; routes include `/icon.svg` and `/sitemap.xml`.
- **Security:** `bun audit` 90 findings (3 critical, 48 high) → 27 findings (0 critical; all remaining are dev-tooling chains — eslint/babel/prisma CLI — that never enter the standalone runtime bundle). `next@16.1.3 → 16.3.5`; `next-auth` + 43 other unused deps removed; 39 unused ui primitives removed.
- **Toast bug (C11):** E2E-verified — booking submission now renders the sonner "Booking request received" toast.
- **Visual (agent-browser + VLM):** dual sedan+SUV prices visible in all cards without interaction; card image bands render; teal keyword highlights present (hero eyebrow, pricing/ceramic/interior/difference/FAQ headings); FAQ cards + sentence case; final CTA has photo backdrop + rating pill + 2 buttons; carousel arrows live in side gutters with zero text overlap (D1 fixed); mobile call FAB appears after hero scroll; booking dialog shows per-service summaries + Most Popular badge; Smart Add-On preselects the ceramic add-on (verified in DOM + VLM).
- **Docs:** README, AGENTS.md, CLAUDE.md, Project_Architecture_Document.md (v1.1.0 revision block, ADR-008/009, updated tables) aligned with the remediated codebase.
- **Out-of-scope items** (C10 slot capacity, real chat widget, gallery/about sections, next/image migration) remain documented in Part 3 and the PAD known-issues table.
