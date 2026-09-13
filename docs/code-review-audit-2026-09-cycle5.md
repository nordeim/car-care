# Tiered Code Review + Security Audit — Cycle 5 (2026-09-14, session 3)

**Scope:** full working tree at `main @ 5b48f14` + cycle-5 SEO-parity remediation (uncommitted working changes reviewed in place); `skills/`, `node_modules/`, `.next/`, `db/`, `download/` excluded per engagement instructions.
**Method:** contract verification (docs ↔ code), line-by-line review of every source file under `src/` + `e2e/` + `scripts/` + `.github/`, OWASP-2025 tiered security audit (repo skills: `security-and-hardening`, `vulnerability-scanner`, `code-review`, `code-quality-standards`), live-site verification on `https://car-care.jesspete.shop` (structure, funnel, API contracts, headers, axe, CWV) and source-site parity (`https://wecarecarcare.com`).
**Question this audit answers:** does the codebase match its documented contracts (AGENTS/CLAUDE/README/PRD/SKILL/PAD), and is it safe to ship?

**Verdict:** **PASS — safe to ship.** 2 LOW findings (JSON-LD hardening, Caddyfile provenance) + 3 informational; 0 MEDIUM/HIGH/CRITICAL open items. **All 3 actionable findings (A1/A2/A3) were remediated in the same cycle** (TDD, red → green); the 2 informational items are documented accepted behavior. All four prior remediation cycles verified intact and live.

---

## Tier 0 — Environment anomalies encountered (and resolved)

| Anomaly | Resolution |
|---|---|
| Playwright Chromium binary missing on first e2e run (known from sessions 1–2) | `bunx playwright install chromium` — env provisioning, not a repo issue |
| Live 429 not triggered by spread-out curl probes | Sandbox egress IP rotates between two addresses; each lands in its own rate-limit bucket. Pinned single-connection burst triggered 429 correctly — **limiter verified working** (env artifact, not a site bug) |
| `cat`/`rg`/`python` reads of `site-header.tsx` appeared to show `const enuOpen, setMenuOpen]` (missing `[m`) | **Display artifact only**: the tool-result transport strips the literal `[m` sequence from displayed output. Proven via `od -c` (bytes present), bracket-substitution display, and `git hash-object` == HEAD blob == index (`7151a8c`). File is pristine; tsc/lint/build/e2e all green. No action. (Lesson recorded in worklog: trust git/tsc/od evidence over raw cat when they disagree.) |

## Tier 1 — Contract verification (docs ↔ code)

| Check | Result | Evidence |
|---|---|---|
| Test counts (66 unit / 8 files; 36 e2e / 5 specs after cycle 5) | ✅ | `npm test` 66/66 × 3 TZ (UTC / America/New_York / Asia/Singapore); `bun run e2e` 36/36; per-file enumeration matches every doc claim (post cycle-5 doc alignment) |
| Versions (Next 16.3.5, React 19.3.0, TS 5.9.3, Tailwind 4.3.3, Prisma 6.19.3, Zod 4.6.4, Zustand 5.0.15, Vitest 5.0.0, bun 1.3.14) | ✅ | `package.json` + `bun.lock` vs SKILL §2 / README architecture table |
| Component counts (16 wcc, 9 ui, 9 sections composed) | ✅ | `ls src/components/{wcc,ui}`; `page.tsx` composition read line-by-line |
| API pipeline order (413→parse→zod→honeypot→rate-limit→rules→price→persist) | ✅ | Both route files re-read; matches PRD §7 / AGENTS / SKILL §15.1 |
| Business facts (13 areas, 6 bookable services, 7 price pairs, $200/$299 add-on, 6 time slots, phone/hours/address) | ✅ | `content.ts` read; **live footer + live JSON-LD + source-site footer cross-checked — exact parity** (incl. Dover + Holliston) |
| Env contract (DATABASE_URL + NEXT_PUBLIC_SITE_URL/SITE_URL, fallback live URL) | ✅ | `.env.example`, `layout.tsx`/`sitemap.ts`/`robots.ts`; live OG/sitemap/robots verified |
| SEO parity vs source (JSON-LD blocks, canonical, icons, pricing, areas) | ✅ (cycle 5) | Source emits AutoWash+FAQPage+canonical+url; clone now emits AutoWash(with url)+FAQPage(from FAQS)+canonical+theme-color+apple-icon+favicon.ico — new e2e specs 5/5 green; pricing/areas/phone/address/email exact match |
| Git invariants (no tracked `.env` / `*.db`) | ✅ | `git ls-files` clean; `skill-verify.sh` check 9 guards it; check 10 (content-as-data) and check 11 (CI coverage) also green |
| CI gate workflow = documented gate | ✅ | `.github/workflows/verify-gate.yml` read line-by-line: frozen install → env+DB provisioning → unit ×3 TZ → tsc → lint → build → e2e → skill-verify; filterless push trigger; `permissions: contents: read`; bun pinned 1.3.14 |

