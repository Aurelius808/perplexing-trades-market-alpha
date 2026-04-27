#!/usr/bin/env bash
# Public-only privacy audit for perplexing-trades-market-alpha.
#
# Fails (exit 1) if any forbidden file or forbidden content pattern is found
# in the working tree. Safe to run locally, in deploy.sh, and in CI.
#
# Usage: bash scripts/public-audit.sh

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

fail=0

# --- 1. Forbidden filenames / paths ----------------------------------------
BAD_PATHS="$(find . \
  \( -path ./.git -prune \) -o \
  \( -iname 'portfolio*.html' \
     -o -iname 'play_targets*.json' \
     -o -iname '.env' \
     -o -iname '.env.*' \
     -o -iname '*_private.*' \
     -o -path './perplexing-trades-reimagined/*' \
     -o -path './archives/*' \
  \) -print 2>/dev/null)"

if [[ -n "$BAD_PATHS" ]]; then
  echo "❌ Forbidden files present:"
  echo "$BAD_PATHS" | sed 's/^/   /'
  fail=1
fi

# --- 2. Forbidden content patterns -----------------------------------------
# Scan only public site files; ignore the audit script itself, deploy.sh,
# the pages workflow, .gitignore, and methodology.html (which describes the
# public-only rule meta-textually).
SCAN_FILES=$(git ls-files \
  | grep -Ev '^(scripts/public-audit\.sh|deploy\.sh|\.github/workflows/pages\.yml|\.gitignore|methodology\.html|README\.md)$' \
  | grep -E '\.(html|js|css|json|md)$' || true)

# Patterns that must never appear in public site copy.
# Word-boundaried where possible to avoid false positives on disclaimers.
PATTERNS=(
  'your PLTR'
  'you own'
  'cost basis'
  'share count'
  'shares held'
  'P&L'
  'PnL'
  'perplexity\.ai/computer'
  'perplexing-trades-reimagined'
  'play_targets'
  'huxity'
  'portfolio\.html'
)

if [[ -n "$SCAN_FILES" ]]; then
  for pat in "${PATTERNS[@]}"; do
    hits=$(grep -InE "$pat" $SCAN_FILES 2>/dev/null || true)
    if [[ -n "$hits" ]]; then
      echo "❌ Forbidden content pattern '$pat':"
      echo "$hits" | sed 's/^/   /'
      fail=1
    fi
  done
fi

if (( fail )); then
  echo ""
  echo "Public audit FAILED. Fix the issues above before deploying."
  exit 1
fi

echo "✅ Public audit clean: no forbidden files or phrases."
