#!/usr/bin/env bash
set -euo pipefail

workspace_dir="$(cd "$(dirname "$0")/.." && pwd)"
archive_path="${1:-/Users/owoblo/Downloads/facebook-marketplace-mcp-master.zip}"
runtime_parent="$workspace_dir/.runtime/facebook-marketplace-mcp-extract"
runtime_dir="$workspace_dir/.runtime/facebook-marketplace-mcp"

test -f "$archive_path" || { echo "Archive not found: $archive_path" >&2; exit 1; }
mkdir -p "$workspace_dir/.runtime"
rm -rf "$runtime_parent"
mkdir -p "$runtime_parent"
unzip -oq "$archive_path" -d "$runtime_parent"
rm -rf "$runtime_dir"
mv "$runtime_parent/facebook-marketplace-mcp-master" "$runtime_dir"
rmdir "$runtime_parent"
patch -d "$runtime_dir" -p1 < "$workspace_dir/patches/facebook-marketplace-mcp-primary-image.patch"
npm ci --prefix "$runtime_dir"
npm run build --prefix "$runtime_dir"
echo "Facebook MCP runtime ready: $runtime_dir/dist/index.js"
