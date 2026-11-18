---
name: 3dvid
description: End-to-end vertical 3D cartoon story short, from trending true-story topic to script, free UK voice, three.js/Remotion world, original score and SFX, sticker captions, 2K render, cover, and YouTube upload into the Shorts playlist with a subscribe link.
---

# 3DVID: cartoon 3D story shorts, topic to YouTube

A ~55-70 s vertical short (1440x2560, 30 fps) in which flat 2D characters act out a true story in a colourful 3D toon world. One physics idea is explained with an everyday analogy. Proven on "Slower Than Molasses in January" (1919 Boston Molasses Flood, 69.7 s), which is in `templates/molasses/` and `examples/molasses/`.

## Config (edit for another user or channel)
| Key | Value |
|---|---|
| Channel / subscribe link | `https://www.youtube.com/@easswad` |
| Playlist | `#Shorts | For very short videos` |
| Render PC + synced folder | Windows PC via Remote Control; `C:\ZapierAi Folder\3D\<name>-render` (Google Drive for desktop syncs `C:\ZapierAi Folder`) |
| Upload path | Zapier: Google Drive "Find a File" → YouTube "Upload Video" → YouTube "Add Video to Playlist" |
| Voice | Kokoro TTS `bm_fable` (free, UK male) |

## Standing rules
- **Story:** true and researched, with a source on every fact. Our own script, characters and shots. Never copy, name or upload a reference channel's videos.
- **Tone:** jokes land on the people or companies at fault, never on victims.
- **Language and voice:** English only, one steady narrator tone. Free tools only: don't spend vidIQ or Higgsfield credits without asking.
- **Approvals:** get the user's approval on the topic and on the script. After that, just do it.
- **Mix:** voice unchanged, music bed about 10 LU under the voice (the "+3 dB music" standard), SFX stem -6 dB. Master -15 LUFS, true peak ≤ -1.2 dBTP, 48 kHz.
- **On-screen text is ON:** sticker captions plus a top source tag (step 7).
- **Every upload:** public, not made for kids, category Education. The description ends with the subscribe link, and the video goes into the playlist above.
- **Saving:** save work after every step. Put deliverables in the project files folder.

## Pipeline
### 1. Topic
Find true stories trending in the last few days, with demand evidence (5M+ views on similar shorts, YouTube links). Prefer a story with visible physical cause and effect, and an everyday analogy that explains it. Give the user a table of options to pick from. Never offer AI parodies of real people or hoaxes.

### 2. Script (≈3.7 words/s, 55-70 s, about 250 words)
Write `SCRIPT.md` with the facts and their sources at the top. Beat formula (see `examples/molasses/SCRIPT.md`):
1. Hook: the absurd fact in one line.
2. Setting.
3. Escalation over 3-4 beats.
4. Snap: the moment it breaks.
5. Deadpan "Luckily… / Unluckily…".
6. "You see…" plus the everyday analogy.
7. Consequence: the rule or law it created.
8. Callback twist.

Never narrate what the viewer already sees.

