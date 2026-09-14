# Tiered Code Review + Security Audit — Cycle 6 (2026-09-14, session 4)

**Scope:** full working tree at `main @ da04511` + cycle-6 remediation (og:locale, uncommitted working changes reviewed in place); `skills/`, `node_modules/`, `.next/`, `db/`, `download/` excluded per engagement instructions.
**Method:** contract verification (docs ↔ code), line-by-line re-review of every in-scope source file (`src/` + `e2e/` + `scripts/` + `.github/` + root configs), automated tiered scans via the repo skill `code-review-and-audit` (`audit_runner.py --mode deep`, findings triaged to in-scope paths), OWASP-2025 security audit (repo skills: `security-and-hardening`, `vulnerability-scanner`, `code-review`), fresh live-site E2E on `https://car-care.jesspete.shop` (funnel, API contracts, headers, axe, CWV) and source-site parity (`https://wecarecarcare.com`).
**Question this audit answers:** does the codebase match its documented contracts (AGENTS/CLAUDE/README/PRD/SKILL), and is it safe to ship?

**Verdict:** **PASS — safe to ship.** 2 LOW findings (B1 PRD-F2.2 day-anchor drift, B2 hardcoded stats line) + 4 informational; 0 MEDIUM/HIGH/CRITICAL open items. Both actionable findings were remediated in the same cycle (TDD, red → green). All five prior remediation cycles verified intact; cycle-5 changes confirmed deployed live.

---

## Tier 0 — Environment anomalies encountered (and resolved)

| Anomaly | Resolution |
|---|---|
| Playwright Chromium binary (`chromium_headless_shell-1243`) missing for the pinned `@playwright/test` 1.63.0 | `bunx playwright install chromium` — env provisioning, not a repo issue (same class as cycles 3–5) |
| First e2e run: 21 failures | **Entirely the missing browser binary** — after install, 36/36 green with zero source changes (gate classification: infrastructure failure, not source-code debt) |
| Sandbox parent `.env` pins `DATABASE_URL=file:/home/z/my-project/db/custom.db` | The documented env-drift case: the shared `db-url.ts` resolver keeps CLI/dev/standalone/E2E on ONE file; observed working as designed |
| `agent-browser` selector strings with `[role=...]` mangled by the tool-result transport | Known `[x` display artifact (cycle-5 A5); worked around via file-based `eval` scripts |

## Tier 1 — Contract verification (docs ↔ code)

