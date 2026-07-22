#!/bin/zsh
set -eu
launchctl kickstart -k "gui/$(id -u)/com.saturnstar.marketplace-engine"
echo "Marketplace worker restarted."