**Tier 1 result: ALIGNED.**

## Tier 2 — Correctness & code quality (every file reviewed)

| File | Verdict | Notes |
|---|---|---|
| `api/bookings/route.ts`, `api/questions/route.ts` | ✅ | Pipeline order correct; honeypot fake-201 before limiter; server re-prices via `quoteFor`; errors log `error.message` only; 500 fail-closed with call-the-shop text |
| `lib/wcc/{booking,dates,schemas,rate-limit,db-url,payload-limit,booking-store}.ts`, `lib/db.ts` | ✅ | TZ-safe weekday/window math (UTC-ordinal); sliding window prunes; CF-aware IP extraction; contract-tested resolver; presets consumed on open |
| `booking-dialog.tsx` (647 LOC) | ✅ | 4-step flow, per-step gates, `aria-pressed`/`aria-current`/`role=alert`, submitting disables buttons, `CERAMIC_ADDON`/`BUSINESS` interpolated (cycle-4 fixes hold) |
| `question-dialog.tsx` | ✅ | Reset-after-close-animation; honeypot field; `role=alert`; `BUSINESS.phone` interpolated |
| `site-header.tsx`, `before-after.tsx`, `reveal.tsx`, `call-fab.tsx` | ✅ | Scroll-blur; pointer-capture drag + keyboard ±5 clamp 4–96; one-shot IO with cleanup; FAB scrollY>400 `lg:hidden`; Label-in-Name logo |
| `hero.tsx`, `packages.tsx`, `ceramic-{upsell,tiers}.tsx`, `interior-only.tsx`, `difference.tsx`, `testimonials.tsx`, `faq.tsx`, `final-cta.tsx`, `site-footer.tsx` | ✅ | All facts from `content.ts`; dual pricing rows; responsive hero srcset + `fetchPriority=high`; hydration-safe footer year; carousel a11y (rating `role=img`) |
| `layout.tsx` (post cycle 5) | ✅ | Two JSON-LD blocks (AutoWash + FAQPage from `FAQS`); canonical; themeColor; env-driven siteUrl everywhere |
| `e2e/*` (5 specs + helpers + teardown) | ✅ | Unique XFF per test; SQLite server-truth + cleanup; shared resolver; TZ-aware date helpers |
| `scripts/db.ts`, `scripts/skill-verify.sh`, `scripts/gen-icons.mjs` (new) | ✅ | CLI wrapper pins DB path; 11 checks green; icon generator idempotent with ICO sanity checks |
| `.github/workflows/verify-gate.yml` | ✅ | See Tier 1 |

## Tier 3 — Security audit (OWASP 2025)

