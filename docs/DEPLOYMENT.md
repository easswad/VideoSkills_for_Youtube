# Deploying 3D-VID: full setup guide

This guide takes you from nothing to a working, automated pipeline: Claude writes, voices, renders and uploads a 3D cartoon YouTube Short to your channel and playlist. Follow the parts in order. Each part ends with a check, so you know it worked before moving on.

| Part | What you set up | Time |
|---|---|---|
| 1 | Install the skill in Claude | 2 min |
| 2 | Render PC: Node, Python, ffmpeg, voice model, fonts | 20-30 min |
| 3 | Remotion project | 10 min |
| 4 | Claude Remote Control on the render PC | 5 min |
| 5 | Google Drive for desktop (the file bridge to Zapier) | 10 min |
| 6 | YouTube channel preparation | 5 min (+ 24 h for phone verification if not done) |
| 7 | Zapier: apps, MCP server, connection to Claude | 15 min |
| 8 | Configure the skill for your channel | 5 min |
| 9 | First run, end to end | ~1 h of mostly waiting |
| 10 | Troubleshooting | — |

---

## How the automation fits together

```
Claude (cloud)                          Your render PC                         Cloud services
──────────────                          ──────────────                         ──────────────
topic, script, voice, 3D code,   ──►    Remote Control session:
music, captions, stills                 npm i → remotion render → ffmpeg mux
                                        saves  <name>_final_text.mp4
                                        and    <name>_cover_1080x1920.jpg
                                        into the Drive-synced folder  ──────►  Google Drive
                                                                                    │
Claude calls Zapier MCP tools:                                                      ▼
  Drive "Find a File"  ─────────────────────────────────────────────────────►  file reference
  YouTube "Upload Video" (video + thumbnail refs, title, description, tags) ─► YouTube channel
  YouTube "Add Video to Playlist"  ─────────────────────────────────────────► Shorts playlist
```

The key trick is that **no public file link is ever needed**. Drive for desktop puts the rendered files into Google Drive automatically. Zapier's Drive "Find a File" returns an authenticated file reference that Zapier's YouTube "Upload Video" accepts directly.

---

## Part 1: Install the skill in Claude

### Option A: Claude app / claude.ai (recommended)
1. Download [`dist/3DVID.zip`](../dist/3DVID.zip) from this repository (open it and click **Download raw file**). It already has `3dvid/SKILL.md` at the top level. If you change the skill, re-zip just the `3dvid/` folder the same way.
2. In Claude open **Settings → Capabilities**, and make sure **Code execution and file creation** is on.
3. Under **Skills**, click **Upload skill** and choose the zip.
4. Toggle **3dvid** on.

### Option B: Claude Code (CLI / desktop)
```bash
git clone https://github.com/easswad/VideoSkills_for_Youtube.git
mkdir -p ~/.claude/skills
cp -r VideoSkills_for_Youtube/3dvid ~/.claude/skills/3dvid
```
On Windows (PowerShell):
```powershell
git clone https://github.com/easswad/VideoSkills_for_Youtube.git
Copy-Item -Recurse VideoSkills_for_Youtube\3dvid $HOME\.claude\skills\3dvid
```

✅ **Check:** start a new chat and type `/3dvid`, or ask *"What does the 3dvid skill do?"*. Claude should describe the topic → YouTube pipeline.

---

## Part 2: Prepare the render PC

Rendering 2K 3D needs a real GPU. A Windows laptop with an AMD Radeon 890M renders a 70 s short in ~6-7 min. A cloud CPU takes hours. These steps assume Windows 10/11; macOS and Linux work the same way with their own package managers.

### 2.1 Install the tools
Open **PowerShell** and install with winget:
```powershell
winget install OpenJS.NodeJS.LTS
winget install Python.Python.3.12
winget install Gyan.FFmpeg
winget install Git.Git
```
Close and reopen PowerShell, then check:
```powershell
node -v      # v18 or newer
python --version
ffmpeg -version
git --version
```

### 2.2 Python packages
```powershell
python -m pip install --upgrade pip
python -m pip install numpy scipy soundfile librosa pillow kokoro-onnx
```

