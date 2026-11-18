# Soundtrack of "Slower Than Molasses in January": the narration (gain only), an original ragtime-to-disaster score
# (own synthesis, ducked under the voice) and synthesized SFX on the picture's frames (story.ts / cast.ts).
# Mix standard: music bed ~ -10 LU under the voice ("+3 dB music"), SFX stem -6 dB, voice unchanged.
# Master -15 LUFS integrated, true peak <= -1.2 dBTP, 48 kHz stereo 24-bit, exactly TOTAL frames long.
import os, sys, json, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))  # dsp, instruments, sfx_gen live in templates/audio/
import numpy as np
from scipy import signal
from dsp import (SR, TAU, ns, tt, rng, lp, hp, bp, peq, colored, smooth_noise, fades, phase, modal, pan, st, place, widen,
                 make_ir, convolve_st, integrated, true_peak, dbg, read_wav, write_wav, shape)
import instruments as I
import sfx_gen as G

HERE = os.path.dirname(os.path.abspath(__file__))
FPS, TOTAL = 30, 2092
DUR = TOTAL / FPS
N = ns(DUR)
F = lambda f: f / FPS
m2f = I.m2f
log = lambda *a: print(f"[{time.strftime('%H:%M:%S')}]", *a, flush=True)

# ---------------------------------------------------------------- picture timeline (from story.ts / cast.ts)
SHOTS = {1: (0, 168), 2: (168, 310), 3: (310, 450), 4: (450, 545), 5: (545, 670), 6: (670, 785), 7: (785, 925), 8: (925, 1095),
         9: (1095, 1180), 10: (1180, 1232), 11: (1232, 1298), 12: (1298, 1368), 13: (1368, 1478), 14: (1478, 1598),
         15: (1598, 1705), 16: (1705, 1756), 17: (1756, 1815), 18: (1815, 1965), 19: (1965, TOTAL)}
FLASH = F(166)
BURST = F(892)
RIVETS = [815 + i * 3 + (1 if i % 3 == 2 else 0) for i in range(16)]
EL_SLAM = F(1052)
GAVEL = F(1838)
WARM = F(1415)
BOMB = F(1784)
SIGN = (F(1915), F(1946))
s_ = lambda i: (F(SHOTS[i][0]), F(SHOTS[i][1]))

R0 = rng(1919)
def R():
    return rng(int(R0.integers(1 << 30)))

cues = []
def cue(t, what):
    cues.append((round(t, 2), what))