| Check | Result | Evidence |
|---|---|---|
| Test counts (69 unit / 9 files; 36 e2e / 5 specs) | ✅ | `npm test` 69/69 × 3 TZ (UTC / America/New_York / Asia/Singapore); `bun run e2e` 36/36; per-file test-count enumeration (5+14+5+9+8+3+4+6+15=69) matches docs |
| Versions (Next 16.3.5, React 19.3.0, TS 5.9.3, Tailwind 4.3.3, Prisma 6.19.3, Zod 4.6.4, Zustand 5.0.15, Vitest 5.0.0, sonner 2.0.8, embla 8.6.0, lucide 0.525.0, sharp 0.35.4, bun 1.3.14) | ✅ | `package.json` + `bun.lock` vs SKILL §2 / README architecture table; `skill-verify.sh` check 1 green |
| Component counts (16 wcc, 9 ui) | ✅ | `find src/components/{wcc,ui} -name '*.tsx'`; check 3 green |
| API pipeline order (413→parse→zod→honeypot→rate-limit→rules→price→persist) | ✅ | Both route files re-read line-by-line; matches PRD §7 |
| Business facts (13 areas, 6 bookable services, 7 price pairs, $200/$299 add-on, 6 time slots, phone/hours/address) | ✅ | `content.ts` read; live JSON-LD + rendered DOM + source-site JS-rendered DOM cross-checked — pricing 13/13 price points exact |
| Env contract (DATABASE_URL + NEXT_PUBLIC_SITE_URL/SITE_URL, fallback live URL) | ✅ | `.env.example`, `layout.tsx`/`sitemap.ts`/`robots.ts`; live OG/sitemap/robots verified |
| SEO parity vs source | ✅ (cycle 6) | Cycle-5 features confirmed live (canonical, FAQPage+AutoWash JSON-LD, theme-color, favicon.ico, apple-icon.png, `Retry-After: 600`); one residual gap found and fixed this cycle — `og:locale` (G1, see Remediation Plan #1) |
| Git invariants (no tracked `.env` / `*.db` outside `skills/`) | ✅ | `git ls-files` clean for src/e2e/docs; check 9 green; the one tracked `.db` is `skills/encrypt-decrypt/scripts/.mypy_cache/3.12/cache.db` — inside `skills/`, excluded by design (see B5) |
| CI gate workflow = documented gate | ✅ | `.github/workflows/verify-gate.yml` re-read: frozen install → env+DB provisioning → unit ×3 TZ → tsc → lint → build → e2e → skill-verify; filterless push trigger; `permissions: contents: read`; bun pinned 1.3.14; check 11 green |
| SKILL.md structure (ToC 20, headings 26, sections 1–20, appendices A–D, no placeholders, hex tokens) | ✅ | `skill-verify.sh` checks 4–8 green — including after the cycle-6 doc edits (v1.6.0) |
| **PRD F2.2 day-picker anchor** | ❌ **B1** | PRD: "14 days from `America/New_York` today"; code: `buildDayOptions(new Date(), 14)` — client-local anchor (details below) |

## Tier 2 — Correctness & code quality (every in-scope file re-reviewed)

| File | Verdict | Notes |
|---|---|---|
| `api/{bookings,questions}/route.ts` | ✅ | Pipeline order correct; honeypot before limiter; server re-prices via `quoteFor`; errors log message only; 500 fail-closed with call-the-shop text; `Retry-After: 600` on 429s |
| `lib/wcc/{booking,dates,schemas,rate-limit,db-url,payload-limit,booking-store,json-ld}.ts`, `lib/db.ts` | ✅ | TZ-safe UTC-ordinal math; sliding window prunes + does not extend on rejection; CF-aware IP extraction; contract-tested resolver; presets consumed on open; `<`-escape serializer |
| `booking-dialog.tsx` (647 LOC) | ⚠️ B1 + B2 | Day list anchored to client clock (B1); one hardcoded stats line in the success screen (B2); rest clean — per-step gates, `aria-pressed`/`aria-current`/`role=alert`, submitting disables buttons, `CERAMIC_ADDON`/`BUSINESS` interpolated |
| `question-dialog.tsx` | ✅ | Reset-after-close-animation; honeypot field; `role=alert`; `BUSINESS.phone` interpolated |
| `site-header.tsx`, `before-after.tsx`, `reveal.tsx`, `call-fab.tsx` | ✅ | Scroll-blur; pointer-capture drag + keyboard ±5 clamp 4–96; one-shot IO with cleanup; FAB opacity-gated at scrollY>400 `lg:hidden` (re-verified live); Label-in-Name logo |
| `hero.tsx`, `packages.tsx`, `ceramic-{upsell,tiers}.tsx`, `interior-only.tsx`, `difference.tsx`, `testimonials.tsx`, `faq.tsx`, `final-cta.tsx`, `site-footer.tsx` | ✅ | All facts from `content.ts` (stats interpolated via `BUSINESS.stats.*` in hero/final-cta/testimonials); dual pricing; responsive hero srcset + `fetchPriority=high`; hydration-safe footer year |
| `layout.tsx` (post cycle 6) | ✅ | Two JSON-LD blocks through `jsonLdHtml()`; canonical; themeColor; `og:locale` (G1 fix); env-driven siteUrl everywhere |
| `content.ts` | ✅ | All 6 services + prices + 13 areas + 9 FAQs + 6 testimonials + business facts; `BOOKABLE_SERVICES` derived, not hand-edited |
| `e2e/*` (5 specs + helpers + teardown) | ✅ | Unique XFF per test; SQLite server-truth + cleanup; shared resolver; TZ-aware date helpers (`nextBookableIsoBtz` already assumes business-TZ anchoring — aligns with the B1 fix) |
| `scripts/{db.ts,skill-verify.sh,gen-icons.mjs}` | ✅ | CLI wrapper pins DB path; 11 checks green; icon generator idempotent with ICO sanity checks |
| `.github/workflows/verify-gate.yml` | ✅ | See Tier 1 |
| `tsconfig.json` / `vitest.config.ts` / `eslint.config.mjs` | ✅ | `skills/` excluded from typecheck + tests + lint per engagement instruction and repo convention |

## Tier 3 — Security audit (OWASP 2025)

| Category | Verdict | Evidence |
|---|---|---|
| A01 Broken Access Control | ✅ PASS | POST-only routes (GET→405 verified live); no read endpoints (zero IDOR surface); no outbound requests from user input |
| A02 Security Misconfiguration | ✅ PASS | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy **verified live this session** (fresh curl); `poweredByHeader: false`; no `.env`/`.db` tracked in scope |
| A03 Software Supply Chain | ✅ PASS | `bun audit --prod`: **0 vulnerabilities** (re-run this session); lockfile committed & frozen in CI; no typosquat deps; lockfile untouched this cycle |
| A04 Cryptographic Failures | ✅ PASS (N/A) | No secrets, no crypto in app scope; HTTPS terminates at Cloudflare (HSTS present) |
| A05 Injection | ✅ PASS | Zod at boundary; Prisma parameterization; React auto-escaping; JSON-LD through the tested `<`-escape helper (cycle-5 A1 fix verified intact: `json-ld.test.ts` 3/3) |
| A06 Insecure Design | ✅ PASS | Honeypot fake-201 before limiter; payload guard before parse; server-authoritative pricing |
| A07 Authentication Failures | ✅ PASS (N/A) | No auth by design (PRD non-goal); no sessions/cookies |
| A08 Integrity Failures | ✅ PASS | CI gate pinned by check 11; lockfile frozen in CI |
| A09 Logging & Alerting | ✅ PASS (scope) | Errors logged with route prefix + message only; dev-only query logging; e2e asserts console-error-free |
| A10 Exceptional Conditions | ✅ PASS | Fail-closed 500s; limiter fails closed (429); no catch-and-ignore |

**Secrets scan (deepened this cycle):** tracked-tree scan clean; **git-history sweep** for private-key material: 4 pattern hits, all confirmed to be the literal format-header documentation strings in `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` + its `skills/` copy — no base64 key bodies anywhere in history (`git grep` across all refs for `b3BlbnNzaC1rZXktdjE`/`AAAAB3NzaC1`: 0). No secrets committed, ever.

**Automated scanner triage (`audit_runner.py --mode deep`):** 2,244 raw findings repo-wide; filtering to in-scope paths (`src/`, `e2e/`, `prisma/`, root configs) yields 239, of which 231 are false positives after expert triage (207 PascalCase = React component declarations, correct convention; 23 single-letter vars = idiomatic tight scopes with comments; 4 `JSON.parse` in tests = the assertion itself; 1 CAPS comment = trivial). The 2 HIGH flags are the two documented-and-mitigated `dangerouslySetInnerHTML` JSON-LD blocks (static content, escaped serializer, unit-tested — scanner pattern-match, not a vulnerability). **Zero genuine Critical/High findings in scope.**

## Findings

| ID | Severity | Finding | Evidence | Recommended fix |
|---|---|---|---|---|
| **B1** | LOW | Booking dialog day list is anchored to the **client's local "today"** (`buildDayOptions(new Date(), 14)`), while PRD F2.2 documents "14 days from `America/New_York` today" and the API window is business-TZ-anchored. A visitor behind ET (e.g., US West Coast evenings) is offered a day-0 that is already the business's yesterday — picking it yields a confusing 422 "Date must be within the next 60 days". Cycle-5 audit A4 logged this as INFO/accepted; the PRD text contradicts that acceptance, so this cycle resolves the drift **in the PRD's direction** (the e2e helpers already assume business-TZ anchoring, and the shop's calendar — Sundays, 60-day window — IS the New York calendar). | `booking-dialog.tsx:99` vs `PRD.md` F2.2 vs `dates.ts` | Convert `buildDayOptions` to a pure ISO-anchor API (`anchorIso: string`, UTC date math + UTC-labeled `Intl` formatters — fully host-TZ independent) and pass `todayIsoInTz(new Date(), BUSINESS_TZ)` from the dialog — **✅ Fixed cycle 6** (TDD: new RED unit tests incl. business-TZ anchor integration + invalid-anchor guard → GREEN; 4 existing characterization tests migrated to the new signature with assertions unchanged; unit 69 → 72) |
| **B2** | LOW | Content-as-data violation: the booking success screen hardcodes `5.0 · 7,500+ vehicles detailed` — business stats that exist as `BUSINESS.stats.rating` / `BUSINESS.stats.vehicles`. Every other stats surface (hero badge, hero stat band, final-cta, testimonials) interpolates from `content.ts`; if the owner updates stats, this one line silently drifts. `skill-verify.sh` check 10 misses it because it only scans price/phone literals. | `booking-dialog.tsx:594` | Interpolate `BUSINESS.stats.rating` / `BUSINESS.stats.vehicles`; extend check 10 to also scan the stats literals (`5.0`, `7,500+`, `16+` in components) so the class of drift is guarded — **✅ Fixed cycle 6** (RED: extended guard fails on the hardcoded line → GREEN after interpolation) |
| **B3** | INFO | `prisma/schema.prisma:18` comment says `// "09:00"` but stored `time` values are `TIME_SLOTS` labels (`"08:00 AM"` … `"03:30 PM"`). Stale comment only — no behavioral impact. | `schema.prisma` vs `content.ts` TIME_SLOTS | Comment corrected cycle 6 (no migration needed — comment-only) |
| **B4** | INFO | OG image is 1344×768 (1.75:1) vs the conventional 1200×630 (1.91:1) some social platforms prefer. PRD F5.1 pins `/images/hero-car.webp` — deliberate documented choice; altering needs an owner decision + new asset. | `layout.tsx` OG images block | None — documented |
| **B5** | INFO | `skills/encrypt-decrypt/scripts/.mypy_cache/3.12/cache.db` is tracked. It lives under `skills/` (reference material, excluded from the gate by design and by engagement instruction) — not a PII or gate concern, but it is build-cache noise in the repo. | `git ls-files` | None this cycle (skills/ is out of remediation scope per engagement instructions); flagged for the owner |
| **B6** | INFO | Footer prose says "over 16 years of hands-on experience" while `BUSINESS.stats.years` = "16+" — narrative copy vs stat display; the documented rule targets prices/phone/stats displays, and marketing prose is authored per-component by design. | `site-footer.tsx:26` | None — documented |

