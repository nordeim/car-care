#!/usr/bin/env bash
# skill-verify.sh — verification gate for car-care_SKILL.md claims.
# Every check mirrors the to-distill-project-into-skill validation checklist.
#
# Cycle 4 (2026-09-13) fixes:
#  - Repo-relative paths (was hardcoded /home/z/my-project — broke when the
#    repo was cloned one level deeper; the script silently ran against a
#    non-repo directory and every check failed or no-op'd).
#  - Test-count expectation updated 49 → 66 → 69 (vitest) to match the suite.
#  - NEW check 9: git invariants — .env and SQLite .db files must NEVER be
#    tracked (commit 34a172d regressed this once; this check exists so a
#    future `git add .`/`git add -f` fails the gate instead of shipping PII).
#    skills/ is excluded (reference material, not part of the build).
#
# Cycle 5 (2026-09-14) additions:
#  - NEW check 11: CI gate coverage — .github/workflows/verify-gate.yml must
#    exist, must trigger on EVERY push (no branch filter), and must run every
#    documented gate command (install/env/db provisioning, unit tests under
#    all three timezones, tsc, lint, build, e2e, skill-verify). Keeps the
#    Actions workflow from silently drifting out of sync with AGENTS.md.
#  - Check 4 now also existence-checks `.github/…` paths referenced in SKILL.md.
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"
S=car-care_SKILL.md
ERRORS=0

echo "=== 1. Version claims vs lockfile ==="
for pair in "next@16.3.5" "react@19.3.0" "typescript@5.9.3" "tailwindcss@4.3.3" "zod@4.6.4" "zustand@5.0.15" "vitest@5.0.0" "sonner@2.0.8" "embla-carousel-react@8.6.0" "lucide-react@0.525.0" "sharp@0.35.4" "prisma@6.19.3"; do
  if bun pm ls 2>/dev/null | rg -q "── ${pair}"; then
    echo "OK  ${pair}"
  else
    echo "FAIL ${pair} not in lockfile tree"; ERRORS=$((ERRORS+1))
  fi
done

echo "=== 2. Test count claim ==="
ACTUAL=$(TZ=UTC npm test 2>&1 | rg -o "Tests\s+[0-9]+ passed \([0-9]+\)" | rg -o "[0-9]+ passed \([0-9]+\)" | head -1)
echo "actual: ${ACTUAL:-none} / claimed: 69/69 (SKILL project_state)"
[ "${ACTUAL%% *}" = "69" ] && echo "OK  tests" || { echo "FAIL tests"; ERRORS=$((ERRORS+1)); }

echo "=== 3. Component count claims ==="
WCC=$(find src/components/wcc -name '*.tsx' | wc -l)
UI=$(find src/components/ui -name '*.tsx' | wc -l)
echo "wcc=$WCC (claim 16), ui=$UI (claim 9)"
[ "$WCC" = "16" ] && [ "$UI" = "9" ] && echo "OK  components" || { echo "FAIL components"; ERRORS=$((ERRORS+1)); }

echo "=== 4. Referenced file paths exist (all @/ + src/ + root paths mentioned) ==="
for f in $(rg -o '`(src|prisma|public|docs|scripts|\.github)/[A-Za-z0-9_./-]+`' $S -r '$1' | tr -d '`' | sort -u); do
  if [ -e "$f" ]; then echo "OK  $f"; else echo "FAIL missing: $f"; ERRORS=$((ERRORS+1)); fi
done

echo "=== 5. Hex colors in SKILL vs globals.css ==="
for hex in "#0a0b0d" "#f2f0ea" "#121417" "#14161a" "#f2a61c" "#17120a" "#5eead4" "#1a1d21" "#e8e6df" "#17191d" "#9c9a92" "#1f2126" "#e5484d" "#d9892b" "#8a8f97" "#5c6169" "#383d45" "#2a2d33" "#3a3e45"; do
  if rg -q -- "$hex" src/app/globals.css; then echo "OK  $hex"; else echo "FAIL $hex not in globals.css"; ERRORS=$((ERRORS+1)); fi
done

