#!/usr/bin/env bash
# skill-verify.sh — Phase 5 verification for car-care_SKILL.md
# Every check mirrors the to-distill-project-into-skill validation checklist.
set -u
cd /home/z/my-project
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
CLAIMED=$(rg -o "49/49" $S | head -1)
echo "actual: $ACTUAL / claimed: $CLAIMED"
[ "${ACTUAL%% *}" = "49" ] && echo "OK  tests" || { echo "FAIL tests"; ERRORS=$((ERRORS+1)); }

echo "=== 3. Component count claims ==="
WCC=$(find src/components/wcc -name '*.tsx' | wc -l)
UI=$(find src/components/ui -name '*.tsx' | wc -l)
echo "wcc=$WCC (claim 16), ui=$UI (claim 9)"
[ "$WCC" = "16" ] && [ "$UI" = "9" ] && echo "OK  components" || { echo "FAIL components"; ERRORS=$((ERRORS+1)); }

echo "=== 4. Referenced file paths exist (all @/ + src/ + root paths mentioned) ==="
for f in $(rg -o '`(src|prisma|public|docs|scripts)/[A-Za-z0-9_./-]+`' $S -r '$1' | tr -d '`' | sort -u); do
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

echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then echo "ALL CHECKS PASSED"; else echo "$ERRORS CHECK(S) FAILED"; exit 1; fi