### 2.3 Voice model (free, ~350 MB)
1. Create the folder `C:\tts`. This is your `KOKORO_DIR`.
2. Open https://github.com/thewh1teagle/kokoro-onnx/releases and find the release named **model-files-v1.0**.
3. Download `kokoro-v1.0.onnx` and `voices-v1.0.bin` into `C:\tts`.
4. Set the environment variable once:
   ```powershell
   setx KOKORO_DIR "C:\tts"
   ```

✅ **Check:**
```powershell
echo In 1919, a wave of molasses chased people down a street in Boston. > test.txt
python 3dvid\scripts\voice\narrate_timed.py bm_fable 1.32 test.txt voice_test 0.08
```
You should get `voice_test\voice.wav` with a British male voice.

### 2.4 Font for covers
Download `Poppins-Black.ttf` from https://fonts.google.com/specimen/Poppins (or https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Black.ttf) and keep it next to the skill, e.g. `3dvid\fonts\Poppins-Black.ttf`. Captions load Poppins automatically from Google Fonts during the render, so the render PC needs internet.

### 2.5 Power settings
**Settings → System → Power** → set *Sleep* to **Never** while plugged in. A sleeping PC breaks Remote Control in the middle of a render.

---

## Part 3: Create the Remotion project

Create the project in the folder Drive will sync (Part 5), e.g. `C:\ZapierAi Folder\3D`:
```powershell
mkdir "C:\ZapierAi Folder\3D"; cd "C:\ZapierAi Folder\3D"
npx create-video@latest shorts --blank
cd shorts
npm i remotion@4.0.544 @remotion/cli@4.0.544 @remotion/three@4.0.544 @remotion/google-fonts@4.0.544 --save-exact
npm i three@0.169 @react-three/fiber@8 @react-three/postprocessing@2 postprocessing@6
npm i -D @types/three@0.169
```
Keep all `@remotion/*` packages on exactly the same version as `remotion`.

Copy a template in and register it:
```powershell
mkdir src\videos
Copy-Item -Recurse <skill>\3dvid\templates\molasses src\videos\molasses
```
In `src/Root.tsx`:
```tsx
import { MolassesShort, MOLASSES_FRAMES } from "./videos/molasses/Molasses";
// inside the RemotionRoot fragment:
<Composition id="MolassesShort" component={MolassesShort} durationInFrames={MOLASSES_FRAMES} fps={30} width={1080} height={1920} />
```

✅ **Check:**
```powershell
npx remotion still src/index.ts MolassesShort out/test.png --frame=990 --scale 0.5 --timeout 300000
```
`out/test.png` should show the cartoon street with the molasses wave and a caption.

Disk note: every render copies `public/` into `%TEMP%\remotion-webpack-bundle-*`. Delete old ones from time to time.

---

## Part 4: Claude Remote Control on the render PC

Remote Control lets Claude, working in the cloud, run commands on your PC: `npm i`, renders, ffmpeg and file copies.

1. Install the **Claude desktop app** on the render PC from https://claude.ai/download and sign in with the **same Claude account** you use for the skill.
2. In the desktop app open **Settings → Remote Control** (or the Claude Code section) and **add the folder** `C:\ZapierAi Folder`. The PC then shows up as a device, e.g. `IT-G-210 (ZapierAi Folder)`.
3. Alternatively, run `claude remote-control` in a terminal opened in that folder.
4. In a Claude project or chat, ask for something on the PC, e.g. *"list the files in C:\ZapierAi Folder on my PC"*. An approval card appears. Press **Allow**.

✅ **Check:** Claude lists your folder contents.

**Important reconnect gotcha:** after a restart or app update, the PC can register with a *new* connection ID. An old approval card then keeps failing with *"That folder's device isn't connected. Make sure it's awake and running Claude, then allow Claude again."*, even though everything is running. Fix: ask Claude to **stop the Remote Control session and start a fresh one on the current device**, then press Allow on the new card. Ignore the old card.

---

## Part 5: Google Drive for desktop (the file bridge)

