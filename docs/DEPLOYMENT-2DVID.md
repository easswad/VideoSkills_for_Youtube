# Deploying 2D-VID: full setup guide

**2D-VID Skill for YTB Shorts** makes faceless tool-reveal and AI-news Shorts in a comic-book 2D look or a 3D look (hacker lab, or a realistic studio that shows the tool's real images), then uploads them to YouTube and your Shorts playlist.

**Download:** [2DVID.zip](https://github.com/easswad/VideoSkills_for_Youtube/raw/main/dist/2DVID.zip) (direct download) · [view on GitHub](../dist/2DVID.zip)

| You need | Why |
|---|---|
| Claude (claude.ai / Claude app with Projects, or Claude Code) | Runs the skill |
| The **faceless-shorts** skill from Anthropic, set up once | Render engine, free Kokoro voice, Whisper timing, sound mixer. 2D-VID builds on it |
| A computer that renders: the cloud sandbox Claude runs in, or your own PC | Voice + render |
| Google Drive for desktop on your PC (optional) | Moves the finished MP4 into Drive for Zapier |
| Zapier account with Google Drive + YouTube (optional) | Uploads to YouTube and adds to the playlist |

## How it fits together

```
You: "make the next tool short"
  └─ Claude + 2D-VID: research → script.json → multivoice.py → words.py → env_rms.py
       → shots.js (comic kit / lab / studio) → check + frames → render_chunks.sh → make_cover.py
       └─ sends you <name>.mp4 + <name>-cover.jpg for approval ── you: "publish"
            └─ Remote Control on your PC copies both into C:\ZapierAi Folder
                 └─ Google Drive for desktop syncs (2-4 min)
                      └─ Zapier: Drive "Find a File" → YouTube "Upload Video" → playlistItems insert
                           └─ Live Short in the Shorts playlist
```

---

## Part 1: Install

### 1.1 faceless-shorts (prerequisite)
- **Claude app / claude.ai:** **Settings → Capabilities → Skills**: turn on **faceless-shorts** (an Anthropic example skill). If it's not listed, ask Claude "set up the faceless-shorts skill".
- **Claude Code:** make sure `faceless-shorts` is in `~/.claude/skills/`.
- **One-time setup** (in the machine that renders): ask Claude *"run faceless-shorts setup"*, or run it yourself:
  ```bash
  bash <faceless-shorts>/scripts/setup.sh      # Node 22+, ffmpeg, Chrome, Python venv, Kokoro voice (~340 MB), Whisper (~0.5 GB). Ends with "All set"
  bash <faceless-shorts>/scripts/selftest.sh   # optional, ~3 min, ends with "SELFTEST PASSED"
  ```

### 1.2 2D-VID
**Option A: Claude app / claude.ai (recommended)**
1. Download **[2DVID.zip](https://github.com/easswad/VideoSkills_for_Youtube/raw/main/dist/2DVID.zip)**.
2. **Settings → Capabilities → Skills → Upload skill** → choose `2DVID.zip`.
3. Turn the skill on. Use it inside a **Project** so memory (topic list, upload history) carries over between threads.

**Option B: Claude Code**
```bash
git clone https://github.com/easswad/VideoSkills_for_Youtube
cp -r VideoSkills_for_Youtube/2dvid ~/.claude/skills/2dvid
chmod +x ~/.claude/skills/2dvid/scripts/*.sh
```

✅ **Check:** ask Claude *"Which 2D-VID looks can you make?"*. It should list Comic 2D, Hacker lab 3D and Real studio 3D.

---

## Part 2: Where it renders

| Option | Speed (50 s short) | Notes |
|---|---|---|
| **Claude's cloud sandbox** (default) | Comic 2D ~10 min in 4 chunks; 3D ~9 min per chunk at 24 fps, res 0.6 | Nothing to install. Network may block some sites: images come from raw.githubusercontent.com |
| **Your PC** via Remote Control | Faster with a GPU; full-res 3D | Install Node 22+, ffmpeg, Chrome, Python 3.10+, then faceless-shorts `setup.sh` |

Python extras for 2D-VID: none beyond faceless-shorts (numpy, scipy, kokoro-onnx). `make_cover.py` needs Pillow (`pip install pillow`) and an Inter Black font (`--font path/to/Inter-Black.otf` on Windows/macOS; free from fonts.google.com/specimen/Inter).

---

## Part 3: Remote Control on your PC (for upload hand-off)

1. Install the **Claude desktop app** on the PC, sign in with the same account, keep it open and the PC awake.
2. In a Project thread, Claude asks to connect a folder: pick **`C:\ZapierAi Folder`** (or your synced folder) and press **Allow**.
3. When it's time to upload, Claude starts a Remote Control session that copies `<name>.mp4` and `<name>-cover.jpg` from `C:\Users\<you>\Downloads` into that folder, then stops the session.

You only have to **download the two attached files** from the thread when Claude asks.

---

## Part 4: Google Drive for desktop

1. Install from https://www.google.com/drive/download/ and sign in with the Google account Zapier will use.
2. Add `C:\ZapierAi Folder` as a synced folder (**Preferences → My Computer → Add folder → Sync with Google Drive**).
3. ✅ Drop a test file in; it should appear in drive.google.com under *Computers* within a few minutes.

---

## Part 5: YouTube channel

1. Create a **public playlist** for Shorts and copy its id (`PL…` from the playlist URL).
2. Verify the channel (phone) so custom thumbnails and >15 min limits are unlocked: https://www.youtube.com/verify.
3. YouTube has no custom categories: use 28 (Science & Technology) for tools, 27 (Education) for explainers, and the playlist as your "Shorts" bucket.

---

## Part 6: Zapier (upload automation)

### 6.1 Connections
At https://zapier.com/app/connections add **Google Drive** (same account as Part 4) and **YouTube** (the channel owner; pick the right Brand Account).

### 6.2 Zapier MCP server
1. Go to https://mcp.zapier.com → **+ New MCP Server** → client **Claude**.
2. Add these tools:

| App | Action | Used for |
|---|---|---|
| Google Drive | **Find a File** | Exact-name lookup of the mp4/cover → returns a `file` link Zapier can stream |
| YouTube | **Upload Video** | Upload with title, description, tags, category, privacy |
| YouTube | **API Request (Beta)** / "Make API Mutating Request" | Add to playlist, set thumbnail, edit description |
| YouTube | Make API GET Request (optional) | Verify status / processing |

3. **Connect** tab → copy the server URL (treat it as a password).
4. Claude app: **Settings → Connectors → Add custom connector** → paste URL. Claude Code: `claude mcp add --transport http zapier "<url>"`.

### 6.3 Exact calls the skill makes
1. **Find a File** — `title`: `<name>.mp4` → keep the result's `file` field (a `zapier.com/engine/hydrate/…` URL).
2. **Upload Video** — `video`: that URL · `title` · `description` (ends with the Join line) · `tags` · `category`: 28 · `privacy_status`: public · `made_for_kids`: no.
3. **Add to playlist** — API request:
   - url `https://www.googleapis.com/youtube/v3/playlistItems`, method `POST`
   - querystring `{"part":"snippet"}` (as a field, **not** in the URL, or it fails with 400)
   - headers `{"Content-Type":"application/json"}`, `fail_on_errors`: `"false"`
   - body `{"snippet":{"playlistId":"<PL…>","resourceId":{"kind":"youtube#video","videoId":"<id>"}}}`
4. **Edit a live description** — `GET videos?part=snippet&id=<id>`, change `description`, then `PUT videos?part=snippet` with the full snippet (title, description, tags, categoryId).

✅ **Check:** ask Claude *"Using Zapier, list my YouTube playlists"*.

Each short uses about 4-6 Zapier tasks.

---

## Part 7: Configure for your channel

Edit the **Config** table at the top of `2dvid/SKILL.md` (re-zip and re-upload for the Claude app):

| Key | Default | Change to |
|---|---|---|
| Channel / Join line | `Join the channel: https://www.youtube.com/@easswad` | your handle |
| Shorts playlist id | `PLBIyy8h_FDDE` | your `PL…` id |
| Category | 28 / 27 | as you like |
| Render-PC sync folder | `C:\ZapierAi Folder` | your synced folder |
| Default voices | `af_heart`, `bf_emma`, `am_fenrir` | any Kokoro voice (`voice.py --list`) |

Also pass `--handle @yourhandle` to `make_cover.py`.

---

## Part 8: First run

1. In a Claude Project: *"Use 2D-VID. Make a comic short about <GitHub tool>."* (or give a list of tools and say "do them in order").
2. Claude researches the README, writes the script, voices it, builds and renders. No script approval is needed for list topics.
3. You get `<name>.mp4` + `<name>-cover.jpg` + title + description. Reply **publish** (or ask for changes).
4. Download both attachments when asked; press **Allow** on the Remote Control card.
5. Claude uploads, adds to the playlist, and posts the YouTube link.

---

## Part 9: Troubleshooting

| Symptom | Likely cause (most likely first) | Fix |
|---|---|---|
| `apply_kit.py: anchor not found` | faceless-shorts engine updated | Apply `kit/patches/*` by hand (they're short), or tell Claude to adapt the patch |
| Captions hidden behind the Shorts UI | Caption y too low | `CAP.y` (2D) / `CAPLOOK.y` (3D) = 1420-1430 |
| 3D laptop/phone screen renders white | Screen plane inside the device body | Put the screen at z ≥ 0.011 in front of the shell |
| 3D shot looks cramped | Portrait FOV is narrow | Camera 3-6 m from the subject |
| 3D washed out | Too much bloom/exposure | exposure 0.9, bloom 0.15, threshold 0.95 |
| Render stops at 30 min | Background job limit | `render_chunks.sh … 4` (or 6 chunks) |
| Captions drift from the voice | Whisper blocked, even spacing used | Allow huggingface.co once for setup, or shorten long lines |
| `repo_images.sh` fetches nothing | Branch is `master`, or images live elsewhere | Pass the branch: `repo_images.sh owner/repo proj master` |
| Find a File finds nothing | Drive hasn't synced yet | Wait 2-4 min; check the exact file name |
| Playlist insert 400 | `part` put in the URL | Use the querystring field `{"part":"snippet"}` |
| Remote Control "device not connected" | PC asleep or Claude app closed | Wake PC, open app, press Allow on the **new** card |

---

## Security notes
- Never commit the Zapier MCP URL or any token. The skill never needs API keys.
- Remote Control only gets the folder you approve.
