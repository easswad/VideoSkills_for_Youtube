"""Narration with one OR several Kokoro voices (two-host dialogues, pro vs con, narrator + guest). Free, local.

  <faceless-shorts>/scripts/py multivoice.py <project>

Reads <project>/script.json and writes data/narration.wav + data/lines.json in the same format faceless-shorts'
voice.py uses, so words.py, capture.mjs and mix.py work unchanged. Extra per-line keys:
  "voice": "bf_emma"   voice for this line (default: script.json "voice")
  "who":   "con"       speaker tag copied into lines.json, so shots.js can switch the talking host
Consecutive lines with the same voice that make up one sentence are spoken in one pass (natural intonation) and then
cut at the nearest pause. A voice change always starts a new pass. "gap" on a line = pause after it.
Needs the faceless-shorts setup (kokoro-onnx + model files in ~/.faceless-shorts/kokoro).
"""
import json, os, re, sys
from pathlib import Path
import numpy as np
from scipy.io import wavfile

SR = 24000
MODELS = Path(os.environ.get('FACELESS_HOME', Path.home() / '.faceless-shorts')) / 'kokoro'


def edges(x, thr=0.008):
    on = np.flatnonzero(np.abs(x) > thr)
    return x if not on.size else x[max(0, on[0] - 240): min(len(x), on[-1] + 720)]


def pauses(x, frac=0.012, min_s=0.06):
    hop = SR // 100; n = len(x) // hop
    level = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1)); quiet = level < frac * np.abs(x).max()
    found, start = [], None
    for f in range(n + 1):
        q = f < n and quiet[f]
        if q and start is None: start = f
        elif not q and start is not None:
            if (f - start) / 100 >= min_s: found.append((start / 100, f / 100))
            start = None
    return found


def passes(lines, default_voice):
    """split line indices into spoken passes: same voice, ends at . ? ! or a 'break'"""
    out, cur = [], []
    for i, ln in enumerate(lines):
        v = ln.get('voice', default_voice)
        if cur and lines[cur[-1]].get('voice', default_voice) != v: out.append(cur); cur = []
        cur.append(i)
        if re.search(r'[.?!]["\')]*$', ln['text'].strip()) or ln.get('break'): out.append(cur); cur = []
    if cur: out.append(cur)
    return out


def main(project):
    from kokoro_onnx import Kokoro
    P = Path(project); S = json.loads((P / 'script.json').read_text())
    dv = S.get('voice', 'af_heart'); speed = float(S.get('speed', 1.0))
    tts = Kokoro(str(MODELS / 'kokoro-v1.0.onnx'), str(MODELS / 'voices-v1.0.bin'))
    speak = lambda text, v: edges(np.asarray(tts.create(text, voice=v, speed=speed, lang='en-gb' if v[0] == 'b' else 'en-us')[0], dtype=np.float64))
    L = S['lines']; chunks = [np.zeros(int(float(S.get('lead', 0.4)) * SR))]; t = len(chunks[0]) / SR; meta = [None] * len(L)
    for grp in passes(L, dv):
        v = L[grp[0]].get('voice', dv); audio = speak(' '.join(L[i]['text'] for i in grp), v); dur = len(audio) / SR
        bounds = [(0.0, 0.0)]
        if len(grp) > 1:
            w = np.array([len(L[i]['text']) for i in grp], float); gaps = pauses(audio)
            for c in np.cumsum(w)[:-1] / w.sum() * dur:
                near = min(gaps, key=lambda p: abs((p[0] + p[1]) / 2 - c), default=None)
                bounds.append(near if near and abs((near[0] + near[1]) / 2 - c) < 0.45 else (c, c))
        bounds.append((dur, dur))
        for j, i in enumerate(grp):
            meta[i] = {'i': i, 'who': L[i].get('who', ''), 'voice': v, 'text': L[i]['text'],
                       'start': round(t + bounds[j][1], 3), 'end': round(t + bounds[j + 1][0], 3)}
            print(f"{i:2d} {meta[i]['start']:6.2f}-{meta[i]['end']:6.2f} [{v}] {L[i]['text']}", flush=True)
        pause = np.zeros(int(float(L[grp[-1]].get('gap', S.get('gap', 0.3))) * SR))
        chunks += [audio, pause]; t += (len(audio) + len(pause)) / SR
    chunks.append(np.zeros(int(float(S.get('outro', 0.9)) * SR)))
    y = np.concatenate(chunks); y *= 0.9 / (np.abs(y).max() + 1e-9)
    (P / 'data').mkdir(exist_ok=True)
    wavfile.write(P / 'data/narration.wav', SR, (y * 32767).astype(np.int16))
    total = round(len(y) / SR, 3)
    (P / 'data/lines.json').write_text(json.dumps({'duration': total, 'voice': dv, 'speed': speed, 'lines': meta}, indent=1))
    print(f'data/narration.wav {total} s. Next: words.py, then env_rms.py')


if __name__ == '__main__':
    if len(sys.argv) != 2: sys.exit(__doc__)
    main(sys.argv[1])
