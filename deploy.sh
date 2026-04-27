#!/usr/bin/env bash
# Ad-hoc deploy for perplexing-trades-market-alpha (GitHub Pages)
# GitHub-only workflow — no Huxity / Perplexity Computer sandbox dependency.
#
# Usage:
#   bash deploy.sh "Session #016 Midday Pulse"
#   bash deploy.sh --dry-run
#   bash deploy.sh                        # auto-message with timestamp
#
# Notes:
#   - Works from any local clone; no hardcoded paths.
#   - Refuses to commit private/Huxity-side files (portfolio*.html, play_targets*.json,
#     perplexing-trades-reimagined/, .netlify/, .env*, keys, anything matching *_private*).
#   - On push, GitHub Actions (.github/workflows/pages.yml) handles the actual deploy.

set -euo pipefail

# --- 1. Locate repo root ----------------------------------------------------
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "❌ Not inside a git repo. cd into a clone of perplexing-trades-market-alpha first." >&2
  exit 1
fi
cd "$REPO_ROOT"

# --- 2. Verify correct repo and branch --------------------------------------
ORIGIN_URL="$(git remote get-url origin 2>/dev/null || true)"
if [[ "$ORIGIN_URL" != *"perplexing-trades-market-alpha"* ]]; then
  echo "❌ origin remote is '$ORIGIN_URL' — expected perplexing-trades-market-alpha." >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "❌ On branch '$BRANCH'. Switch to main before deploying." >&2
  exit 1
fi

# --- 3. Parse args ----------------------------------------------------------
DRY_RUN=0
MSG=""
for arg in "$@"; do
  case "$arg" in
    --dry-run|-n) DRY_RUN=1 ;;
    -h|--help)
      sed -n '2,12p' "$0"; exit 0 ;;
    *) MSG="$arg" ;;
  esac
done
MSG="${MSG:-Site update $(date -u +%Y-%m-%dT%H:%MZ)}"

# --- 4. Forbidden-file guard (defense-in-depth, .gitignore is the primary) --
FORBIDDEN_PATTERNS=(
  '(^|/)portfolio.*\.html$'
  '(^|/)play_targets.*\.json$'
  '(^|/)perplexing-trades-reimagined/'
  '(^|/)archives/'
  '(^|/)\.netlify/'
  '(^|/)\.env($|\.)'
  '_private($|[/.])'
  '\.pem$'
  '\.key$'
  '\.p12$'
)

check_forbidden_file() {
  local f="${1#./}"
  [[ -z "$f" ]] && return 0
  for pat in "${FORBIDDEN_PATTERNS[@]}"; do
    if [[ "$f" =~ $pat ]]; then
      echo "❌ Forbidden file in tree: $f  (pattern: $pat)" >&2
      echo "   Remove it or add to .gitignore before deploying." >&2
      exit 1
    fi
  done
}

while IFS= read -r f; do
  check_forbidden_file "$f"
done < <(
  {
    git ls-files
    git status --porcelain --untracked-files=all | awk 'substr($0,1,2) !~ /D/ {print substr($0,4)}' | sed 's/ -> /\
/g'
  } | sort -u
)

# --- 5. Show status, push (or stop if dry-run) ------------------------------
echo "──────────────────────────────────────────────"
echo "Repo:    $(basename "$REPO_ROOT")"
echo "Branch:  $BRANCH"
echo "Message: $MSG"
echo "──────────────────────────────────────────────"
git status --short

if (( DRY_RUN )); then
  echo "── dry-run: nothing committed or pushed."
  exit 0
fi

if [[ -z "$(git status --porcelain)" ]]; then
  echo "No changes to commit. Triggering remote workflow only."
  command -v gh >/dev/null && gh workflow run pages.yml 2>/dev/null \
    && echo "✅ Manual Pages workflow dispatched." \
    || echo "ℹ️  Install gh CLI to dispatch workflows from terminal."
  exit 0
fi

git add -A
git commit -m "$MSG"
git push origin main

echo "✅ Pushed to main. GitHub Actions will deploy to:"
echo "   https://aurelius808.github.io/perplexing-trades-market-alpha/"
echo "Watch: gh run watch  (or open the Actions tab in GitHub)"
