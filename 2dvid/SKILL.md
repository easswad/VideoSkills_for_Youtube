---
name: 2dvid
description: Faceless YouTube Shorts about free AI / GitHub tools and AI news, made fully in code with a free local voice - comic-book 2D (hosts, props, yellow-marker captions) or 3D (hacker lab, realistic studio with the tool's real images). Covers topic, sourced script, one or two voices, build, QA, chunked render, cover, approval and upload to YouTube + Shorts playlist via Zapier. Use for "2D-VID", "make a short about <tool>", "next tool from the list", comic-style AI shorts, or tool-reveal shorts.
---

# 2D-VID: comic & tool-reveal Shorts, topic to YouTube

A 40-70 s vertical Short (1080x1920, 30 fps) in one of three looks:

| Look | Use it for | Base style + kit | Example |
|---|---|---|---|
| **Comic 2D** | AI news, explainers, pro-vs-con debates, tool reveals | `inside-out` + `kit/comic.js` | `examples/voicestudio` (1 host), `examples/ai-models` (2 hosts) |
| **Hacker lab 3D** | security / dev tools, "this tool can hack/reverse..." | `night-file` + `kit/lab.js` | `examples/rea` |
| **Real studio 3D** | consumer AI tools; shows the tool's **real** logo, screenshots and icons | `night-file` + `kit/studio.js` | `examples/openclaw` |

This skill is a layer on top of the **faceless-shorts** skill (Anthropic, ships with Claude). faceless-shorts gives the render engine, Kokoro voice, Whisper word timing, music/SFX mixer and `capture.mjs`. 2D-VID adds the comic kit, the 3D sets, the caption look, multi-voice narration, lip-sync, chunked rendering, covers and the channel workflow. **faceless-shorts must be installed and set up first** (see docs/DEPLOYMENT-2DVID.md, part 1).

`FS` = the faceless-shorts skill folder, `DV` = this folder. Find them with `ls ~/.claude/skills` (or the synced skills folder on claude.ai).

## Config (edit for another user/channel)
| Key | Value |
|---|---|
| Channel | Mixed Tastes, `https://www.youtube.com/@easswad` |
| Join line (last line of every description) | `Join the channel: https://www.youtube.com/@easswad` |
| Shorts playlist id | `PLBIyy8h_FDDE` |
| Category | 28 Science & Technology (tools), 27 Education (explainers) |
| Visibility | Public, not made for kids |
| Render-PC sync folder | `C:\ZapierAi Folder` (Google Drive for desktop), device for Remote Control |
| Default voices | `af_heart` (warm female), `bf_emma` (2nd host), `am_fenrir` (deep male, 3D/hacker) |

## House rules
1. **Real facts only.** Every claim comes from the tool's README/repo, an official page, or a named report. Show a small `SOURCE:` tag on screen while the fact is on screen, and list sources in the description.
2. **Real images** in tool videos: pull the logo/screenshots from the repo (`scripts/repo_images.sh`). Never fake a UI screenshot and present it as real.
3. **Captions**: big (Inter 900 / comic font), white with black stroke, ONE yellow-marker keyword per caption (`*WORD` in `caps`), centred at **y 1420-1430** (above the Shorts UI; never lower than 1450).
4. **Approvals**: for tool Shorts from the agreed topic list, don't wait for script approval; get the user's approval on the **final video** before upload. For new formats, confirm the topic first.
5. **Cover** is named `<video-name>-cover.jpg`; video `<video-name>.mp4`. Deliver both in the project files folder.
6. **Description** follows `templates/description.txt` and ENDS with the Join line. Upload public, then add to the Shorts playlist.
7. Free tools only. Don't spend paid credits (vidIQ, Higgsfield, ElevenLabs) without asking.

## Pipeline

### 1. Topic
- Tool series: take the next item from the user's list (see project memory). Read the repo README via `https://raw.githubusercontent.com/<owner>/<repo>/main/README.md`; stars/license via `gh search repos <name>` if `gh api repos/` is blocked.
- News/explainer: find 3-5 sourced facts; pick an angle with a hook in the first 2 s.

### 2. Script (`script.json`)
130-180 words (≈ 40-60 s at speed 1.05). One line = one cut (2-4 s). Beat formula for tool reveals:
hook ("This FREE tool can ... 🤯") → what it is + name → 3 killer features (one shot each, real image when possible) → how to get it (one command / link) → proof (stars, license, "100% local") → comment question → CTA.
Each line: `text` (spoken, numbers written as said), `caps` (`THIS *FREE APP | CLONES *VOICES`, `|` = next caption), optional `voice`, `who`, `gap`. Top-level: `title, voice, speed, lead, outro, gap, music, sources`. See any `examples/*/script.json`.

### 3. Project
```bash
bash $FS/scripts/new_video.sh inside-out <name>      # comic 2D   (night-file for 3D)
python3 $DV/scripts/apply_kit.py ~/faceless-shorts/<name> comic   # or: lab | studio
bash $DV/scripts/repo_images.sh <owner/repo> ~/faceless-shorts/<name>   # tool videos: real images -> img/
```
Then write `script.json` and `src/shots.js`, starting from the closest example in `$DV/examples/`.

### 4. Voice + timing + lip-sync
```bash
cd ~/faceless-shorts/<name>
$FS/scripts/py $DV/scripts/multivoice.py .     # 1 or 2+ voices (per-line "voice"/"who")
$FS/scripts/py $FS/scripts/words.py .          # word timings (Whisper; falls back to even spacing if blocked)
$FS/scripts/py $DV/scripts/env_rms.py .        # data/env.json for talking mouths
```

### 5. Build shots (`src/shots.js`)
- One `add({ id, at, note, draw(lt, d, t) })` per beat; `at: L(i)` (line start) or `Wd('word')` (word time — use a unique word: `Wd('open')` also matches "OpenClaw").
- **Comic 2D** (`import * as M from './core/comic.js'`): `M.paper()`, `M.halftone()`, `M.sunburst()`, `M.focusLines()` backgrounds; `M.host(x,y,s,{talk: env(t), label})` presenter; props (`laptop, phone, gpu, lock, shield, monitor, codeWin, picture, priceTag, moneyBag, flagUS, flagCN, globe, star, check, …`); `M.sfx('BOOM!')`, `M.bubble()`, `M.stamp()`, `M.source('github.com/…')`. Every shot gets the panel frame automatically.
- **3D lab** (`hackerLab(E, T)`), **3D studio** (`studio(E, T)` → phone, laptop screen canvas, banner, channel icons, model tiles, lock, shield, cloud). Load real images with `loadTex('img/x.png')`. Portrait FOV is narrow: keep the camera **3-6 m** from the subject. Screen planes must sit in front of the device body (z ≥ 0.011) or they render white.
- Keep the source tag at the top (y ≈ 110) and nothing important below y 1500 (captions + Shorts UI).

### 6. Check, sound, look QA
```bash
node tools/capture.mjs check                  # boots, lists shots/captions, reports errors
node tools/capture.mjs cues && $FS/scripts/py tools/mix.py .      # SFX cues + music bed -> data/mix.wav
node tools/capture.mjs frames review/a "1,4.5,9,14,…"            # one still per shot, then LOOK at them
```
Fix: unreadable text, overlaps with captions, empty frames, white screens (3D), over-exposure (3D: exposure 0.9, bloom 0.15).

### 7. Render (parallel chunks)
```bash
bash $DV/scripts/render_chunks.sh . <video-name> 4          # comic 2D
bash $DV/scripts/render_chunks.sh . <video-name> 4 --3d     # 3D on a CPU box (24 fps, res 0.6)
```
A comic 2D render single-pass takes ~35 min on a cloud CPU; 4 chunks keep each process under the 30-min background limit. 3D chunks take ~8-9 min each.

### 8. Cover
```bash
node tools/capture.mjs frames review/cover "<best t>"
python3 $DV/scripts/make_cover.py review/cover/<frame>.jpg "This *FREE Tool …" renders/<video-name>-cover.jpg
```

### 9. Approval
Copy `<video-name>.mp4` and `<video-name>-cover.jpg` to the project files folder (`shorts/<name>/`), send both with the title + description (from `templates/description.txt`) and wait for "publish".

### 10. Upload (Zapier; full setup in docs/DEPLOYMENT-2DVID.md)
1. User downloads the two files; a Remote Control session on the render PC copies them from `Downloads` into `C:\ZapierAi Folder` (Drive for desktop syncs in 2-4 min).
2. Zapier **Google Drive → Find a File** (exact file name) → take the result's `file` URL.
3. Zapier **YouTube → Upload Video**: `video` = that URL, title, description, tags, category, privacy public, made-for-kids no. Thumbnail: the cover (set via Find a File for the cover + YouTube "Set thumbnail" request, or in Studio).
4. Add to playlist: YouTube **API request** `POST https://www.googleapis.com/youtube/v3/playlistItems`, querystring `{"part":"snippet"}` (as a dict, not in the URL), header `Content-Type: application/json`, body `{"snippet":{"playlistId":"PLBIyy8h_FDDE","resourceId":{"kind":"youtube#video","videoId":"<id>"}}}`, `fail_on_errors: "false"`.
5. Report the watch link; save the upload to project memory.

## Gotchas
- `Wd('x')` returns the FIRST word that starts with x. Pick unique words.
- Whisper blocked (no network) → words.py spreads words evenly; captions still work but check timing on fast lines.
- 3D captions: night-file defaults to y 1560 (under the Shorts UI); `apply_kit.py` moves them to 1430.
- Other CDNs (jsdelivr, unpkg, product sites) may be blocked from a cloud box: images come from `raw.githubusercontent.com`.
- Never delete with relative globs after `cd` in automation; write to a new `review/<x>` folder instead.
- Don't publish faceless-shorts engine files elsewhere: it has no open-source license. This repo ships only 2D-VID's own code.