1. Install **Google Drive for desktop** from https://www.google.com/drive/download/.
2. Sign in with the Google account that you will **also connect in Zapier** (Part 7). They must be the same account.
3. Open Drive for desktop → ⚙ **Preferences** → **My Computer** → **Add folder** → choose `C:\ZapierAi Folder` → tick **Sync with Google Drive** → **Done**.
4. Wait for the first sync. Its contents now appear in Drive under **Computers → My Computer → ZapierAi Folder**.

✅ **Check:** drop a small file into `C:\ZapierAi Folder` and confirm it shows up at https://drive.google.com (Computers section) within a minute.

Tip: render outputs of ~150 MB take 1-3 minutes to upload. Claude waits until Zapier's "Find a File" sees the file before uploading to YouTube.

---

## Part 6: Prepare the YouTube channel

1. **Verify your phone** at https://www.youtube.com/verify. Custom thumbnails (the cover image) only work on verified channels and can take up to 24 h to activate.
2. **Create the Shorts playlist** in YouTube Studio → **Content → Playlists → New playlist**, e.g. `#Shorts | For very short videos`, visibility Public.
3. Note your **channel handle**, e.g. `@easswad`. It goes in every description and on every cover.
4. If you manage a **Brand Account** channel, remember which Google identity owns it. You'll choose that channel when connecting YouTube in Zapier.

---

## Part 7: Zapier, the upload automation

### 7.1 Account and plan
1. Create or sign in to an account at https://zapier.com.
2. Check **Settings → Billing**. Every tool call Claude makes through Zapier uses one **task**. One short uses about 4-8 tasks (find video, find cover, upload, add to playlist, verify). If you run out, uploads stop with *"Your Zapier account has reached its task limit"*. Upgrade or wait for the monthly reset.

### 7.2 Connect the apps
At https://zapier.com/app/connections, click **Add connection**:
1. **Google Drive**: sign in with the **same Google account as Drive for desktop** (Part 5) and allow access.
2. **YouTube**: sign in with the Google account that owns the channel and **pick the channel** (Brand Account if applicable). Allow upload and manage permissions.

### 7.3 Create the Zapier MCP server
1. Go to https://mcp.zapier.com (or Zapier → **MCP**).
2. Click **+ New MCP Server** and choose **Claude** as the client. Name it e.g. `3dvid-uploads`.
3. Click **Add tools** and enable:

| App | Action | Used for |
|---|---|---|
| Google Drive | **Find a File** | Get the file reference of the mp4 and cover |
| Google Drive | Make API GET Request (optional) | Checking sizes and metadata |
| YouTube | **Upload Video** | Upload with title, description, tags, thumbnail, privacy |
| YouTube | **Update Video Thumbnail** | Fallback if the thumbnail fails during upload |
| YouTube | **Add Video to Playlist** | Put the short in your Shorts playlist |
| YouTube | Make API GET Request | Verify the video is public, processed and has its thumbnail |
| YouTube | Find Video (optional) | Look up past uploads |

4. For each action, select the connected account from 7.2.
5. Open the **Connect** tab and copy the **server URL**. Treat it like a password: never share or commit it.

### 7.4 Connect Zapier to Claude
- **Claude app / claude.ai:** **Settings → Connectors → Add custom connector** → paste the Zapier MCP server URL → **Add**, then **Connect** and approve. In a chat, enable the connector from the tools menu.
- **Claude Code:**
  ```bash
  claude mcp add --transport http zapier "<your Zapier MCP server URL>"
  ```

✅ **Check:** ask Claude *"Using Zapier, list my YouTube playlists"*. You should see your playlists, including the Shorts one. Also ask *"Using Zapier, find the file test.txt in Google Drive"*.

---

## Part 8: Configure the skill for your channel

Edit `3dvid/SKILL.md` → **Config** table (then re-zip and re-upload if you use the Claude app):

