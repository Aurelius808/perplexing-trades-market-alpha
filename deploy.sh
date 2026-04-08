#!/bin/bash
# Deploy public site to GitHub Pages
# Run with: bash /home/user/workspace/perplexing-trades-public/deploy.sh "commit message"

cd /home/user/workspace/perplexing-trades-public
MSG="${1:-Auto-update: Session $(date +%Y-%m-%d)}"
git add -A
git commit -m "$MSG" 2>/dev/null || echo "Nothing to commit"
git push origin main
echo "Deployed to https://aurelius808.github.io/perplexing-trades-market-alpha/"