| Category | Verdict | Evidence |
|---|---|---|
| A01 Broken Access Control | ✅ PASS | POST-only routes (GET→405 verified live ×2); no read endpoints (zero IDOR surface); no outbound requests from user input (no SSRF from app code) |
| A02 Security Misconfiguration | ✅ PASS | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy **verified live** (fresh curl this session); `poweredByHeader: false`; no `.env`/`.db` tracked |
| A03 Software Supply Chain | ✅ PASS | `bun audit --prod`: 0 vulnerabilities; lockfile committed & used by CI (`--frozen-lockfile`); versions current; no typosquat deps |
| A04 Cryptographic Failures | ✅ PASS (N/A) | No secrets, no crypto in app scope; HTTPS terminates at Cloudflare (HSTS present) |
| A05 Injection | ✅ PASS | Zod at boundary (both routes); Prisma parameterization throughout; React auto-escaping for all user-derived render (no `innerHTML` assignments); JSON-LD blocks are static `content.ts` data (see finding A1 for defense-in-depth note) |
| A06 Insecure Design | ✅ PASS | Honeypot fake-201 (bots learn nothing); rate limit after zod (bots don't consume quota); payload guard before parse; server-authoritative pricing |
| A07 Authentication Failures | ✅ PASS (N/A) | No auth by design (PRD non-goal); no sessions/cookies at all |
| A08 Integrity Failures | ✅ PASS | CI gate pinned by skill-verify check 11; lockfile frozen in CI |
| A09 Logging & Alerting | ✅ PASS (scope) | Errors logged with route prefix + message only (no bound values/PII); dev-only query logging; e2e asserts console-error-free |
| A10 Exceptional Conditions | ✅ PASS | Fail-closed 500s with human fallback (call-the-shop); rate limiter fails closed (429); no catch-and-ignore |

**Secrets scan:** clean — no key material in tracked files (SSH how-to doc shows only redacted placeholders); no high-entropy strings in `src/`.

## Findings

| ID | Severity | Finding | Evidence | Recommended fix |
|---|---|---|---|---|
| **A1** | LOW | JSON-LD serialization lacks `</script>` breakout hardening. `JSON.stringify(...)` is injected via `dangerouslySetInnerHTML`; a future `content.ts` string containing `</script>` would terminate the script block early (markup injection into `<head>`-adjacent body). No user input reaches these blocks today — static authored copy only — so this is defense-in-depth, not an exploitable path. | `src/app/layout.tsx:135-142` (2 blocks) | Escape `<` → `\u003c` after stringify (JSON-safe); extract to a tested helper (`src/lib/wcc/json-ld.ts`) — **✅ Fixed cycle 5** (TDD: 3 RED tests → GREEN; unit 66 → 69) |
| **A2** | LOW | The tracked `Caddyfile` is sandbox tooling, not the live config — and is not labeled as such. It listens on `:81`, contains an `XTransformPort` query handler that proxies to **arbitrary localhost ports** (sandbox preview mechanism), and forwards to `:3000`, while the live server runs the standalone build on `:3005` (`docs/start_server_log.txt`). If someone deployed this file as-is on a public interface, the transform-port handler would be an SSRF-style open proxy. | `Caddyfile:1-12` vs `docs/start_server_log.txt:74-75` | Mark it sandbox-only/do-not-deploy in a header comment; note the live topology in README — **✅ Fixed cycle 5** (header comment + README troubleshooting row) |
| **A3** | INFO | 429 responses carry no `Retry-After` header (RFC 6585 §4). Harmless for humans; polite clients would benefit. | both routes' 429 branches | `Retry-After: 600` (matches the 10-min window) — **✅ Fixed cycle 5** (TDD: e2e header assertion RED → GREEN) |
| **A4** | INFO | Booking dialog derives "today" from the visitor's local clock (`buildDayOptions(new Date())`); the API window is anchored to `America/New_York`. A visitor far from ET may be offered day-0 that the server rejects (422). Server-authoritative by design (PRD F4); UX-only edge. | `booking-dialog.tsx:99` vs `dates.ts` | Accepted — documented behavior |
| **A5** | INFO | Environment note: tool-result display strips literal `[m` sequences (see Tier 0). No repo impact; recorded so future agents don't "fix" phantom corruption. | worklog Task 10-env | None |

**Accepted (documented, no action):** hero/success-screen brand copy (not business facts); `docs/session_*.md` historical statements; Cloudflare-managed robots.txt prepend (owner's infra setting, not repo code); source-site `hasOfferCatalog`/`sameAs` not replicated (source's own copies are stale/empty — deliberate divergence, cycle-5 log).

## Verification ledger

- Local gate (post cycle-5 + hardening): `npm test` 69/69 × 3 TZ · `bunx tsc --noEmit` 0 · `bun run lint` 0 · `bun run build` green (incl. `/apple-icon.png` route) · `bun run e2e` 36/36 (incl. Retry-After assertion) · `scripts/skill-verify.sh` 11/11 (check 2 updated to 69 in lockstep) — **all executed this session, observed green**.
- Live (this session): booking funnel `WCC-T2E850` ($360 sedan quote correct); question dialog; API contracts 405/400/413×2/422×4/honeypot×2(fake `WCC-000000`)/429; axe 0 violations; CWV TTFB 98.3ms / FCP 376ms / LCP 376ms / CLS 0; all 6 security headers present; zero console/page errors through full scroll.
- Source parity (this session): pricing exact (7 pairs), 13 service areas exact, phone/address/email exact, structure 1:1 (all source headings present or deliberately diverged per cycle-2 audit).
