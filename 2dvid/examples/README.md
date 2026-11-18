# Examples (published Shorts made with 2D-VID)

| Folder | Short | Look | Voices |
|---|---|---|---|
| `voicestudio/` | [This FREE App Just Replaced Paid AI Voice Tools](https://www.youtube.com/watch?v=k2RmWPm4lKk) | Comic 2D, one host + talking mic | af_heart |
| `ai-models/` | [PRO vs CON: 7 AI Models Battle It Out](https://www.youtube.com/watch?v=LpLmAzLJWv0) | Comic 2D, two hosts debate | af_heart + bf_emma |
| `rea/` | [This FREE Tool Can Reverse Engineer Any App](https://www.youtube.com/watch?v=H94JmIFTZwo) | Hacker lab 3D (`kit/lab.js`) | am_fenrir |
| `openclaw/` | [This FREE AI Assistant Actually Does Things For You](https://www.youtube.com/watch?v=yRIkDlfrWY8) | Real studio 3D (`kit/studio.js`) + real repo images | af_heart |

Each folder has `script.json` (lines, captions, voices, sources) and `shots.js` (the shot list). To reuse one:
make a project with faceless-shorts `new_video.sh`, run `scripts/apply_kit.py`, copy both files in (`shots.js` → `src/shots.js`),
pull images if it's `openclaw` (`scripts/repo_images.sh openclaw/openclaw <project>`), then follow SKILL.md from step 4.