### 3. Voice (free)
Setup:
```
pip install kokoro-onnx soundfile librosa
```
Put `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the GitHub releases of thewh1teagle/kokoro-onnx (`model-files-v1.0`) in `$KOKORO_DIR` (default `~/tts`). HuggingFace and edge-tts may be blocked.

Generate the narration:
```
python scripts/voice/narrate_timed.py bm_fable 1.32 lines.txt voice/ 0.08   # one script line per text line
python scripts/voice/align.py bm_fable 1.32 voice/                         # DTW word timings → voice/words.json
```
- Speed is very nonlinear: 1.30 gave 71.6 s, 1.32 gave 69.6 s and 1.35 gave 60.8 s for 254 words.
- Everything downstream is timed to `words.json` (frame = word start × 30).

### 4. 3D world + shots (Remotion + three.js)
1. Copy `templates/molasses/` (the newest) or `templates/bridge/` to `src/videos/<name>/`.
2. Register the composition in `src/Root.tsx` (1080x1920, 30 fps).
3. Install `@remotion/three`, `three@0.169`, `@react-three/fiber@8`, `@react-three/postprocessing@2`, `postprocessing@6` and `@remotion/google-fonts` (same version as remotion).

Where things live:
- `story.ts`: SHOTS, XFADE, FLASH_AT, per-shot cameras, kicks, DOF.
  - Every visual reaction lands 0-3 frames before its word.
  - Every hold creeps (push-in), and cuts happen on big jumps.
- `world.ts`: sky, ground, buildings with sight-line culling, story props posed per frame. The sun is frozen per shot and camera-relative.
- `cast.ts` / `toon.ts` / `cardshade.ts`: billboard characters drawn with the Canvas2D `Pen` (bean heads, stick limbs, plum ink, layer NOINK).
- Post (`<Name>.tsx`, `ink.ts`, `lensblur.ts`, `grade.ts`):
  - Order: ink → lens blur → bloom → NEUTRAL tone map → grade, MSAA 4.
  - Pixel parameters scale with height / 1920.

Look targets and readability traps are listed under "Look rules" below.

### 5. Look checks
Render stills at half scale:
```
npx remotion still src/index.ts <Comp> out/x.png --frame=N --scale 0.5 --props='{"post":{"dpr":0.5},"text":false}'
```
- In a Linux cloud box, add `--browser-executable=<chromium> --gl=swangle`.
- Fix z-fighting by moving interior sets far away (±600 m), along with props that block the camera.
- Remove huge near-lens blobs and anything that reads wrong.
- Optional: side-by-side sheets (`scripts/qa/sbs_sheet.py`) and a verifier pass.

### 6. Sound (original, synthesized)
`templates/audio/molasses_example/molasses_audio.py` is a complete single-file pipeline. It imports `dsp.py`, `instruments.py` and `sfx_gen.py` from `templates/audio/`. The bridge version is split into `timeline.py`, `sfx.py`, `music.py` and `mix.py`.
1. Copy it.
2. Set FPS/TOTAL, SHOTS and the event frames from story.ts.
3. Write the SFX events and the music cue list.
4. Run with `WORDS_JSON=... VOICE_WAV=... python molasses_audio.py`.

It outputs `mix.wav` (exact length), stems and `cues.md`. The voice ducks the music by about 3 dB, and short-term limiting keeps SFX at least 5 LU under the voice.

Lock the picture timing before making the sound. Any timing change means re-running it.

### 7. On-screen text (house sticker style)
1. Copy `templates/molasses/Captions.tsx`.
2. Write `captions_spec.txt`:
   - One line per script line, with chunks of 1-3 words separated by `|`.
   - Mark key words with `*`. They go in a yellow box.
   - Write numbers as digits, and use `#n` when the display word count differs from the spoken one.
   - Put `TAG: SOURCE: …` before each fact line. The first tag is a date/place tag, e.g. `BOSTON · 15 JANUARY 1919`.
3. Generate the data file:
   ```
   python scripts/captions/make_captions.py voice/words.json captions_spec.txt src/videos/<name>/captions-data.ts -v
   ```
4. In the main component, render `{getInputProps().text !== false && <Captions />}` last, on top of everything.

The style:
- Captions sit ~68% down. Poppins Black caps in white with a thick black outline and hard shadow.
- Key words get a slanted #FFD43B box with a black border, popping in with a spring.
- The source tag is a small white box with a black border near the top (128 px at 1080).
- The font loads from Google Fonts at render time, so the render needs internet.

