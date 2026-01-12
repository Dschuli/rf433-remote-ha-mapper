#!/bin/bash
set -e

TARGET="$1"
CONTENT="$2"

if [ -z "$TARGET" ] || [ -z "$CONTENT" ]; then
  echo "Usage: write_json_file.sh <target> <json>" >&2
  exit 1
fi

# ---- safety checks ----
case "$TARGET" in
  www/*) ;;
  *) echo "Target outside /config/www not allowed" >&2; exit 1 ;;
esac

if [[ "$TARGET" == *".."* ]]; then
  echo "Path traversal not allowed" >&2
  exit 1
fi

FULL="/config/$TARGET"
TMP="${FULL}.tmp"

# ---- write content ----
printf '%s' "$CONTENT" > "$TMP"

# ---- validate JSON ----
jq empty "$TMP"

# ---- atomic rename ----
mv "$TMP" "$FULL"
