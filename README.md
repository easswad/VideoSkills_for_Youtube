# VideoSkills for YouTube

Two Claude skills that turn a topic into a finished, uploaded YouTube Short:

| Skill | What it makes | Download | Setup guide |
|---|---|---|---|
| **[3D-VID Skill for YTB Shorts](#3d-vid-skill-for-ytb-shorts)** (`3dvid/`) | True-story cartoon 3D shorts (Remotion + three.js), UK narrator | [3DVID.zip](https://github.com/easswad/VideoSkills_for_Youtube/raw/main/dist/3DVID.zip) | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| **[2D-VID Skill for YTB Shorts](#2d-vid-skill-for-ytb-shorts)** (`2dvid/`) | AI-tool reveals and AI news in comic 2D or 3D (hacker lab / real studio with the tool's real images), 1-2 voices | [2DVID.zip](https://github.com/easswad/VideoSkills_for_Youtube/raw/main/dist/2DVID.zip) | [docs/DEPLOYMENT-2DVID.md](docs/DEPLOYMENT-2DVID.md) |

---

# 3D-VID Skill for YTB Shorts

> **Full setup guide (install, render PC, Remote Control, Google Drive, Zapier, YouTube): [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

**3DVID** is a Claude skill that produces a complete ~55-70 second vertical YouTube Short in which flat 2D cartoon characters act out a true story inside a colourful 3D toon world. A narrator explains the physics behind it with an everyday analogy. One run covers everything:

> topic research → script → free UK narrator voice → 3D world and shots → original music and sound effects → on-screen sticker captions → 2K render → cover image → YouTube upload into a Shorts playlist with a subscribe link

**Example output:** [A 25-Foot Wave of Molasses Hit Boston 🍯🌊 (True Story)](https://www.youtube.com/watch?v=VVeS6fy8D8w). It's about the 1919 Boston Molasses Flood: 69.7 s, 1440x2560, made entirely with this skill.

---

## What you get

| Stage | What the skill does | Tooling |
|---|---|---|
| 1. Topic | Finds trending true stories with demand evidence (similar Shorts with 5M+ views) and offers a table to pick from | Web / YouTube research |
| 2. Script | ~250 words at 3.7 words/s, using a proven beat formula: hook → setting → escalation → snap → "Luckily… / Unluckily…" → "You see…" analogy → consequence → callback twist. Every fact is sourced. | Claude |
| 3. Voice | Free British male narrator with word-level timings | [Kokoro TTS](https://github.com/thewh1teagle/kokoro-onnx) `bm_fable` |
| 4. 3D world | Toon-shaded three.js world, billboard characters, per-shot cameras, depth of field, ink outlines, bloom, colour grade | [Remotion](https://www.remotion.dev) + `@remotion/three` |
| 5. Look checks | Half-scale stills, side-by-side sheets, a list of readability traps | Remotion stills, Python |
| 6. Sound | Original synthesized score plus SFX timed to picture events, ducked under the voice, mastered to -15 LUFS | numpy / scipy |
| 7. On-screen text | Sticker captions (Poppins Black caps, white with a black outline, key words in a slanted yellow box) plus top "SOURCE:" tags | `Captions.tsx` + `make_captions.py` |
| 8. Render | 1440x2560 H.264 plus mixed audio, with automated QA for black, white, frozen and pop frames and loudness | Remotion CLI, ffmpeg |
| 9. Cover | 1080x1920 thumbnail in the same sticker style with a "▶ SUBSCRIBE @handle" button, under 2 MB | `make_cover.py` (Pillow) |
| 10. Upload | Public upload with title, description, tags and thumbnail, then added to the Shorts playlist | Google Drive for desktop + Zapier (Drive → YouTube) |

---

## Repository layout

```
dist/3DVID.zip                 ← ready-to-upload skill zip
3dvid/                         ← the skill folder (copy or zip this)
├── SKILL.md                   ← the full step-by-step workflow Claude follows
├── templates/
│   ├── molasses/              ← newest complete short source (Remotion + three.js), incl. Captions.tsx
│   ├── bridge/                ← first proven short source (MIT, see LICENSE-bridge-template-MIT.txt)
│   ├── audio/                 ← sound engine: dsp, instruments, sfx_gen, timeline, music, mix
│   │   └── molasses_example/  ← complete single-file soundtrack pipeline
│   ├── SCRIPT_example.md
│   └── sandbox_index_example.tsx
├── scripts/
│   ├── voice/                 ← narrate_timed.py (Kokoro narration), align.py (DTW word timings)
│   ├── captions/              ← make_captions.py (spec + words.json → captions-data.ts)
│   ├── cover/                 ← make_cover.py (sticker-style cover with subscribe button)
│   └── qa/                    ← short_qa.py, stills, side-by-side sheets, sandbox merge
└── examples/molasses/         ← SCRIPT.md, captions_spec.txt, youtube_description.txt
```

---

## Install the skill (summary; details in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))

**Claude.ai / Claude app:** download [`dist/3DVID.zip`](dist/3DVID.zip) (open it on GitHub and click the download button). In Claude, go to **Settings → Capabilities → Skills → Upload skill** and upload the zip that contains the `3dvid/` folder.

**Claude Code:** copy the folder into your skills directory:
```bash
git clone https://github.com/easswad/VideoSkills_for_Youtube
cp -r VideoSkills_for_Youtube/3dvid ~/.claude/skills/3dvid
```

Then ask Claude something like *"Make a 3DVID short about a trending true story"* or *"/3dvid"*.

---

## Requirements

| Need | Version / note |
|---|---|
| Node.js | 18+ |
| Remotion | 4.0.x with `@remotion/three`, `@remotion/google-fonts` (same version) |
| three.js stack | `three@0.169`, `@react-three/fiber@8`, `@react-three/postprocessing@2`, `postprocessing@6` |
| Python | 3.10+ with `numpy scipy soundfile librosa pillow kokoro-onnx` |
| ffmpeg | any recent build |
| Kokoro model files | `kokoro-v1.0.onnx` + `voices-v1.0.bin` (~350 MB) from the [kokoro-onnx releases](https://github.com/thewh1teagle/kokoro-onnx/releases) (`model-files-v1.0`), placed in `$KOKORO_DIR` (default `~/tts`) |
| Font | Poppins Black (OFL), loaded at render time from Google Fonts. The cover script needs the `.ttf`. |
| GPU (recommended) | A 2K render takes ~6-7 min on an AMD Radeon 890M laptop at `--concurrency 4`. CPU-only (SwiftShader) takes hours. |
| Upload (optional) | Google Drive for desktop syncing the render folder, plus a Zapier account with the Google Drive and YouTube apps connected |

---

## Configure for your own channel

Open `3dvid/SKILL.md` and edit the **Config** table at the top:

| Key | Default | Change to |
|---|---|---|
| Channel / subscribe link | `https://www.youtube.com/@easswad` | your channel URL |
| Playlist | `#Shorts \| For very short videos` | your Shorts playlist name |
| Render PC + synced folder | `C:\ZapierAi Folder\3D\<name>-render` | your Drive-synced folder |
| Upload path | Zapier: Drive "Find a File" → YouTube "Upload Video" → "Add Video to Playlist" | your own upload method |
| Voice | Kokoro `bm_fable` | any Kokoro voice (e.g. `bm_george`, `bm_lewis`) |

Also pass your handle to the cover script: `--sub "@yourhandle"`.

---

## Key commands

```bash
# Voice + word timings
python 3dvid/scripts/voice/narrate_timed.py bm_fable 1.32 lines.txt voice/ 0.08
python 3dvid/scripts/voice/align.py bm_fable 1.32 voice/

# Captions data from a spec
python 3dvid/scripts/captions/make_captions.py voice/words.json captions_spec.txt src/videos/<name>/captions-data.ts -v

# Look-check still (half scale, no text)
npx remotion still src/index.ts <Comp> out/x.png --frame=300 --scale 0.5 --props='{"post":{"dpr":0.5},"text":false}'

# Final 2K render + mux (Remotion writes a silent audio track, so map the mix explicitly)
npx remotion render src/index.ts <Comp> out/<name>_video.mp4 --codec h264 --crf 16 --scale 1.3333333333333333 --concurrency 4 --timeout 300000
ffmpeg -i out/<name>_video.mp4 -i mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -shortest out/<name>_final_text.mp4

# Cover
python 3dvid/scripts/cover/make_cover.py frame.png cover.jpg --font Poppins-Black.ttf \
  --top "A 25-FOOT" --key "MOLASSES" --big "WAVE" --badge "BOSTON 1919" --sub "@yourhandle"
```

---

## House rules baked into the skill

- **Facts:** true stories only, with a source for every fact. Original script, characters and shots. Never copy or upload another channel's videos.
- **Tone:** jokes land on whoever was at fault, never on victims.
- **Language and voice:** English, one steady narrator tone, free tools by default.
- **Mix:** voice unchanged, music bed ~10 LU under the voice, SFX stem -6 dB. Master -15 LUFS, true peak ≤ -1.2 dBTP.
- **Output:** 1440x2560 at 30 fps. Film grain stays off.
- **Upload:** public, not made for kids, category Education. The description ends with the subscribe link, and the video goes into the Shorts playlist.

---

## Known gotchas (already handled in the templates)

- `--scale` must be exactly `1.3333333333333333`, or Remotion rejects the non-integer height.
- Concurrency 8 ran out of memory on a 32 GB laptop. Use 4.
- Call `InkPass.prototype.dispose.call(fx.ink)` in the cleanup effect, not `fx.ink.dispose()`.
- Remotion copies `public/` into a temp bundle on every render. Clean old `remotion-webpack-bundle-*` folders.
- YouTube rejects thumbnails over 2 MB. The cover script re-compresses automatically.

---

## Credits and licences

- `templates/bridge/`, `templates/audio/` (base engine) and `scripts/qa/` come from [mromidev/claude-animated-shorts] (MIT). The licence is in `3dvid/templates/LICENSE-bridge-template-MIT.txt`.
- Molasses short source, captions system, cover generator, voice scripts and workflow: © 2026 easswad, MIT licence (see `LICENSE`).
- Kokoro TTS (Apache-2.0) and Poppins (SIL OFL) are downloaded separately and are not bundled.

---

# 2D-VID Skill for YTB Shorts

> **Download: [2DVID.zip](https://github.com/easswad/VideoSkills_for_Youtube/raw/main/dist/2DVID.zip)** · **Full setup guide: [docs/DEPLOYMENT-2DVID.md](docs/DEPLOYMENT-2DVID.md)**

**2DVID** makes 40-70 s faceless Shorts about free AI / GitHub tools and AI news, entirely in code with a free local voice, then uploads them into your Shorts playlist. It builds on Anthropic's **faceless-shorts** skill (engine, voice, timing, mixer) and adds the looks, kit and channel workflow below.

| Look | Example (made with this skill) |
|---|---|
| Comic 2D, one host | [This FREE App Just Replaced Paid AI Voice Tools](https://www.youtube.com/watch?v=k2RmWPm4lKk) |
| Comic 2D, two-host debate | [PRO vs CON: 7 AI Models Battle It Out](https://www.youtube.com/watch?v=LpLmAzLJWv0) |
| Hacker lab 3D | [This FREE Tool Can Reverse Engineer Any App](https://www.youtube.com/watch?v=H94JmIFTZwo) |
| Real studio 3D + real repo images | [This FREE AI Assistant Actually Does Things For You](https://www.youtube.com/watch?v=yRIkDlfrWY8) |

## What you get

| Stage | What the skill does | File |
|---|---|---|
| 1. Topic | Next tool from your list, facts from the repo README (stars, license, features) | SKILL.md |
| 2. Script | 130-180 words, one line per cut, `*KEYWORD` captions, sources | `templates/plan.md`, `examples/*/script.json` |
| 3. Kit | Comic layer (60+ inked props, hosts with lip-sync, SFX, bubbles, stamps, halftone), panel frame, yellow-marker captions in the safe zone; or 3D lab / studio sets | `kit/`, `scripts/apply_kit.py` |
| 4. Voice | 1 or 2+ free Kokoro voices, per-line speaker tags | `scripts/multivoice.py` |
| 5. Lip-sync | Voice loudness at 30 fps drives mouths | `scripts/env_rms.py` |
| 6. Real images | Logos/screenshots pulled from the tool's GitHub repo | `scripts/repo_images.sh` |
| 7. Render | Parallel chunks, lossless join, mixed audio | `scripts/render_chunks.sh` |
| 8. Cover | 1080x1920 sticker title + subscribe pill, < 2 MB, `<name>-cover.jpg` | `scripts/make_cover.py` |
| 9. Upload | Approval → Drive for desktop → Zapier Find a File → YouTube Upload → Shorts playlist | SKILL.md step 10, DEPLOYMENT-2DVID.md |

## Layout
```
dist/2DVID.zip              ← ready-to-upload skill zip
2dvid/
├── SKILL.md                ← the workflow Claude follows
├── kit/                    ← comic.js (2D), lab.js + studio.js (3D), patches/ (captions marker, panel frame)
├── scripts/                ← apply_kit.py, multivoice.py, env_rms.py, repo_images.sh, render_chunks.sh, make_cover.py
├── templates/              ← description.txt, plan.md
└── examples/               ← voicestudio, ai-models, rea, openclaw (script.json + shots.js)
```

## Install
1. Turn on / set up **faceless-shorts** (Anthropic skill): `bash <faceless-shorts>/scripts/setup.sh` → "All set".
2. **Claude app:** download [2DVID.zip](https://github.com/easswad/VideoSkills_for_Youtube/raw/main/dist/2DVID.zip) → **Settings → Capabilities → Skills → Upload skill**.
   **Claude Code:** `cp -r VideoSkills_for_Youtube/2dvid ~/.claude/skills/2dvid`
3. Optional upload automation: Google Drive for desktop + Zapier MCP (Drive Find a File, YouTube Upload Video, YouTube API Request). Step by step in [docs/DEPLOYMENT-2DVID.md](docs/DEPLOYMENT-2DVID.md).
4. Ask: *"Use 2D-VID: make a comic short about <tool>"*.

## Requirements
Node.js 22+, ffmpeg, Chrome/Chromium, Python 3.10+ (faceless-shorts venv: numpy, scipy, kokoro-onnx, faster-whisper), Pillow for covers. ~0.9 GB of free model downloads (done by faceless-shorts setup).

## Credits and licences
- 2D-VID kit, scripts, examples and workflow: © 2026 easswad, MIT (see `LICENSE`).
- Requires Anthropic's **faceless-shorts** skill (engine, `capture.mjs`, `voice.py`, `words.py`, `mix.py`), which is **not** included here and keeps its own terms.
- Kokoro TTS (Apache-2.0) and Whisper (MIT) are downloaded by faceless-shorts setup. Tool logos/screenshots shown in examples belong to their projects and are fetched at build time, not bundled.
