# DTW word alignment: each line of voice.wav (lines.json) vs the same words synthesized one by one (same voice/speed).
# usage: align.py voice speed dir
import os, sys, re, json, numpy as np, soundfile as sf, librosa
from kokoro_onnx import Kokoro
voice, speed, d = sys.argv[1], float(sys.argv[2]), sys.argv[3]
k = Kokoro(os.path.expanduser(os.environ.get("KOKORO_DIR", "~/tts")) + "/kokoro-v1.0.onnx", os.path.expanduser(os.environ.get("KOKORO_DIR", "~/tts")) + "/voices-v1.0.bin")
SR, HOP = 24000, 120  # 5 ms frames
def trim(a):
    i = np.where(np.abs(a) > 0.01)[0]; return a[i[0]: i[-1] + 1] if len(i) else a
def feat(a): return librosa.feature.mfcc(y=a, sr=SR, n_mfcc=20, hop_length=HOP, n_fft=1024)[1:]
y, _ = librosa.load(f"{d}/voice.wav", sr=SR)
lines = json.load(open(f"{d}/lines.json")); out = []
for L in lines:
    seg = y[int(L["start"] * SR): int(L["end"] * SR)]
    toks = L["text"].split()
    refs = [trim(k.create(w.strip(",.:;?!"), voice=voice, speed=speed, lang="en-gb")[0]) for w in toks]
    bounds = np.cumsum([0] + [len(r) for r in refs]) / HOP
    R, X = feat(np.concatenate(refs)), feat(seg)
    _, wp = librosa.sequence.dtw(X=R, Y=X, metric="cosine")
    wp = wp[::-1]
    m = np.zeros(R.shape[1], dtype=float)
    for i, j in wp: m[i] = j  # last match wins: ref frame -> line frame
    m = np.maximum.accumulate(m)
    t = lambda fr: float(m[min(int(fr), len(m) - 1)]) * HOP / SR
    for n, w in enumerate(toks):
        s = 0.0 if n == 0 else t(bounds[n]); e = len(seg) / SR if n == len(toks) - 1 else t(bounds[n + 1])
        out.append({"word": re.sub(r"[^\w'-]", "", w), "start": round(L["start"] + s, 3), "end": round(L["start"] + max(e, s + 0.04), 3)})
json.dump(out, open(f"{d}/words.json", "w"), indent=0)
dd = [x["end"] - x["start"] for x in out]
print("words", len(out), "min", round(min(dd), 3), "median", round(float(np.median(dd)), 3), "max", round(max(dd), 3))
