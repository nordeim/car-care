# Tiered Code Review + Security Audit — 2026-09-13 (cycle 3)

**Scope:** full repo excluding `skills/` (per audit policy), `docs/` history, `examples/`, `tests/*.sh` (template scaffolding).
**Method:** repo skill frameworks — `code-review-checklist` (12-category tactical scan), `code-quality-standards` (six-axis), `security-and-hardening` (three-tier boundary system), `vulnerability-scanner` (OWASP/supply-chain mindset). Every claim below is evidence-backed (file:line, command output, or live-site observation).
**Baseline:** main @ 8ee7ac3 + remediation cycle 3 changes (db-url resolver, scripts/db.ts wrapper, doc alignment).

---

## Verdict

**SHIP-READY with hardening backlog.** All documented contracts (AGENTS/CLAUDE/README/PRD/SKILL) now match the code after cycle-3 alignment. Business logic is server-authoritative, timezone-safe, contract-tested; live E2E (booking funnel + API contracts) passes against production; `bun audit --prod` reports 0 vulnerabilities; axe a11y gates (critical+serious) are 0; no raw-palette classes, no hardcoded prices/copy in JSX, no hardcoded secrets.

---

## Tier 1 — Contract conformance (docs ⇄ code)

| # | Severity | Finding | Evidence | Status |
|---|----------|---------|----------|--------|
| A1 | MEDIUM | Deleted `/api` hello-world route still documented; "14 service areas" claims ×4 vs 13 actual; test counts 49 → 57; package.json identity | AGENTS.md:37, CLAUDE.md:166, README.md:69, PRD.md:45/96/127, SKILL:368 (pre-fix) | ✅ Fixed cycle 3 |
| A2 | LOW | `call-fab.tsx` doc comment claims the FAB "hides again near the footer CTA column" — no such logic exists (only `scrollY > 400` show gate) | call-fab.tsx:9-11 vs :15-20 | ✅ Fixed round 2 — comment now matches implemented behavior |
| A3 | INFO | `docs/car-care-grok4.6.zip`, `car-care-sonnet5.zip` are historical build archives; `docs/` is documented read-only history | CLAUDE.md "Core Identity" | No action |
| A4 | PASS | JSON-LD ↔ `content.ts` facts in sync (phone, address, geo, hours, 13 areas, rating 5.0/37); design tokens ↔ `globals.css` match SKILL §4.1 | layout.tsx:54-96, content.ts:281-311 | No action |

## Tier 2 — Code quality (six-axis)

| # | Severity | Axis | Finding | Evidence | Status |
|---|----------|------|---------|----------|--------|
| B1 | LOW | Correctness | Footer `© {new Date().getFullYear()}` is baked at build time (page statically prerendered — live `x-nextjs-prerender: 1`). Year goes stale after New Year and can cause a Jan-1 hydration text mismatch. | site-footer.tsx:103 | ✅ Fixed round 2 — `suppressHydrationWarning` on the year paragraph; hydration recomputes the current year |
| B2 | LOW | Correctness | Booking dialog builds the 14-day list from the **browser-local** `new Date()` (booking-dialog.tsx:98). TZ-boundary users may see a one-day-shifted list; the API re-validates Sunday/window server-side, so impact is UX-only at day boundaries. Documented design ("client checks are UX only"). | booking-dialog.tsx:98, dates.ts | Accepted (note) |
| B3 | INFO | Correctness | Question dialog resets form via `setTimeout(…, 250)` after close — reopening within 250ms resets mid-open. Negligible. | question-dialog.tsx:64-68 | No action |
| B4 | PASS | All axes | Store, reveal, before-after, header, call-fab: clean state handling, passive scroll listeners with cleanup, pointer capture + window-pointerup cleanup, slider a11y (role/valuemin/max/now/arrows ±5) | components reviewed | No action |
| B5 | PASS | Aesthetic rigor | No raw palette classes (`rg "text-(red|blue|gray…)‑[0-9]"` → clean); no hardcoded `$` prices in any component; two-tone accent discipline holds | pattern scans | No action |

## Tier 3 — Security (OWASP-aligned)

