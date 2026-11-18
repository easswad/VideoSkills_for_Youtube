#!/bin/bash
# Pull the REAL images (logos, screenshots, banners) from a public GitHub repo into <project>/img/.
#   bash repo_images.sh <owner/repo> <project> [branch=main] [max=25]
# Lists files without downloading the repo (blobless clone), then fetches each image from raw.githubusercontent.com.
# Use them as textures (3D) or drawImage cards (2D). Keep the repo's license in mind and credit it in the description.
set -eu
REPO="${1:?owner/repo}"; P="${2:?project}"; BR="${3:-main}"; MAX="${4:-25}"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
git clone -q --depth 1 --filter=blob:none --no-checkout -b "$BR" "https://github.com/$REPO.git" "$T/r"
mkdir -p "$P/img"
git -C "$T/r" ls-tree -r --name-only HEAD | grep -iE '\.(png|jpe?g|webp|gif|svg)$' | grep -viE 'test|fixture|node_modules' | head -n "$MAX" |
while read -r f; do
  out="$P/img/$(echo "$f" | tr '/' '_' | sed 's/^docs_//; s/^assets_//')"
  curl -fsSL "https://raw.githubusercontent.com/$REPO/$BR/$f" -o "$out" && echo "img/$(basename "$out")" || echo "skip $f"
done
