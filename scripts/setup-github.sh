#!/usr/bin/env bash
# One-command GitHub setup for the System Architecture Catalog.
#
# Sets the repo description, website URL, and discovery topics — GitHub search
# and the "Explore topics" pages are topic-driven, so this is what opens
# organic discovery. Run from the repo root after `gh auth login`.
#
#   ./scripts/setup-github.sh
#
set -euo pipefail

REPO="system-architecture-catalog"

DESCRIPTION="A practicing architect's catalog: 9 system architectures with diagrams, trade-offs, and runnable references — plus CAP/PACELC, a quality-attribute decision matrix, and complete worked architectures (social media, banking, multi-region)."

HOMEPAGE="https://ruchitsuthar.com"

# Lowercase, hyphenated, <=20 total (GitHub limits). Tuned for how architects search.
TOPICS="software-architecture,system-design,microservices,event-driven,cqrs,event-sourcing,design-patterns,architecture-decision-records,distributed-systems,cap-theorem,serverless,ai-gateway,llm,typescript,reference-architecture"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) not found. Install it: https://cli.github.com/" >&2
  exit 1
fi

# Create + push the repo if it doesn't exist yet; otherwise just update metadata.
if ! gh repo view "$REPO" >/dev/null 2>&1; then
  echo "Creating public repo '$REPO' from this folder and pushing..."
  gh repo create "$REPO" --public --source=. --remote=origin --push \
    --description "$DESCRIPTION" --homepage "$HOMEPAGE"
else
  echo "Repo exists — updating description and homepage..."
  gh repo edit "$REPO" --description "$DESCRIPTION" --homepage "$HOMEPAGE"
fi

echo "Setting topics..."
gh repo edit "$REPO" --add-topic "$TOPICS"

echo "✅ Done: description, homepage ($HOMEPAGE), and topics set on $REPO."
echo "   Topics: $TOPICS"
