#!/bin/zsh
set -u
label="com.saturnstar.marketplace-engine"
domain="gui/$(id -u)"
if launchctl print "$domain/$label" >/dev/null 2>&1; then
  echo "Marketplace worker service: INSTALLED"
  launchctl print "$domain/$label" | awk '/state =|pid =|last exit code =/{print "  "$0}'
else
  echo "Marketplace worker service: NOT RUNNING"
fi
echo "Recent worker activity:"
tail -n 8 /Users/owoblo/Library/SaturnStarMarketplace/.runtime/logs/worker.log 2>/dev/null || echo "  No worker log yet."