| Key | Example | Notes |
|---|---|---|
| Channel / subscribe link | `https://www.youtube.com/@yourhandle` | Appended to every description |
| Playlist | `#Shorts \| For very short videos` | Must match the playlist name exactly. Claude resolves the ID through Zapier. If two playlists have similar names, add the ID (`PL…`) here. |
| Render PC + synced folder | `C:\ZapierAi Folder\3D\<name>-render` | Must be inside the Drive-synced folder |
| Upload path | Zapier: Drive Find a File → YouTube Upload Video → Add Video to Playlist | Leave as is if you followed Part 7 |
| Voice | `bm_fable` at speed 1.32 | Other UK male voices: `bm_george`, `bm_lewis`, `bm_daniel` |

Also use your own handle in the cover command (`--sub "@yourhandle"`).

---

## Part 9: First run, end to end

1. In Claude (Projects are best, since memory carries between threads), say:
   > *Use 3dvid. Find me trending true stories for a cartoon 3D short.*
2. **Pick a topic** from the table Claude returns.
3. **Approve the script.** After this Claude works on its own. Approval is only asked for at the topic and the script.
4. Claude generates the voice, builds the world, makes the music and SFX and renders test stills. Review the stills if you like.
5. When Claude asks to run on your PC, press **Allow** on the Remote Control card. The final render takes ~6-7 min on a laptop GPU.
6. Claude makes the cover, waits for Drive to sync, uploads through Zapier, adds the video to the playlist and sends you the YouTube link.

What gets uploaded every time:
- **Video:** `<name>_final_text.mp4`, 1440x2560 with captions and source tags.
- **Thumbnail:** `<name>_cover_1080x1920.jpg` (under 2 MB).
- **Title:** hook + emoji + "(True Story)", 70 characters or fewer.
- **Description:** hook line → emoji fact bullets → comment question → Sources → hashtags ending `#Shorts` → **"Subscribe for more: https://www.youtube.com/@yourhandle"**.
- **Settings:** Public, not made for kids, Education category, English, subscribers notified.
- **Playlist:** your Shorts playlist.

---

## Part 10: Troubleshooting

| Symptom | Likely cause (most likely first) | Fix |
|---|---|---|
| "That folder's device isn't connected… allow Claude again" | 1) Stale approval card from before a restart. 2) PC asleep. 3) Claude app closed. | Ask Claude to stop and restart Remote Control on the current device, then press Allow on the **new** card. Wake the PC and keep the app open. |
| "Zapier account has reached its task limit" | Monthly task quota used up | Upgrade at zapier.com/app/settings/billing or wait for the reset. Then ask Claude to retry the step. |
| Upload succeeds but thumbnail is the auto frame | Channel not phone-verified, or cover > 2 MB | Verify at youtube.com/verify, then ask Claude to run "Update Video Thumbnail" |
| Zapier "Find a File" can't find the video | Drive still uploading, or Drive and Zapier use different Google accounts | Wait 1-3 min. Make sure both use the same account (Parts 5 and 7). |
| Video lands on the wrong channel | Zapier YouTube connection points at another channel or Brand Account | Reconnect YouTube in Zapier and pick the right channel |
| Render: "height must be an integer" | `--scale 1.3333` | Use `--scale 1.3333333333333333` |
| Render crashes with out-of-memory | Too much parallelism | `--concurrency 4` (or 2 on 16 GB machines) |
| Render: "fx.ink.dispose is not a function" | Old template | In the main component's cleanup use `InkPass.prototype.dispose.call(fx.ink)` |
| Render timeout on the first frames | Shader compile is slow | `--timeout 300000` |
| Captions in a fallback serif font | No internet during the render | Connect the PC to the internet and re-render |
| Voice script: model not found | `KOKORO_DIR` not set | `setx KOKORO_DIR "C:\tts"` and reopen the terminal |
| Disk fills up | Remotion temp bundles | Delete `%TEMP%\remotion-webpack-bundle-*` folders |

---

## Security notes
- Never commit or paste your **Zapier MCP server URL**, API keys or OAuth tokens into the repo, a README or a chat that others can see.
- Google Drive and YouTube permissions live in Zapier, not in this skill. Revoke them at zapier.com/app/connections at any time.
- This skill never uploads reference videos from other channels and never copies their content.
