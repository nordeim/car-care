#!/usr/bin/env bash
# capture-sections.sh — capture a screenshot per <section>/major heading of
# the page currently open in the given agent-browser session.
# Usage: capture-sections.sh <session> <outdir>
set -euo pipefail
SESSION="$1"
OUT="$2"
mkdir -p "$OUT"

ab() { agent-browser --session "$SESSION" "$@" >/dev/null 2>&1; }

# Collect section headings (h1 + h2) with their scroll positions
ab eval "window.scrollTo(0,0)"
ab wait 800
COUNT=$(agent-browser --session "$SESSION" eval "Array.from(document.querySelectorAll('h1, h2')).filter(h => h.offsetParent !== null).length" 2>/dev/null | tail -1 | tr -d '"')
echo "headings found: $COUNT"

i=0
while [ "$i" -lt "${COUNT:-0}" ]; do
  # scroll the i-th heading into view
  agent-browser --session "$SESSION" eval "(() => { const hs = Array.from(document.querySelectorAll('h1, h2')).filter(h => h.offsetParent !== null); const h = hs[$i]; if (h) { h.scrollIntoView({block:'start'}); return 'ok'; } return 'none'; })()" >/dev/null 2>&1
  agent-browser --session "$SESSION" wait 900 >/dev/null 2>&1
  agent-browser --session "$SESSION" screenshot "$OUT/section-$(printf '%02d' "$i").png" >/dev/null 2>&1 || true
  i=$((i + 1))
done
ls "$OUT" | head -30