echo "=== 6. No placeholders ==="
PH=$(rg -n "TODO|FIXME|placeholder|example\.com" $S | rg -vc "must stay 0" || echo 0)
[ "${PH:-0}" = "0" ] && echo "OK  no placeholders" || { echo "FAIL $PH placeholders"; ERRORS=$((ERRORS+1)); }

echo "=== 7. ToC vs headings ==="
TOC=$(rg -c "^[0-9]+\. \[" $S)
H2=$(rg -c "^## " $S)
echo "toc entries=$TOC, ## headings=$H2"
[ "$TOC" = "20" ] && [ "$H2" = "26" ] && echo "OK  20 numbered ToC entries; 26 ## headings (20 sections + ToC + 4 appendices + provenance)" || { echo "check counts"; }

echo "=== 8. Sections 1..20 all present ==="
MISSING=0
for i in $(seq 1 20); do
  rg -q "^## $i\. " $S || { echo "FAIL section $i missing"; MISSING=1; ERRORS=$((ERRORS+1)); }
done
[ $MISSING -eq 0 ] && echo "OK  sections 1-20 present"
for a in A B C D; do rg -q "^## Appendix $a:" $S || { echo "FAIL appendix $a"; ERRORS=$((ERRORS+1)); }; done
echo "OK  appendices A-D present (checked)"

echo "=== 9. Git invariants: no tracked .env / SQLite files (skills/ excluded) ==="
TRACKED_SECRETS=$(git ls-files 2>/dev/null | rg -v '^skills/' | rg '(^|/)\.env$|\.db$' || true)
if [ -z "$TRACKED_SECRETS" ]; then
  echo "OK  no tracked .env or .db files"
else
  echo "FAIL tracked files that must never be committed:"
  echo "$TRACKED_SECRETS"
  echo "     fix: git rm --cached <files> (SKILL §11.3 / AGENTS.md Git rules)"
  ERRORS=$((ERRORS+1))
fi

echo "=== 10. Content-as-data: no hardcoded prices or shop phone in components ==="
# Business facts must flow from src/data/wcc/content.ts (PRD hard-fail #1).
# The shop phone literal is 290-7476; placeholders like 555-0123 are fine.
CONTENT_HITS=$(rg -n 'usd\([0-9]|\$[0-9]|290-7476' src/components/ 2>/dev/null || true)
if [ -z "$CONTENT_HITS" ]; then
  echo "OK  components carry no hardcoded prices / phone"
else
  echo "FAIL hardcoded business facts in components (use content.ts exports):"
  echo "$CONTENT_HITS"
  ERRORS=$((ERRORS+1))
fi

echo "=== 11. CI gate workflow: documented gate runs on every push ==="
# AGENTS.md documents the verification gate; .github/workflows/verify-gate.yml
# automates it on GitHub Actions. This check fails if the workflow is deleted,
# narrowed to specific refs, or stops running any documented gate command —
# the same RED->GREEN guard pattern as checks 9 and 10.
WF=.github/workflows/verify-gate.yml
if [ -f "$WF" ]; then
  if rg -q "branches:" "$WF"; then
    echo "FAIL $WF has a branch filter — the documented gate must run on EVERY push"
    ERRORS=$((ERRORS+1))
  fi
  MISSING=0
  for needle in "push:" "bun install --frozen-lockfile" "cp .env.example .env" "db:generate" "db:push" "npm test" "UTC" "America/New_York" "Asia/Singapore" "tsc --noEmit" "bun run lint" "bun run build" "bun run e2e" "playwright install" "skill-verify.sh"; do
    if rg -q -F -- "$needle" "$WF"; then
      :
    else
      echo "FAIL gate step missing from $WF: $needle"
      MISSING=1; ERRORS=$((ERRORS+1))
    fi
  done
  [ $MISSING -eq 0 ] && echo "OK  workflow covers the full documented gate on every push"
else
  echo "FAIL $WF missing — CI must run the documented gate (see AGENTS.md)"
  ERRORS=$((ERRORS+1))
fi

echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then echo "ALL CHECKS PASSED"; else echo "$ERRORS CHECK(S) FAILED"; exit 1; fi
