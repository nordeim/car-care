# Tiered Code Review + Security Audit — Cycle 4 (2026-09-13, session 2)

**Scope:** full working tree at `main @ 34a172d` + cycle-1..4 remediations; `skills/`, `node_modules/`, `.next/`, `db/`, `download/` excluded per engagement instructions.
**Method:** contract verification (110+ doc claims vs code), line-by-line review of every source file under `src/` + `e2e/` + `scripts/`, OWASP-2025 tiered security audit, automated vulnerability scan (`skills/vulnerability-scanner/scripts/security_scan.py`), live-site verification of every documented contract.
**Question this audit answers:** does the codebase match its documented contracts (AGENTS/CLAUDE/README/PRD/SKILL/PAD), and is it safe to ship?

**Verdict:** **PASS — safe to ship.** 2 LOW findings (content-as-data leaks in display strings) — **both remediated this cycle with a permanent gate guard**; 0 MEDIUM/HIGH/CRITICAL open items. All prior remediations verified intact and live.

---

## Tier 1 — Contract verification (docs ↔ code)

| Check | Result | Evidence |
|---|---|---|
| Test counts (66 unit / 8 files; 31 e2e / 5 specs) | ✅ | `npm test` 66/66 × 3 TZ (UTC / America/New_York / Asia/Singapore); `bun run e2e` 31/31; per-file enumeration matches every doc claim |
| Versions (Next 16.3.5, React 19.3.0, TS 5.9.3, Tailwind 4.3.3, Prisma 6.19.3, Zod 4.6.4, Zustand 5.0.15, Vitest 5.0.0, sonner 2.0.8, embla 8.6.0, lucide 0.525.0, sharp 0.35.4) | ✅ | `bun pm ls` tree vs SKILL §2 table, one-by-one |
| Component counts (16 wcc, 9 ui, 9 sections composed) | ✅ | `find src/components/{wcc,ui}`; `page.tsx` composition read |
| Design tokens + contrast claims (17.3:1 / 9.6:1 / 13.3:1 / 7:1) | ✅ | `globals.css :root` hexes; WCAG relative-luminance computation |
| API pipeline order (413→parse→zod→honeypot→rate-limit→rules→price→persist) | ✅ | both route files read line-by-line; matches PRD §7 / SKILL §15.1 / PAD Pattern-1 (post cycle-4 doc fix) |
| Business facts (13 areas, 6 bookable services, 7 price pairs, $200/$299 add-on, 6 time slots, phone/hours) | ✅ | `content.ts` read; live footer + live JSON-LD + source-site parity all cross-checked |
| Env contract (DATABASE_URL + NEXT_PUBLIC_SITE_URL/SITE_URL, fallback live URL) | ✅ | `.env.example`, `layout.tsx`/`sitemap.ts`/`robots.ts` read; live OG/sitemap/robots verified |
| Git invariants (no tracked `.env` / `*.db`) | ✅ (cycle-4 fix) | `git ls-files` clean; `scripts/skill-verify.sh` check 9 guards it (was regressed by `34a172d`, fixed this cycle) |
| Docs historical claims properly contextualized | ✅ | stale counts in revision logs/cycle tables marked historical; validation-report stamped superseded |

**Tier 1 result: ALIGNED.** (Cycle-4 doc fixes eliminated the 26 drift findings from the pre-audit sweep.)

## Tier 2 — Correctness & code quality (every file reviewed)