| # | Severity | Finding | Evidence | Status |
|---|----------|---------|----------|--------|
| C1 | **MEDIUM** | **No security headers on live responses** — no HSTS, X-Frame-Options/frame-ancestors (clickjacking), X-Content-Type-Options (MIME sniffing), Referrer-Policy, Permissions-Policy, or CSP. Live `curl -I` (2026-09-13) shows none; neither Next defaults nor the Caddyfile add them. | `curl -sI https://car-care.jesspete.shop/` | ✅ Fixed round 2 — app-level `headers()` in next.config.ts; verified on the standalone build (all six headers present; `x-powered-by` gone; redeploy propagates to live) |
| C2 | **MEDIUM** | `x-powered-by: Next.js` fingerprint disclosure | live headers | ✅ Fixed round 2 (`poweredByHeader: false`; header absent from standalone response) |
| C3 | **MEDIUM** | Rate-limit key extraction trusts the **first** `x-forwarded-for` hop. Real chain is Cloudflare → Caddy → Next; Caddy *replaces* XFF with `{remote_host}` (Caddyfile), i.e. the CF edge IP — so all visitors on an edge share one 429 bucket (false lockouts), and any directly-reachable-origin path allows first-hop spoofing. `CF-Connecting-IP` (set/stripped by CF) is the reliable first choice, XFF first-hop as fallback. | rate-limit.ts:73-75, Caddyfile | ✅ Fixed round 2 (TDD) — `clientIpFrom` prefers `cf-connecting-ip` → first XFF hop → `local`; 5 contract tests; residual risk documented (ADR-005) |
| C4 | LOW | Both route handlers `await request.json()` with no size cap — large payloads cost memory/CPU before zod rejects. | api/bookings/route.ts:11, api/questions/route.ts:11 | ✅ Fixed round 2 — `payload-limit.ts` (32KB `content-length` cap → 413) wired before parse in both routes; 4 unit tests + 2 e2e specs (RED→GREEN); verified `413` on standalone |
| C5 | LOW | `z-ai-web-dev-sdk` sits in **dependencies** (ships to prod) but is used only by dev audit scripts (`scripts/vlm-*.mjs`) — needless prod supply-chain surface. | package.json:36; rg usage | ✅ Fixed round 2 — moved to devDependencies; install/build/audit re-verified |
| C6 | LOW | API failure logs dump the raw Prisma `error` object — dev query logging is off in prod but error objects can embed values (PII-adjacent). Log `error.message` instead. | api/bookings/route.ts:85, api/questions/route.ts:48 | ✅ Fixed round 2 — both routes log `error.message` only |
| C7 | INFO | Honeypot short-circuits before the rate limiter — unlimited fake-201s for bots, zero cost (no rows, no DB). Intentional per PRD F4.6. | bookings/route.ts:28-31 | Accepted |
| C8 | INFO | In-memory, per-process rate limit; resets on restart. Documented ADR-005 (single-node deploy, best-effort). | rate-limit.ts header comment | Accepted |
| C10 | **MEDIUM** | **`.env` was tracked in git** (committed) despite `.gitignore` `.env*` and explicit contracts ("must never be committed" — AGENTS.md Git, CLAUDE.md, PRD §9 hard-fail #8). Committed content is a benign template (DB path + site URLs, no secrets) so no history rewrite is needed, but tracking defeats the ignore rule and sets a PII-risk precedent. Found during commit review (`git status` showed `M .env`). | `git ls-files .env` → tracked; `git check-ignore --no-index` confirms pattern matches | ✅ Fixed round 2 — `git rm --cached .env`; local copy preserved; cloners follow `cp .env.example .env` per docs. ⚠️ **REGRESSED then re-fixed (cycle 4):** the follow-up commit `34a172d` re-tracked BOTH `.env` and `db/custom.db` (empty schema-only, no PII). Untracked again 2026-09-13 cycle 4, this time with a regression guard: `scripts/skill-verify.sh` check 9 fails the gate whenever `.env` or any `.db` is tracked. |
| C9 | PASS | Zod at boundary; Prisma parameterization (no raw SQL); `dangerouslySetInnerHTML` only for **static** server-built JSON-LD (no user input); POST-only handlers (405 on GET — verified live); `.env`/`db/*.db`/worklog/SSH keys gitignored; Prisma query logs dev-only; `bun audit --prod` → 0 findings; no hardcoded secrets pattern; honeypot fake-201 verified live on both endpoints | scans + live checks | No action |

## Tier 4 — Verification gates

| Gate | Result |
|---|---|
| `npm test` (unit) | 66/66 green (8 files); dates suite green under TZ=UTC, America/New_York, Asia/Singapore |
| `bun run e2e` | 31/31 green on standalone build (smoke, SEO/JSON-LD, funnel w/ SQLite truth + cleanup, API contracts 400/413/422/429/honeypot/201, axe critical+serious=0) |
| Standalone header check | all six security headers present; `x-powered-by` absent; manual `content-length: 40000` POST → `413` |
| `bun run lint` / `bunx tsc --noEmit` / `bun run build` | clean / clean / green |
| Live browser E2E (prod) | booking funnel → `WCC-VQZPQB` persisted; question dialog → THANKS; API contracts re-verified on prod; mobile sheet nav + anchors; 0 console errors |
| Visual parity vs `wecarecarcare.com` | structural 1:1 (all 13 source headings present); brand system parity; documented divergences only (4-step dialog, generated imagery, no chat, original copy) |
| Supply chain | `bun audit --prod` 0 findings; overrides in place (defu, deepmerge-ts, baseline-browser-mapping) |
| CI | none (documented "no Docker/CI yet") — backlog, not a blocker for this cycle |

---

## Remediation backlog (round 2 execution list)

| Order | Item | Severity | Type | TDD seam |
|---|---|---|---|---|
| 1 | C3 `clientIpFrom`: prefer `cf-connecting-ip`, then first XFF hop, then `local`; unit tests with synthesized Headers | MEDIUM | code | `client-ip.test.ts` (vitest) |
| 2 | C4 413 payload guard in both routes (>32KB body → `413`); failing e2e API spec first, then guard + unit tests for the helper | LOW | code | `api.spec.ts` + `payload-limit.test.ts` |
| 3 | C1+C2 security headers + `poweredByHeader:false` in `next.config.ts`; verify headers on standalone server via curl; full e2e re-run | MEDIUM | config | e2e suite + curl check |
| 4 | C5 move `z-ai-web-dev-sdk` to devDependencies; rebuild to prove prod graph unaffected | LOW | config | build + audit |
| 5 | C6 sanitize API error logging (`error.message` not raw object) | LOW | code | existing suites stay green |
| 6 | B1 footer year via hydration-safe client rendering | LOW | code | existing smoke/SEO e2e stay green |
| 7 | A2 fix CallFab doc comment to match implemented behavior | LOW | docs | — |
| 8 | Docs round 2: SKILL §pre-ship + §10 rows for headers/413; README security note; PRD NFR security row; this report referenced from README | LOW | docs | — |

Residual accepted risks (documented, no action): B2 browser-local day list (server-authoritative), B3 reset race, C7 honeypot unlimited, C8 in-memory limiter, A3 archives, no CI.
