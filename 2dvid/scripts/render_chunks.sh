#!/bin/bash
# Render a finished project in N parallel chunks, join them losslessly and add the mixed audio.
#   bash render_chunks.sh <project> <out-name> [chunks=4] [--3d]
# 2D comic: full quality at 30 fps.  --3d: software GL, res 0.6, no AA, 1024 shadows, 24 fps (fits a CPU box).
# Needs data/lines.json and data/mix.wav (run tools/mix.py first). Output: <project>/renders/<out-name>.mp4
set -eu
P="$(cd "${1:?project}" && pwd)"; NAME="${2:?out-name}"; N="${3:-4}"; MODE="${4:-}"
cd "$P"; [ -f data/mix.wav ] || { echo "data/mix.wav missing: run tools/mix.py first" >&2; exit 2; }
DUR=$(python3 -c "import json;print(json.load(open('data/lines.json'))['duration'])")
if [ "$MODE" = "--3d" ]; then export SOFTWARE_GL=1 QS='&res=0.6&aa=0&shadow=1024' FPS=24; fi
mkdir -p renders; : > renders/list.txt; PIDS=()
for k in $(seq 0 $((N - 1))); do
  A=$(python3 -c "print(round($DUR*$k/$N,3))"); B=$(python3 -c "print(round($DUR*($k+1)/$N,3))")
  echo "file 'part_$k.mp4'" >> renders/list.txt
  node tools/capture.mjs video "renders/part_$k.mp4" "$A" "$B" > "renders/log_$k.txt" 2>&1 & PIDS+=($!)
  echo "chunk $k: $A-$B s (log renders/log_$k.txt)"
done
FAIL=0; for p in "${PIDS[@]}"; do wait "$p" || FAIL=1; done
[ $FAIL = 0 ] || { echo "a chunk failed: see renders/log_*.txt" >&2; exit 1; }
ffmpeg -v error -y -f concat -safe 0 -i renders/list.txt -c:v copy -an renders/_video.mp4
ffmpeg -v error -y -i renders/_video.mp4 -i data/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "renders/$NAME.mp4"
rm -f renders/_video.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 "renders/$NAME.mp4" | xargs printf "renders/$NAME.mp4 (%.2f s)\n"
