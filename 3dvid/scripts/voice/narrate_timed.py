# usage: narrate_timed.py voice speed lines.txt outdir gap
# Line-by-line Kokoro narration + word timings: word k ends where the synthesized prefix w1..wk ends,
# snapped to the quietest 10 ms point within +-70 ms in the real line audio.
import sys, os, re, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro(os.path.expanduser(os.environ.get("KOKORO_DIR", "~/tts")) + "/kokoro-v1.0.onnx", os.path.expanduser(os.environ.get("KOKORO_DIR", "~/tts")) + "/voices-v1.0.bin")
voice, speed, src, outdir, gap = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4], float(sys.argv[5])
SR = 24000
def syn(text):
    a, sr = k.create(text, voice=voice, speed=speed, lang="en-gb")
    idx = np.where(np.abs(a) > 0.01)[0]
    return a[max(0, idx[0] - int(0.02 * SR)): idx[-1] + int(0.04 * SR)]
def env(a):  # 10 ms RMS
    n = len(a) // 240
    return np.sqrt((a[: n * 240].reshape(n, 240) ** 2).mean(1) + 1e-12)
parts, words, lines, t = [], [], [], 0.0
for line in open(src):
    line = line.strip()
    if not line: continue
    a = syn(line); e = env(a); L = len(a) / SR
    toks = line.split()
    ends = []
    for i in range(1, len(toks)):
        d = len(syn(" ".join(toks[:i]).rstrip(",.:;?!") )) / SR - 0.03
        c = int(round(d * 100)); lo, hi = max(1, c - 7), min(len(e) - 1, c + 7)
        j = lo + int(np.argmin(e[lo:hi])) if hi > lo else c
        ends.append(max(ends[-1] + 0.05 if ends else 0.05, min(j / 100, L - 0.05)))
    ends.append(L)
    st = 0.0
    for w, en in zip(toks, ends):
        words.append({"word": re.sub(r"[^\w'-]", "", w), "raw": w, "start": round(t + st, 3), "end": round(t + en, 3)})
        st = en
    lines.append({"text": line, "start": round(t, 3), "end": round(t + L, 3)})
    parts += [a, np.zeros(int(gap * SR), dtype=a.dtype)]
    t += L + gap
    print(f"{t:6.2f}s  {line[:60]}", flush=True)
os.makedirs(outdir, exist_ok=True)
sf.write(os.path.join(outdir, "voice.wav"), np.concatenate(parts), SR)
json.dump(words, open(os.path.join(outdir, "words.json"), "w"), indent=0)
json.dump(lines, open(os.path.join(outdir, "lines.json"), "w"), indent=1)
print("total", round(t, 2), "words", len(words), "w/s", round(len(words) / t, 2))
