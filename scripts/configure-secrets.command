#!/usr/bin/env bash
set -euo pipefail

workspace_dir="/Users/owoblo/Downloads/marketplace-engine"
env_file="$workspace_dir/.env"

clear
echo "Saturn Star Marketplace Engine"
echo "Secure local database setup"
echo
echo "This does not send the password anywhere. Your typing will be hidden."
echo
read -r -s -p "Paste the Supabase DATABASE password, then press Return: " database_password
echo

if [[ -z "$database_password" ]]; then
  echo "No password entered. Nothing was changed."
  read -r -p "Press Return to close."
  exit 1
fi

encoded_password="$(printf '%s' "$database_password" | node -e 'let value="";process.stdin.on("data",chunk=>value+=chunk);process.stdin.on("end",()=>process.stdout.write(encodeURIComponent(value)))')"
dashboard_password="$(openssl rand -hex 24)"

ENV_FILE="$env_file" ENCODED_DATABASE_PASSWORD="$encoded_password" GENERATED_DASHBOARD_PASSWORD="$dashboard_password" node <<'NODE'
const fs = require("node:fs");
const path = process.env.ENV_FILE;
let text = fs.readFileSync(path, "utf8");
const projectRef = "ngaiyfihblwkhawsbvgm";
text = text.replaceAll("PROJECT_REF", projectRef);
text = text.replace(
  /^(DATABASE_URL="postgresql:\/\/postgres\.[^:]+:)[^@]+(@[^\n]+)$/m,
  `$1${process.env.ENCODED_DATABASE_PASSWORD}$2`,
);
text = text.replace(
  /^(DIRECT_URL="postgresql:\/\/postgres\.[^:]+:)[^@]+(@[^\n]+)$/m,
  `$1${process.env.ENCODED_DATABASE_PASSWORD}$2`,
);
text = text.replace('DASHBOARD_PASSWORD="PASTE_A_LONG_RANDOM_PASSWORD"', `DASHBOARD_PASSWORD="${process.env.GENERATED_DASHBOARD_PASSWORD}"`);
fs.writeFileSync(path, text, { mode: 0o600 });
NODE

unset database_password encoded_password dashboard_password
echo
echo "Saved securely. Database and dashboard passwords are configured."
echo "Return to Codex and say: ready now"
echo
read -r -p "Press Return to close this window."
