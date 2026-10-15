#!/usr/bin/env bash
# Copy web game into Android assets (run from Ajudoku/apk/).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$(cd "$(dirname "$0")" && pwd)/android/app/src/main/assets"
mkdir -p "$ASSETS"
rm -rf "${ASSETS:?}/"*

copy() {
  if [[ -f "$1" ]]; then
    cp "$1" "$ASSETS/$(basename "$2")"
  else
    echo "Missing: $1" >&2
    exit 1
  fi
}

copy "$ROOT/index.html" index.html
copy "$ROOT/game.js" game.js
copy "$ROOT/levels.js" levels.js
copy "$ROOT/style.css" style.css
copy "$ROOT/aju-face.png" aju-face.png
copy "$ROOT/aju-face-angry.png" aju-face-angry.png
copy "$ROOT/maroon-shirt-funny-dance.gif" maroon-shirt-funny-dance.gif

if [[ -f "$ROOT/marriage.mov" ]]; then
  copy "$ROOT/marriage.mov" marriage.mov
elif [[ -f "$ROOT/marriage.MOV" ]]; then
  cp "$ROOT/marriage.MOV" "$ASSETS/marriage.mov"
else
  echo "Warning: no marriage video found" >&2
fi

echo "Synced web assets -> $ASSETS"