# ================================================================ SFX
def sfx_stem():
    out = np.zeros((2, N))
    def add(x, t, g=1.0, p=0.0, what=None):
        place(out, pan(x, p) if np.ndim(x) == 1 else x, t, g)
        if what:
            cue(t, what)

    def rumble(dur, r, level=1.0, rise=0.3):
        """the molasses wave: deep roar + thick glugs + wet slap texture"""
        n = ns(dur); t = np.arange(n) / SR
        env = np.clip(t / rise, 0, 1)
        low = lp(colored(n, r, 2.0), 140, 2) * 2.2
        mid = bp(colored(n, r, 1.0), 120, 900, 2) * (0.6 + 0.4 * smooth_noise(n, r, 2.0))
        glug = G.bubbles(dur, r, 45, 70, 420, (0.02, 0.07), rise=(1, 3)) * 1.6
        slap = bp(colored(n, r, 0.5), 600, 3000, 1) * (0.5 + 0.5 * smooth_noise(n, r, 5.0)) * 0.25
        return widen((low + mid + glug + slap) * env * level, r, 13, 0.8)

    def metal_groan(dur, r, f0=55, f1=40, level=1.0):
        c = G.creak(dur, r, 9, 16, [(f0 * 1.0, 18, 1.0), (f0 * 2.3, 22, 0.7), (f0 * 4.1, 26, 0.45), (f0 * 6.8, 30, 0.25)],
                    [(0, 0), (0.25, 1), (0.8, 0.8), (1, 0)], rough=0.2, noise=0.03)
        t = tt(dur)
        moan = np.sin(phase(np.linspace(f0 * 2, f1 * 2, len(t)) * (1 + 0.01 * smooth_noise(len(t), r, 4.0)))) * np.sin(np.pi * t / dur) ** 2 * 0.25
        return (c + moan) * level

    def rivet_pop(r):
        d = 0.5; t = tt(d)
        crack = bp(r.standard_normal(len(t)), 1200, 12000, 2) * np.exp(-t / 0.003) * 1.6
        ping = modal(d, [(r.uniform(1900, 2600), 1.0, 0.12), (r.uniform(4300, 5600), 0.5, 0.05), (r.uniform(7000, 8800), 0.25, 0.02)], r)
        zing = np.sin(phase(np.linspace(3200, 1400, len(t)))) * np.exp(-t / 0.08) * 0.3
        return fades(crack + ping * 0.8 + zing, 0, 0.05)

    def boom(r, dur=3.5, f0=38):
        n = ns(dur); t = np.arange(n) / SR
        b = np.exp(-t / 0.7) * np.sin(phase(f0 * (1 + 0.6 * np.exp(-t / 0.05)))) * 3.0
        b += lp(r.standard_normal(n), 300, 2) * np.exp(-t / 0.4) * 1.5
        tear = G.creak(1.2, r, 40, 140, G.CHAIN, [(0, 1), (0.3, 0.8), (1, 0)], rough=0.3, noise=0.1, scale=0.6)
        y = b
        G._place_mono(y, tear * 0.9, 0.02)
        y[: ns(0.01)] += bp(r.standard_normal(ns(0.01)), 500, 9000, 1) * 2
        return y

    def clang(r, big=1.0):
        d = 1.8; t = tt(d)
        y = modal(d, [(r.uniform(140, 180), 1.0, 0.6), (r.uniform(370, 420), 0.8, 0.45), (r.uniform(690, 760), 0.6, 0.35), (r.uniform(1150, 1300), 0.4, 0.25), (2050, 0.25, 0.15)], r)
        y += bp(r.standard_normal(len(t)), 300, 6000, 1) * np.exp(-t / 0.01) * 1.5
        return y * big

    def drip_plink(r, f0=None, metal=False):
        d = 0.25; t = tt(d)
        f0 = f0 or r.uniform(900, 1500)
        y = np.exp(-t / 0.03) * np.sin(phase(f0 * (1 + 2.5 * t)))
        if metal:
            y = y * 0.6 + modal(d, [(f0 * 1.9, 0.5, 0.08), (f0 * 3.1, 0.25, 0.05)], r)
        return fades(y, 0.001, 0.02)

    def swish(r, d=0.28):
        return G.whoosh(d, r, peak=d * 0.45, f_lo=900, f_hi=3500, width=0.9, tail=d * 0.3, air=0.3)

    def steam(dur, r, level=1.0):
        n = ns(dur)
        return widen(hp(colored(n, r, 0.0), 2500, 2) * (0.7 + 0.3 * smooth_noise(n, r, 3)) * level * 0.35, r, 9, 1.0)

    def pump(t0, t1, r, rate=1.6, level=1.0):
        tm = t0
        while tm < t1:
            d = 0.35; t = tt(d)
            th = np.exp(-t / 0.06) * np.sin(phase(62 * (1 + 0.3 * np.exp(-t / 0.01)))) * 1.2 + lp(r.standard_normal(len(t)), 500) * np.exp(-t / 0.03) * 0.4
            add(th * level, tm, p=-0.2)
            tm += 1 / rate

    def squelch(r, d=0.55):
        t = tt(d)
        f = 180 + 900 * (t / d) ** 1.5
        y = shape(r.standard_normal(len(t)), lambda T, Fr: np.exp(-0.5 * (np.log2(np.maximum(Fr[:, None], 20) / np.interp(T, t, f)[None, :]) / 0.5) ** 2), 512, 128)
        y *= np.sin(np.pi * t / d) ** 0.7
        y += G.bubbles(d, r, 60, 150, 600, (0.01, 0.04), rise=(2, 6)) * 0.8
        pop = np.zeros(len(t)); k = ns(d * 0.85)
        pop[k:] = np.exp(-tt(d - d * 0.85) / 0.012) * np.sin(phase(np.full(len(t) - k, 420.0))) * 0.8
        return fades(y + pop, 0.01, 0.03)

    def steps(t0, t1, r, rate, level=0.8, p=0.0):
        tm = t0
        while tm < t1:
            add(G.stroll_step(r, 0.3) * level * r.uniform(0.7, 1.0), tm, p=p + r.uniform(-0.2, 0.2))
            tm += 1 / rate * r.uniform(0.9, 1.1)

    r = R()
    # ---- 1: the hook: the wave roars down the street, people run and yell; whoosh into the flash
    add(rumble(5.6, r, 0.7, 0.4) * np.linspace(0.6, 1.0, ns(5.6))[None, :], 0.0, 0.9, what="molasses wave roar (hook)")
    steps(0.05, 5.4, r, 6.5, 0.8)
    add(G.whoa(r, 140), 0.35, 0.9, -0.3, "whoa (runner)")
    add(G.whoa(r, 210, 0.6), 2.25, 0.8, 0.3, "whoa (runner 2)")
    add(G.whoosh(1.2, r, peak=1.05, f_lo=300, f_hi=4000, tail=0.15), FLASH - 1.05, 1.0, 0, "whoosh into the flash")
    # ---- 2: quiet harbour: gulls, lapping water, a ship horn
    a, b = s_(2)
    add(G.water_bed(b - a + 0.6, r, 0.35, 0.5) * 0.5, a - 0.1, what="harbour water bed")
    add(G.breeze(b - a, r, 0.6), a)
    gull = lambda r: fades(np.sin(phase(np.concatenate([np.linspace(1500, 2300, ns(0.12)), np.linspace(2300, 1200, ns(0.3))]))) * np.concatenate([np.linspace(0, 1, ns(0.12)), np.linspace(1, 0, ns(0.3))]) * 0.4, 0.01, 0.02)
    for tm in (6.1, 6.5, 8.6, 9.1):
        add(gull(r), tm, 0.5, r.uniform(-0.6, 0.6), "gull")
    hd = 1.6; ht = tt(hd)
    horn = (np.sin(phase(np.full(len(ht), 110.0))) + 0.6 * np.sin(phase(np.full(len(ht), 138.6))) + 0.3 * np.sin(phase(np.full(len(ht), 220.0)))) * np.clip(ht / 0.08, 0, 1) * np.clip((hd - ht) / 0.3, 0, 1)
    add(lp(horn, 900) * 0.5, 7.4, 1.0, 0.4, "ship horn")
    # ---- 3: drips on the seams; the painter's brush strokes (from 415)
    for i in range(6):
        add(drip_plink(r), 10.6 + i * 0.7 + r.uniform(0, 0.2), 0.35, r.uniform(-0.4, 0.4))
    cue(10.6, "drips down the seams")
    tm = F(415)
    while tm < s_(3)[1]:
        add(swish(r), tm, 0.7, 0.1)
        tm += 0.35
    cue(F(415), "brush strokes (painter)")
    # ---- 4: drips into tin pails, kids giggle
    a, b = s_(4)
    for i in range(7):
        add(drip_plink(r, r.uniform(1100, 1600), True), a + 0.2 + i * 0.42, 0.5, r.uniform(-0.5, 0.5))
    cue(a + 0.2, "drips plink into tin pails")
    for i, tm in enumerate((a + 0.4, a + 1.7, F(522))):
        add(G.babble(0.7, r, 290 + 30 * i, 1.35, rate=7, active=0.9) * 0.6, tm, 0.7, (-0.4, 0.4, 0)[i], "kids giggle")
    # ---- 5: ship pumping, steam; the steel groans at 622
    a, b = s_(5)
    pump(a, b, r, 1.6, 0.8); cue(a, "ship pump chugs")
    add(steam(b - a, r, 0.8), a)
    add(G.water_bed(b - a, r, 0.3) * 0.35, a)
    add(metal_groan(2.6, r, 52, 38), F(620), 1.2, 0.2, "tank steel groans")
    # ---- 6: groans behind the manager
    add(metal_groan(2.2, r, 58, 44, 0.9), F(700), 1.0, -0.2, "groan")
    add(metal_groan(1.6, r, 64, 50, 0.7), F(760), 0.9, 0.3, "groan 2")
    add(I.glock(m2f(96), 0.5, r, 0.6) * 0.5, F(750), 0.6, 0.2, "thumbs-up ting")
    # ---- 7: sandwich bite; rivets pop like a machine gun; the burst
    add(G.stroll_step(r, 1.0) * 0.4 + 0, F(796), 0.5, 0.2)
    bite = bp(r.standard_normal(ns(0.15)), 1500, 6000, 1) * np.exp(-tt(0.15) / 0.03)
    add(bite, F(796), 0.6, 0.1, "sandwich bite")
    for fr in RIVETS:
        add(rivet_pop(r), F(fr), 1.0, r.uniform(-0.6, 0.6))
    cue(F(RIVETS[0]), "rivets pop (16, machine-gun)")
    add(metal_groan(1.4, r, 70, 45, 1.2), F(860), 1.0)
    add(boom(r), BURST, 1.6, 0, "TANK BURSTS (boom + tearing steel)")
    add(rumble(1.2, r, 1.0, 0.05), BURST + 0.05, 1.0)
    # ---- 8: the wave down the street; screams; El slam
    a, b = s_(8)
    add(rumble(b - a + 0.3, r, 0.45, 0.2), a - 0.1, 1.0, what="wave roar (street)")
    for tm, base in ((a + 0.6, 170), (a + 1.9, 240), (a + 3.1, 150)):
        add(G.whoa(r, base), tm, 0.8, r.uniform(-0.5, 0.5), "screams")
    steps(a, a + 3.8, r, 6.0, 0.6)
    add(clang(r, 1.4), EL_SLAM, 1.3, 0.2, "wave slams the El (iron clang)")
    add(G.rattle(1.2, r, 80, np.exp(-np.linspace(0, 1, ns(1.2)) * 2.5), heavy=True), EL_SLAM + 0.02, 0.6, 0.2)
    add(metal_groan(1.8, r, 48, 32, 1.1), EL_SLAM + 0.15, 1.0, 0.3, "El girders bend")
    # ---- 9-10: grandpa's bench: birds, slow tap drip, a sip
    a, b = s_(9)[0], s_(10)[1]
    add(G.bird_chirps(b - a, r, 0.5), a, 0.5, what="sparrows")
    add(G.breeze(b - a, r, 0.4), a)
    for tm in (F(1130), F(1190)):
        add(drip_plink(r, 700), tm, 0.5, 0.2, "slow drip from the tap")
    sip = bp(r.standard_normal(ns(0.4)), 800, 5000, 1) * np.sin(np.pi * tt(0.4) / 0.4) * 0.3
    add(sip, F(1105), 0.5, -0.1, "grandpa sips")
    # ---- 11: rumble approaching, grandpa gasps
    a, b = s_(11)
    add(rumble(b - a + 0.3, r, 0.9, 1.4), a, 0.9, 0.5, "approaching wave rumble")
    add(G.whoa(r, 120, 0.5), F(1263), 0.8, 0, "grandpa: whoa")
    # ---- 12: cold night: wind, one slow drip, frost twinkles
    a, b = s_(12)
    add(G.breeze(b - a + 0.3, r, 0.8, bright=600), a)
    add(drip_plink(r, 600), F(1350), 0.4, 0, "one slow cold drip")
    for i in range(5):
        add(I.glock(m2f(100 + (i * 3) % 7), 0.25, r, 0.5) * 0.3, a + 0.3 + i * 0.42, 0.4, r.uniform(-0.6, 0.6))
    cue(a + 0.3, "frost twinkles")
    # ---- 13: kitchen: fridge door, cold honey stuck; warm honey pours
    a, b = s_(13)
    add(G.hammer_hit(r, 0.25) * 0.4, a + 0.1, 0.5, -0.4, "fridge door clunk")
    pour_d = b - WARM + 0.2; pt = tt(pour_d)
    pour = bp(colored(len(pt), r, 0.8), 400, 3000, 1) * (0.6 + 0.4 * smooth_noise(len(pt), r, 6)) * np.clip(pt / 0.1, 0, 1)
    pour += G.bubbles(pour_d, r, 25, 250, 900, (0.015, 0.05), rise=(1, 4)) * 0.7
    add(pour * 0.6, WARM, 0.8, 0.2, "warm honey pours")
    # ---- 14: warm load: pump, steam, creaking thin steel
    a, b = s_(14)
    pump(a, F(1534), r, 1.6, 0.8); add(steam(F(1534) - a, r, 1.0), a)
    add(metal_groan(2.0, r, 66, 52, 0.9), F(1534), 1.0, 0, "thin steel creaks")
    add(metal_groan(1.4, r, 72, 60, 0.7), F(1575), 0.9, 0.3)
    # ---- 15: night rescuers: sticky boots, lantern creak, effort grunts
    a, b = s_(15)
    add(G.breeze(b - a, r, 0.5, bright=500), a)
    for i in range(3):
        k = 0
        while True:
            tm = (np.pi / 2 - i * 1.7 + 2 * np.pi * k) / 3.2  # tug peaks: sin(t*3.2 + i*1.7) = 1
            k += 1
            if tm < a:
                continue
            if tm > b:
                break
            add(squelch(r), tm - 0.3, 0.8, (-0.5, 0, 0.5)[i])
    cue(a, "sticky boot squelches (rescuers)")
    add(G.oof(r, "ugh", 120), a + 1.2, 0.6, -0.4, "effort grunts")
    add(G.oof(r, "ugh", 140), a + 2.6, 0.6, 0.4)
    # ---- 16: quiet street
    a, b = s_(16)
    add(G.breeze(b - a, r, 0.6, bright=500), a)
    add(drip_plink(r, 500), a + 0.8, 0.3)
    # ---- 17: the anarchist bomb bubble: pop + fizzing fuse
    add(G.whoosh(0.25, r, peak=0.1, f_lo=1500, f_hi=5000) * 0.6, BOMB - 0.08, 0.7, 0.3, "thought bubble pops in")
    fz = hp(r.standard_normal(ns(1.1)), 3000) * (0.6 + 0.4 * np.abs(np.sin(TAU * 13 * tt(1.1))))
    add(fz * 0.25, BOMB + 0.1, 0.8, 0.3, "fuse fizz")
    # ---- 18: court: room murmur, gavel, pen scratching the signature
    a, b = s_(18)
    for i in range(4):
        add(G.babble(1.4, r, 110 + 25 * i, 1.0, rate=4, active=0.6) * 0.3, a + i * 0.2, 0.5, (-0.6, -0.2, 0.2, 0.6)[i])
    cue(a, "court murmur")
    add(G.hammer_hit(r, 1.2), GAVEL, 1.2, 0.1, "GAVEL")
    sd = SIGN[1] - SIGN[0]; sn = ns(sd)
    scr = bp(r.standard_normal(sn), 2500, 9000, 2) * (0.5 + 0.5 * np.abs(np.sin(TAU * 7 * np.arange(sn) / SR)))
    add(scr * 0.35, SIGN[0], 0.7, -0.2, "pen scratches the signature")
    # ---- 19: summer harbour: gulls, lapping water, brush strokes
    a, b = s_(19)
    add(G.water_bed(b - a, r, 0.4, 0.5) * 0.5, a, what="summer harbour water")
    for tm in (a + 0.5, a + 1.2, a + 2.8):
        add(gull(r), tm, 0.45, r.uniform(-0.6, 0.6))
    tm = a + 0.3
    while tm < a + 1.8:
        add(swish(r) * 0.6, tm, 0.6, 0.2); tm += 0.63
    # ---- crossfade whooshes at the place/time changes
    for f0 in (1095, 1298, 1368, 1478, 1598, 1756, 1815, 1965):
        add(G.whoosh(0.5, r, peak=0.28, f_lo=500, f_hi=2500, tail=0.15) * 0.35, F(f0) - 0.28, 0.6)
    return out