### 8. Final render (on the PC; the cloud CPU takes hours)
Package the project without node_modules, plus mix.wav, into the synced/render folder. Then, in a Remote Control session:
```
npm i
npx remotion render src/index.ts <Comp> out/<name>_video.mp4 --codec h264 --crf 16 --scale 1.3333333333333333 --concurrency 4 --timeout 300000
ffmpeg -i out/<name>_video.mp4 -i mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -shortest out/<name>_final_text.mp4
```
- `--scale` must be exactly 4/3, or Remotion rejects the non-integer height.
- Concurrency 8 ran out of memory on a 890M laptop. Concurrency 4 renders ~5.5 fps, about 6-7 min for 70 s.
- In the cleanup effect, call `InkPass.prototype.dispose.call(fx.ink)`, not `fx.ink.dispose()`.
- QA: `python scripts/qa/short_qa.py final.mp4 qa/ shots.json` checks for black, white, frozen and pop frames and for loudness. Also spot-check frames for the font, clipping and faces.

### 9. Cover / thumbnail
1. Render a 1080x1920 still of the most dramatic moment with `{"text":false}`.
2. Run:
   ```
   python scripts/cover/make_cover.py frame.png <name>_cover_1080x1920.jpg --font Poppins-Black.ttf --top "A 25-FOOT" --key "MOLASSES" --big "WAVE" --badge "BOSTON 1919" --sub "@easswad"
   ```
The output is a JPEG under 2 MB (YouTube's thumbnail limit). Save it next to the mp4 in the Drive-synced folder.

### 10. Upload (Drive sync + Zapier, no public links)
1. Wait until the Zapier Google Drive "Find a File" action finds both the mp4 and the cover. It returns a `file` reference you can pass straight on.
2. Run Zapier YouTube "Upload Video" with:
   - `video`: the file reference.
   - `thumbnail`: the cover reference.
   - A title (≤ 70 chars, hook + emoji + "(True Story)").
   - Tags.
   - `privacy_status=public`, `made_for_kids=false`, `category_id` Education, `default_language=en`, `notify_subscribers=true`.
   - A description in this order: hook line, emoji fact bullets, a comment question, Sources, hashtags ending in `#Shorts`, then **"Subscribe for more: https://www.youtube.com/@easswad"**.
3. Run YouTube "Add Video to Playlist" into **#Shorts | For very short videos**. Resolve the ID from the action's playlist list. Don't use the other playlist simply named "Shorts".
4. Verify through the YouTube API that the video is public, processed and has the thumbnail. Give the user the link.

Notes:
- If the thumbnail fails, run "Update Video Thumbnail" (needs a phone-verified channel).
- Every Zapier call uses a task from the plan. If the monthly limit is hit, tell the user and stop.

## Look rules (from the proven shorts)
- **Ink:** world lines #030303, 5.1 px near → 3.3 px far at 1080. No ink on character cards.
- **Day light:** sky #3e7fd2 → #b8d0ec, fog = horizon colour. Shade is cool only in the shadows. Molasses/liquids get warm brown (#4f240f), with the sun behind the camera on wave shots.
- **DOF:** about 1/3 of screen time (close-ups 12-16 px at 1080), wides stay sharp.
- **Characters:** 3.5 head-heights, blinks every 0.5-2.3 s, walk bob 5%, contact shadows.
- **Traps:**
  - Props within 2 m of the lens become blobs.
  - A swing drawn with one rope reads as a hanging.
  - Signs lit from the side turn grey.
  - Flat holds read as freezes. Every hold needs a creeping push-in.
- **Grain:** keep film grain OFF, since it quadruples the file size.
- **Disk:** Remotion bundles copy `public/` into the temp folder every time. Delete old `remotion-webpack-bundle-*` folders when done.

## Files in this skill
- `templates/molasses/`: the newest full source, including Captions.tsx and captions-data.ts.
- `templates/bridge/`: the first proven source (MIT, see the LICENSE file).
- `templates/audio/`: the sound engine and `molasses_example/`.
- `scripts/voice/`: Kokoro narration and word alignment.
- `scripts/captions/make_captions.py`
- `scripts/cover/make_cover.py`
- `scripts/qa/`: stills, QA and side-by-side tools.
- `examples/molasses/`: script, captions spec and the YouTube description.
