#!/bin/zsh
set -eu
export PATH="/Users/owoblo/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
cd /Users/owoblo/Library/SaturnStarMarketplace
set -a
source .env
set +a
export FACEBOOK_MCP_ARGS="/Users/owoblo/Library/SaturnStarMarketplace/.runtime/facebook-marketplace-mcp/dist/index.js"
exec /Users/owoblo/.local/bin/npm run worker