# ================================================================ MUSIC
class Band:
    def __init__(self):
        self.tr = {}
    def add(self, name, x, t, p=0.0, g=1.0):
        if name not in self.tr:
            self.tr[name] = np.zeros((2, N))
        place(self.tr[name], pan(x, p) if np.ndim(x) == 1 else x, t, g)

NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}
def n(s):
    """'E5' -> midi"""
    name, octv = s[:-1], int(s[-1])
    return 12 * (octv + 1) + NOTE[name]
CHORD = {"C": ["C", "E", "G"], "G7": ["G", "B", "D", "F"], "F": ["F", "A", "C"], "Am": ["A", "C", "E"], "Dm": ["D", "F", "A"],
         "E7": ["E", "G#", "B", "D"], "Bdim": ["B", "D", "F"], "Fm": ["F", "Ab", "C"], "D7": ["D", "F#", "A", "C"]}
NOTE["G#"] = 8
def chord_midi(c, octv=4):
    return [12 * (octv + 1) + NOTE[x] + (12 if NOTE[x] < NOTE[CHORD[c][0]] else 0) for x in CHORD[c]]
def root(c, octv=2):
    return 12 * (octv + 1) + NOTE[CHORD[c][0]]

Q = 0.5  # quarter note at 120 bpm
RAG = [  # 8 bars: (beat, note, beats)
    [(0, "E5", .5), (.5, "G5", .5), (1, "C6", .75), (1.75, "G5", .25), (2, "E5", .5), (2.5, "D5", .5), (3, "C5", 1)],
    [(0, "E5", .25), (.25, "F5", .25), (.5, "G5", .5), (1, "A5", .5), (1.5, "G5", .5), (2, "E5", 1), (3, "G5", 1)],
    [(0, "F5", .5), (.5, "D5", .5), (1, "B4", .75), (1.75, "D5", .25), (2, "F5", .5), (2.5, "A5", .5), (3, "G5", 1)],
    [(0, "E5", .5), (.5, "C5", .5), (1, "G4", .5), (1.5, "C5", .5), (2, "E5", 1.5)],
    [(0, "A5", .5), (.5, "F5", .5), (1, "C6", .75), (1.75, "A5", .25), (2, "F5", .5), (2.5, "A5", .5), (3, "C6", 1)],
    [(0, "G5", .5), (.5, "E5", .5), (1, "C5", .5), (1.5, "E5", .5), (2, "G5", 1), (3, "E5", 1)],
    [(0, "D5", .25), (.25, "E5", .25), (.5, "F5", .5), (1, "G5", .5), (1.5, "B5", .5), (2, "D6", .5), (2.5, "B5", .5), (3, "G5", 1)],
    [(0, "C6", 1), (1, "G5", .5), (1.5, "E5", .5), (2, "C5", 1.5)],
]
RAG_CH = ["C", "C", "G7", "C", "F", "C", "G7", "C"]


