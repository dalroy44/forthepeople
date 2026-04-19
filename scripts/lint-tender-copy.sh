#!/bin/bash
# Tender UI copy lint — fails if any banned adjective appears in rendered
# strings. Raw code comments are allowed (they never reach the UI).
# Runs before every commit that touches tender UI (wire manually or via
# pre-commit hook).
#
# Add --include to widen coverage when new tender pages/components ship.

set -u

BANNED="suspicious|corrupt|dubious|cartel|irregular|fraudulent"

# Search source tree but exclude comments (// and /* */) by skipping lines
# that start with // or * (rough but effective for our codebase).
HITS=$(grep -rEin --include="*.tsx" --include="*.ts" \
    "$BANNED" \
    "src/app/[locale]/[state]/[district]/tenders" \
    "src/components/tenders" \
    "src/lib/tenders" \
    2>/dev/null \
  | grep -vE '^\s*(//|\*|/\*)' \
  | grep -vE 'BANNED|assertFactualCopy|ban.*adjective|banned-adjective|lint|Must not|never use' \
  || true)

if [ -n "$HITS" ]; then
  echo "❌ Banned adjective found in Tenders UI. Use factual, neutral language."
  echo "$HITS"
  exit 1
fi
echo "✅ Tender copy clean — no banned adjectives in rendered strings."