| File | Verdict | Notes |
|---|---|---|
| `api/bookings/route.ts`, `api/questions/route.ts` | ✅ | Pipeline order correct; honeypot fake-201 before rate-limit (bots don't consume quota); server re-prices; errors log `error.message` only; 500 fail-closed with call-the-shop text |
| `lib/wcc/{booking,dates,schemas,rate-limit,db-url,payload-limit,booking-store}.ts`, `lib/db.ts` | ✅ | TZ-safe weekday/window math; sliding window prunes; CF-aware IP extraction; contract-tested resolver; 36-line store consumes presets cleanly |
| `booking-dialog.tsx` (646 LOC) | ✅ | 4-step flow, per-step validation gates, preset service/add-on applied on open, `aria-pressed`/`aria-current`/`role=alert`, submitting state disables buttons, network + server error paths |
| `question-dialog.tsx` | ✅ | Reset-after-close-animation; honeypot field; optional phone; `role=alert` |
| `site-header.tsx` | ✅ | Scroll-blur state; mobile Sheet (85vw); Label-in-Name logo (documented cycle-2 a11y fix holds) |
| `before-after.tsx` | ✅ | Pointer capture drag, keyboard ±5, clamp 4–96, `role=slider` + `aria-valuenow`, `touch-none select-none`, reduced-motion via CSS |
| `reveal.tsx` | ✅ | One-shot IntersectionObserver, disconnect cleanup, `-10%` rootMargin |
| `hero.tsx`, `call-fab.tsx`, `site-footer.tsx`, `layout.tsx`, `page.tsx` | ✅ | Stats from `BUSINESS`; FAB scrollY>400 + `lg:hidden`; hydration-safe year; JSON-LD static object; env-driven metadataBase |
| `packages/ceramic-tiers/interior-only/difference/ceramic-upsell/final-cta/faq/testimonials` | ✅ (pattern scan) | All prices/services/areas/facts flow from `content.ts`; dual pricing rows; no raw palette classes; icons `aria-hidden` + adjacent text |
| `e2e/*` (5 specs + helpers + teardown) | ✅ | Unique `x-forwarded-for` per test; SQLite server-truth assertions; `PW E2E`-prefixed cleanup (belt-and-braces global teardown); shared db-url resolver |
| `scripts/db.ts`, `scripts/skill-verify.sh` | ✅ | CLI wrapper pins resolved DB path; verify script repo-relative + 9 checks green |

**Findings (LOW — content-as-data leaks in display strings):**

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| **A1** | LOW | Booking dialog hardcoded the add-on price in two display strings (`usd(200)`, `usd(299)`, `"(+$200)"`) — `CERAMIC_ADDON.price`/`regularPrice` existed in `content.ts` but weren't used. If the add-on price ever changed, these would silently drift. | `booking-dialog.tsx:312,314,541` — **✅ Fixed cycle 4:** all three now interpolate `CERAMIC_ADDON` |
| **A2** | LOW | Network-error fallback strings hardcoded the shop phone `(508) 290-7476` in both dialogs instead of interpolating `BUSINESS.phone` (already imported in both files). | `booking-dialog.tsx:150`, `question-dialog.tsx:51` — **✅ Fixed cycle 4:** both use `${BUSINESS.phone}` |

**Accepted (documented, no action):**
- Hero headline/eyebrow copy lives in `hero.tsx` — brand-identity copy, not a business fact; stats/rating DO come from `BUSINESS.stats`. Accepted by every prior audit cycle.
- `5.0 · 7,500+ vehicles detailed` string in booking-dialog success + hero uses `BUSINESS.stats` ✓ (booking-dialog hardcodes "5.0 · 7,500+" at line 593 — same brand-copy class as hero; noted, accepted).
- `docs/session_1.md` contains historical (now-fixed) statements — it is an immutable session log.

## Tier 3 — Security audit (OWASP 2025)

| Category | Verdict | Evidence |
|---|---|---|
| A01 Broken Access Control | ✅ PASS | POST-only routes (GET→405 verified live); no data-reading endpoints (zero IDOR surface); no outbound requests from user input (no SSRF) |
| A02 Security Misconfiguration | ✅ PASS | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy **verified live on prod**; `poweredByHeader: false` |
| A03 Supply Chain | ✅ PASS | `bun audit --prod` → **0 vulnerabilities**; `bun.lock` committed (workspace identity fixed cycle 4); 3 transitive pins in `overrides`; pruned dep graph (17 runtime deps) |
| A04 Cryptographic Failures | ✅ PASS | No crypto in app scope; no secrets in client bundle; PII only in gitignored+untracked SQLite |
| A05 Injection | ✅ PASS | Prisma parameterized queries only; zod at boundary; no raw SQL; `dangerouslySetInnerHTML` only for the **static** JSON-LD object (no user input — PAD S7) |
| A06 Insecure Design | ✅ PASS | Honeypot + in-memory rate limit documented ADR-005 (accepted trade-offs at this scale) |
| A07 Auth Failures | N/A | No auth by design (PRD non-goal); no accounts/sessions |
| A08 Integrity Failures | ✅ PASS | Static prerender page + immutable CDN cache; no unsigned update channel |
| A09 Logging & Alerting | ✅ PASS | Sanitized `error.message`-only logging; `[api/<route>]` prefix; no PII in logs |
| A10 Exceptional Conditions | ✅ PASS | All handlers try/catch → 500 fail-closed with call-the-shop message; resource bounds: 413 payload guard (32KB) + sliding-window rate limit (5/10min/IP) |

**Automated scanner results** (`vulnerability-scanner/scripts/security_scan.py`): 91 raw pattern hits — **all in `skills/` (excluded reference material) or false positives**: yarn/pnpm "missing lock file" (repo uses bun), `RegExp.exec()` misread as code execution, JSON-LD `dangerouslySetInnerHTML` (documented static), "no security headers config" (headers live in `next.config.ts`, verified serving on prod).

**INFO (no action):** the sandbox `Caddyfile` exposes an `XTransformPort` query-param reverse-proxy hatch (`:81`) — this is the local sandbox preview mechanism, not the production edge (live traffic is Cloudflare → host → :3000). Not shipped.

## Tier 4 — Verification gates

| Gate | Result |
|---|---|
| `npm test` × 3 TZ | 66/66 green each |
| `bunx tsc --noEmit` | clean (src + e2e) |
| `bun run lint` | clean |
| `bun run build` | green, routes match docs |
| `bun run e2e` | 31/31 green (incl. 413 contracts + axe gates) |
| `bash scripts/skill-verify.sh` | ALL CHECKS PASSED (incl. git invariants) |
| Live prod verification | booking funnel `WCC-6KADO8` persisted; question dialog OK; API contracts 400/405/413/422×3/honeypot fake-201 all pass; zero console errors; mobile FAB/sheet/anchor nav OK; SEO assets (robots/sitemap/OG/JSON-LD) correct; visual parity vs wecarecarcare.com: structure 1:1, pricing exact match, documented brand divergences only |

## Remediation backlog (plan #2 — **executed & verified this cycle**)

| ID | Severity | Fix | Status |
|---|---|---|---|
| A1 | LOW | `booking-dialog.tsx` — interpolate `CERAMIC_ADDON.price`/`regularPrice` (3 spots) | ✅ Fixed, gate green |
| A2 | LOW | `booking-dialog.tsx` + `question-dialog.tsx` — interpolate `BUSINESS.phone` in network-error strings | ✅ Fixed, gate green |
| G3 | LOW (preventive) | Codify the "content-as-data" grep into `scripts/skill-verify.sh` check 10 so A1/A2-class regressions fail the gate (SKILL §19 documented the greps; now they're executable) | ✅ Added; RED→GREEN TDD cycle observed (5 hits → 0) |

Post-remediation gate: `tsc` clean · `lint` clean · 66/66 unit · build green · 31/31 e2e · `skill-verify.sh` ALL 10 CHECKS PASSED.