def music():
    b = Band()
    r = R()
    def rag(t0, bars, vel=0.7, mel=True, until=None):
        for i, bi in enumerate(bars):
            tb = t0 + i * 4 * Q
            c = RAG_CH[bi]
            for k in range(4):  # oom-pah: tuba on 1 and 3, piano chord on 2 and 4
                tm = tb + k * Q
                if until and tm >= until:
                    return
                if k % 2 == 0:
                    rt = root(c) + (7 if k == 2 and c != "G7" else 0)
                    b.add("tuba", I.brass(m2f(rt), Q * 0.8, 0.65 * vel, r, "tuba"), tm, -0.1)
                else:
                    for m in chord_midi(c, 4):
                        b.add("piano", I.pluck(m2f(m), 0.42 * vel, r, 0.5, 0.65), tm + r.normal(0, 0.004), 0.15)
            if mel:
                for bt, nn, d in RAG[bi]:
                    tm = tb + bt * Q
                    if until and tm >= until:
                        return
                    b.add("piano", I.pluck(m2f(n(nn)), 0.7 * vel, r, max(0.4, d * Q * 2), 0.75), tm, 0.1)
                    if bi % 2 == 0:
                        b.add("glock", I.glock(m2f(n(nn) + 12), 0.35 * vel, r, 1.0), tm, 0.3)
            b.add("brush", I.brush(0.4, r), tb + 1 * Q, 0.0); b.add("brush", I.brush(0.4, r), tb + 3 * Q, 0.0)

    # A. hook 0-5.53: urgent A minor ostinato, snare roll and cymbal swell into the flash
    t = 0.0
    ost = ["A2", "E3", "A3", "C4", "E4", "C4", "A3", "E3"]
    while t < FLASH - 0.05:
        k = int(round(t / (Q / 2)))
        b.add("pluck", I.pluck(m2f(n(ost[k % 8])), 0.7, r, 0.35, 0.6), t, (-0.3 if k % 2 else 0.3))
        if k % 2 == 0:
            b.add("tuba", I.brass(m2f(n("A1") if (k // 8) % 2 == 0 else n("F1")), Q * 0.4, 0.75, r, "tuba"), t, 0)
        t += Q / 2
    for tm, v in I.snare_roll(3.3, FLASH - 0.03, 0.15, 0.9, r):
        b.add("snare", I.snare(v, r, 0.12, buzz=True), tm, 0.0)
    for k, cc in enumerate([["A3", "C4", "E4"], ["F3", "A3", "C4"], ["E3", "G#3", "B3"]]):
        for m in cc:
            b.add("stab", I.brass(m2f(n(m)), 0.25, 0.7, r, "stab"), 1.0 + k * 1.5, 0.2)
    b.add("cymbal", I.cymbal(0.8, r, 2.0)[::-1].copy() * np.linspace(0, 1, ns(2.0)) ** 2, FLASH - 2.0, 0)
    # B. ragtime 5.6 -> groan
    rag(5.65, range(8), 0.8, True, until=F(615))
    # C. tension 20.5 -> burst: low brass chords, creeping chromatic tuba, timpani roll
    for k, (c, m) in enumerate([(["A2", "C3", "E3"], "A1"), (["Bb2", "D3", "F3"], "Bb1"), (["B2", "D3", "F3"], "B1"), (["C3", "Eb3", "Gb3"], "C2")]):
        t0 = F(615) + k * 2.2
        b.add("pad", I.pad([m2f(n(x)) for x in c], 2.0, 0.55, r, att=0.4, warm=600), t0)
        for q in range(4):
            b.add("tuba", I.brass(m2f(n(m) + (q % 2)), 0.42, 0.55 + 0.05 * k, r, "soft"), t0 + q * 0.55, -0.1)
    add_roll = [(tm, v) for tm, v in I.snare_roll(F(845), BURST - 0.02, 0.1, 1.0, r, 18)]
    for tm, v in add_roll:
        b.add("timpani", I.timpani(m2f(n("A1")), v * 0.6, r, 0.5), tm, 0)
    b.add("glock", I.glock(m2f(n("C6")), 0.4, r, 0.6), F(750), 0.3)   # "totally fine" ting
    b.add("glock", I.glock(m2f(n("G6")), 0.35, r, 0.6), F(750) + 0.12, 0.3)
    # burst hit
    b.add("timpani", I.timpani(m2f(n("A1")), 1.0, r, 3.0), BURST, 0)
    b.add("cymbal", I.cymbal(1.0, r, 3.0), BURST, 0)
    for m in ["A2", "Eb3", "A3", "C4", "Eb4"]:
        b.add("stab", I.brass(m2f(n(m)), 0.6, 0.95, r, "stab", fall=-3), BURST, 0)
    # D. chaos 30.8 -> 36.5: driving A minor, snare 8ths, stabs every bar, El slam crash
    t0 = F(925)
    t = t0
    while t < F(1095) - 0.1:
        k = int(round((t - t0) / (Q / 2)))
        b.add("pluck", I.pluck(m2f(n(["A2", "A3", "C4", "A3", "E3", "A3", "D4", "A3"][k % 8])), 0.65, r, 0.3, 0.7), t, 0.25 if k % 2 else -0.25)
        b.add("snare", I.snare(0.35 + 0.25 * (k % 2), r, 0.2), t, 0)
        if k % 8 == 0:
            for m in (["A3", "C4", "E4"] if (k // 8) % 2 == 0 else ["G3", "B3", "D4"]):
                b.add("stab", I.brass(m2f(n(m)), 0.3, 0.7, r, "stab"), t, 0.2)
            b.add("tuba", I.brass(m2f(n("A1")), 0.5, 0.7, r, "tuba"), t, 0)
        t += Q / 2
    b.add("cymbal", I.cymbal(1.0, r, 2.5), EL_SLAM, 0.2)
    b.add("timpani", I.timpani(m2f(n("E2")), 1.0, r, 2.0), EL_SLAM, 0)
    # E. grandpa's saying 36.5 -> 41.1: warm pad, music box tune; "Luckily" sting up
    a = F(1095)
    for k, c in enumerate([["F3", "A3", "C4"], ["C3", "E3", "G3"]]):
        b.add("pad", I.pad([m2f(n(x)) for x in c], 2.0, 0.45, r, att=0.5), a + k * 2.0)
    for k, nn in enumerate(["C6", "A5", "F5", "G5", "E5", "C5"]):
        b.add("musicbox", I.musicbox(m2f(n(nn)), 0.5, r, 1.4), a + 0.3 + k * 0.6, 0.2)
    for k, nn in enumerate(["C5", "E5", "G5", "C6"]):
        b.add("glock", I.glock(m2f(n(nn)), 0.5, r, 0.9), F(1182) + k * 0.09, 0.3)
    b.add("pad", I.pad([m2f(n(x)) for x in ["C3", "E3", "G3", "C4"]], 1.6, 0.4, r, att=0.2), F(1182))
    # F. "Unluckily": dim stab + timpani rumble to the cut
    for m in ["B2", "D3", "F3", "Ab3"]:
        b.add("stab", I.brass(m2f(n(m)), 0.5, 0.85, r, "stab", fall=-2), F(1234), 0)
    for tm, v in I.snare_roll(F(1250), F(1296), 0.15, 0.8, r, 16):
        b.add("timpani", I.timpani(m2f(n("D2")), v * 0.55, r, 0.5), tm, 0)
    # G. night drip 43.3 -> 45.6: sparse music box over an A minor pad
    a = F(1298)
    b.add("pad", I.pad([m2f(n(x)) for x in ["A2", "E3", "C4"]], 2.2, 0.4, r, att=0.6, warm=500), a)
    for k, nn in enumerate(["E6", "C6", "A5"]):
        b.add("musicbox", I.musicbox(m2f(n(nn)), 0.4, r, 1.6), a + 0.2 + k * 0.75, 0.3)
    # H. kitchen 45.6 -> 49.3: pizzicato; slow and stuck (cold), then a quick run (warm)
    a = F(1368)
    for k, nn in enumerate(["C4", "E4", "G4", "E4", "C4", "D4"]):
        b.add("pluck", I.pluck(m2f(n(nn)), 0.55, r, 0.7, 0.6), a + 0.1 + k * 0.25, 0.2)
    for k, nn in enumerate(["C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6"]):
        b.add("pluck", I.pluck(m2f(n(nn)), 0.6, r, 0.4, 0.8), WARM + k * 0.07, 0.2)
    rag(WARM + 0.6, [0, 1], 0.6, True, until=F(1474))
    # I. warm load 49.3 -> 53.3: tension pad, creeping tuba, timpani
    a = F(1478)
    for k, c in enumerate([["D3", "F3", "A3"], ["Eb3", "Gb3", "A3"]]):
        b.add("pad", I.pad([m2f(n(x)) for x in c], 1.9, 0.5, r, att=0.4, warm=600), a + k * 2.0)
        for q in range(4):
            b.add("tuba", I.brass(m2f(n("D2") + k + (q % 2)), 0.4, 0.55, r, "soft"), a + k * 2.0 + q * 0.5, -0.1)
    for tm, v in I.snare_roll(F(1534), F(1594), 0.1, 0.6, r, 14):
        b.add("timpani", I.timpani(m2f(n("D2")), v * 0.5, r, 0.5), tm, 0)
    # J. night rescue 53.3 -> 58.5: somber D minor pad, slow vibes line
    a = F(1598)
    for k, c in enumerate([["D3", "F3", "A3"], ["Bb2", "D3", "F3"], ["A2", "C#3", "E3"]]):
        b.add("pad", I.pad([m2f(n(x)) for x in c], 1.75, 0.45, r, att=0.5, warm=550), a + k * 1.75)
    for k, nn in enumerate(["A4", "F4", "D4", "E4", "C#4"]):
        b.add("vibes", I.vibes(m2f(n(nn)), 0.45, r, 1.4), a + 0.3 + k * 0.95, -0.2)
    # K. anarchists 58.5 -> 60.5: sad-trombone tuba wah-wah
    for k, nn in enumerate(["Bb2", "A2", "Ab2", "G2"]):
        b.add("tuba", I.brass(m2f(n(nn)), 0.32 if k < 3 else 0.7, 0.7, r, "horn", fall=-1.5 if k == 3 else 0), F(1786) + k * 0.36, 0.1)
    # L. court 60.5 -> 65.5: snare march, tuba, horn chords; gavel accent
    a = F(1815)
    for bar in range(3):
        tb = a + bar * 4 * Q * 0.85
        for k in range(8):
            b.add("snare", I.snare(0.3 + (0.25 if k % 2 == 0 else 0), r, 0.2), tb + k * Q * 0.425, 0)
        for k, c in enumerate(["Dm", "A7" if False else "E7"]):
            for m in chord_midi(c, 3):
                b.add("horn", I.brass(m2f(m), 0.7, 0.5, r, "horn"), tb + k * 2 * Q * 0.85, 0.15)
            b.add("tuba", I.brass(m2f(root(c)), 0.6, 0.6, r, "tuba"), tb + k * 2 * Q * 0.85, -0.1)
    b.add("timpani", I.timpani(m2f(n("D2")), 1.0, r, 2.0), GAVEL, 0)
    for k, nn in enumerate(["D5", "F5", "A5", "D6"]):
        b.add("glock", I.glock(m2f(n(nn)), 0.4, r, 1.0), SIGN[1] - 0.2 + k * 0.09, 0.3)
    # M. finale 65.5 -> end: ragtime reprise, final chord
    rag(F(1965) + 0.05, [0, 1, 6], 0.75, True)
    tf = F(1965) + 0.05 + 3 * 4 * Q
    for m in [n("C3"), n("E4"), n("G4"), n("C5"), n("E5")]:
        b.add("piano", I.pluck(m2f(m), 0.75, r, 2.2, 0.6), tf, 0.1)
    b.add("tuba", I.brass(m2f(n("C2")), 1.0, 0.8, r, "tuba"), tf, 0)
    b.add("glock", I.glock(m2f(n("C6")), 0.5, r, 1.8), tf, 0.3)
    b.add("cymbal", I.cymbal(0.4, r, 2.0), tf, 0.2)

    TARGET = {"piano": 0, "tuba": -3, "glock": -7, "pluck": -2, "stab": -2, "snare": -7, "cymbal": -10, "timpani": -4, "pad": -4,
              "musicbox": -2, "vibes": -3, "brush": -14, "horn": -4}
    hall = make_ir(1.3, 7, pre=0.015, hf=1.4)
    dry = np.zeros((2, N)); wet = np.zeros((2, N))
    for k, x in b.tr.items():
        L = integrated(x)
        if not np.isfinite(L):
            continue
        x = x * dbg(-20 + TARGET.get(k, -6) - L)
        dry += x
        wet += (0.25 if k in ("pad", "musicbox", "vibes", "glock", "horn") else 0.12) * x
    out = dry + 0.7 * convolve_st(wet.mean(0), hall)[:, :N]
    # silence at the flash cut (the hook stops dead), short fade at the end
    tl = np.arange(N) / SR
    gate = np.ones(N)
    gate[(tl > FLASH + 0.08) & (tl < 5.62)] = 0.0
    out *= gate[None, :]
    out[:, -ns(0.4):] *= np.linspace(1, 0, ns(0.4))[None, :]
    return hp(out, 35, 2)


# ================================================================ MIX
def main():
    v24, sr = read_wav(os.environ.get("VOICE_WAV", os.path.join(HERE, "../voice/voice.wav")))
    v = signal.resample_poly(v24[0], SR, sr)
    voice = np.zeros(N); voice[: min(N, len(v))] = v[:N]
    voice = st(voice)
    words = json.load(open(os.environ.get("WORDS_JSON", os.path.join(HERE, "../voice/words.json"))))
    log("voice", round(integrated(voice), 1), "LUFS")
    m = music(); log("music done")
    s = sfx_stem(); log("sfx done")
    # duck the music 3 dB while the voice speaks (key = word timings)
    ctrl = 1000; nc = int(DUR * ctrl) + 2; va = np.zeros(nc)
    sp = []
    for w in words:
        a, e = float(w["start"]), float(w["end"])
        if sp and a - sp[-1][1] < 0.3: sp[-1][1] = max(sp[-1][1], e)
        else: sp.append([a, e])
    for a, e in sp: va[max(0, int((a - 0.08) * ctrl)): int((e + 0.12) * ctrl)] = 1
    env = np.zeros(nc); x = 0.0
    for i in range(nc):
        x += (va[i] - x) * ((1 - np.exp(-1 / 70)) if va[i] > x else (1 - np.exp(-1 / 450))); env[i] = x
    duck = dbg(np.interp(np.arange(N) / SR, np.arange(nc) / ctrl, -3.0 * env))
    m = m * duck[None, :]
    Lv = integrated(voice)
    m *= dbg(Lv - 10.0 - integrated(m))          # music bed -10 LU under the voice (+3 dB standard)
    s *= dbg(Lv - 6.0 - integrated(s))           # SFX stem -6 dB
    # keep the words on top: wherever the voice speaks, the SFX stay >= 5 LU under it (short-term, smoothed)
    from dsp import short_term
    Sv, Ss = short_term(voice), short_term(s)
    k = min(len(Sv), len(Ss))
    red = np.minimum(0.0, (Sv[:k] - 5.0) - Ss[:k])
    red[~np.isfinite(red)] = 0.0
    red[Sv[:k] < -40] = 0.0
    from scipy import ndimage
    red = ndimage.minimum_filter1d(red, 5)
    red = ndimage.uniform_filter1d(red, 5)
    s *= dbg(np.interp(np.arange(N) / SR, np.arange(k) * 0.1 + 1.5, red))[None, :]
    # louder moments: the hook, burst and El slam ride up; the flash cut is silent
    mix = voice + m + s
    gain = dbg(-14.6 - integrated(mix))
    mix *= gain
    # look-ahead peak limiter at 4x oversampling, ceiling -1.2 dBTP
    ceil = dbg(-1.2)
    up = signal.resample_poly(mix, 4, 1, axis=1)
    pk = np.abs(up).max(0).reshape(-1, 4).max(1)
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    la = ns(0.004)
    g = np.ones(N); cur = 1.0
    win = np.lib.stride_tricks.sliding_window_view(np.concatenate([need, np.ones(la)]), la + 1).min(1)[:N]
    for i in range(N):
        tgt = win[i]
        cur = tgt if tgt < cur else cur + (tgt - cur) * (1 - np.exp(-1 / (0.08 * SR)))
        g[i] = cur
    mix *= g[None, :]
    log("master", round(integrated(mix), 2), "LUFS, TP", round(true_peak(mix), 2), "dBTP, length", mix.shape[1] / SR)
    os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
    write_wav(os.path.join(HERE, "out", "mix.wav"), mix)
    write_wav(os.path.join(HERE, "out", "stem_voice.wav"), voice * gain)
    write_wav(os.path.join(HERE, "out", "stem_music.wav"), m * gain)
    write_wav(os.path.join(HERE, "out", "stem_sfx.wav"), s * gain)
    with open(os.path.join(HERE, "out", "cues.md"), "w") as fh:
        fh.write("# Sound cues (time s: event)\n\n" + "\n".join(f"- {t:6.2f}  {w}" for t, w in sorted(cues)) + "\n")
    log("written", len(cues), "cues")

if __name__ == "__main__":
    main()