**Accepted (documented, no action):** hero/success-screen brand copy; `docs/session_*.md` historical statements; Cloudflare-managed robots.txt prepend (hosting layer); source-site divergences (staler FAQPage, `Chris@` JSON-LD email inconsistency on the source's side — clone matches the source's *visible* email); egress-IP rotation artifacts in live rate-limit probing.

## Remediation Plan #2 (executed same cycle)

| Item | TDD seam | RED | GREEN |
|---|---|---|---|
| B1 | `buildDayOptions` public API (unit level) + dialog day list (e2e funnel) | New unit tests: ISO-anchor output, business-TZ anchor via `todayIsoInTz` (fixed instant 2026-09-15T02:30:00Z → NY date Sep 14 ≠ UTC date Sep 15), invalid anchor → `[]`; runtime failure against the old Date-based signature | Pure UTC date-math implementation; dialog passes `todayIsoInTz(new Date(), BUSINESS_TZ)`; 4 existing characterization tests migrated (assertions unchanged); tsc drives call-site migration |
| B2 | `skill-verify.sh` check 10 (guard) + rendered dialog text | Extended check-10 regex fails on the hardcoded literals | `BUSINESS.stats` interpolation in the success screen |
| B3 | — | — | Comment-only fix (no test seam for comments) |

## Verification ledger

- Local gate (post cycle-6 remediation): `npm test` **72/72** × 3 TZ · `bunx tsc --noEmit` 0 · `bun run lint` 0 · `bun run build` green · `bun run e2e` 36/36 · `scripts/skill-verify.sh` 11/11 (check 2 updated 69 → 72 in lockstep; check 10 extended to stats literals) — all executed this session, observed green.
- Live (this session, pre-remediation baseline): booking funnel `WCC-TQJESO` ($360 quote correct); question dialog; API contracts 405/400/413×2/422×3/honeypot×2(fake `WCC-000000`)/429 + `Retry-After: 600`; axe 0 violations (all severities); CWV TTFB 90ms / FCP 272ms / LCP 272ms / CLS 0; all 6 security headers present; zero console/page errors; mobile nav + FAB; Smart Add-On preselect; reduced-motion neutralized; rapid-CTA 4/4.
- Source parity (this session): pricing 13/13 price points exact (JS-rendered source DOM), 13/13 service areas, phone/address/hours/rating exact; description/og:title/twitter:title identical; `og:locale` gap closed (G1).
- History: 6 audit cycles (1–5 re-verified + 6 this session); cumulative verdicts PASS.
