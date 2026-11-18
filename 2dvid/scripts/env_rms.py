"""Lip-sync envelope: data/narration.wav -> data/env.json (loudness 0..1, 30 values per second).

  <faceless-shorts>/scripts/py env_rms.py <project>

In shots.js:
  const ENV = await (await fetch('data/env.json', { cache: 'no-store' })).json();
  const env = (t) => { const f = t * 30, i = Math.floor(f); return lerp(ENV[i] || 0, ENV[i + 1] || 0, f - i); };
  M.host(x, y, s, { talk: env(t) })   // mouth opens with the voice
"""
import json, sys
from pathlib import Path
import numpy as np
from scipy.io import wavfile

P = Path(sys.argv[1]) if len(sys.argv) == 2 else sys.exit(__doc__)
sr, x = wavfile.read(P / 'data/narration.wav'); x = x.astype(np.float64)
if x.ndim > 1: x = x.mean(1)
hop = sr / 30; n = int(len(x) / hop) + 1
r = np.array([np.sqrt(np.mean(x[int(i * hop): int((i + 1) * hop)] ** 2)) if int(i * hop) < len(x) else 0.0 for i in range(n)])
r = np.clip(r / (np.percentile(r[r > 0], 95) if (r > 0).any() else 1), 0, 1)
r = np.convolve(r, [0.25, 0.5, 0.25], 'same')        # soften so the mouth doesn't flicker
(P / 'data/env.json').write_text(json.dumps([round(float(v), 3) for v in r]))
print(f'data/env.json ({n} frames, {len(x) / sr:.2f} s)')
