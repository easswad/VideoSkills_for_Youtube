// Timeline of "Slower Than Molasses in January" (Boston, 15 Jan 1919): shots timed to the voice words
// (~/molasses-short/voice/fable/words.json, frame = word start x 30), story physics (the tank, the wave, the elevated
// railway) and the bridge short's camera grammar: smootherstep glides 18-40 f, every hold creeps in, cuts on big
// reframes, 7-frame flip kicks on impacts.
export const FPS = 30;
export const TOTAL = 2092;
export const D0 = 0; // street level (m)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- places ----------------
export const TANK: V3 = [0, 0, -22]; // centre of the tank base
export const TANK_R = 13.5, TANK_H = 15;
export const STREET = { z0: -5, z1: 5 }, WALK_Z = 7.2; // house fronts on the north side
export const EL = { y: 5.4, z0: -4.6, z1: -0.4, colZ: [-4.4, -0.6] as const }; // Atlantic Avenue elevated railway
export const WHARF_Z = -44; // wharf edge (water beyond)
export const KITCHEN: V3 = [600, 0, 0];
export const COURT: V3 = [-600, 0, 0];
export const BENCH: V3 = [-30, 0, -6.2]; // grandpa's bench (harbour side of the street, facing the street)
export const BARREL: V3 = [-28.7, 0, -6.4];

// ---------------- the wave (ft = seconds since the tank burst, story time) ----------------
export const SPEED = 15.6; // 35 mph
export const frontR = (ft: number, th = 0) => TANK_R + SPEED * ft + (ft > 0 ? 1.1 * Math.sin(5 * th + 1.3) + 0.6 * Math.sin(11 * th + ft) : 0);
export const crestA = (r: number) => 7.6 * Math.exp(-Math.max(0, r - TANK_R) / 55); // 25 ft at the tank, lower further out
/** molasses surface height above the street at (x, z), or < 0 where there is none */
export const floodH = (x: number, z: number, ft: number, settled = false) => {
  if (z > WALK_Z - 0.1) return -1;
  const dx = x - TANK[0], dz = z - TANK[2], r = Math.hypot(dx, dz);
  if (settled) return r < 120 ? 0.55 + 0.04 * Math.sin(x * 0.7 + z * 0.4) : -1;
  if (ft <= 0) return -1;
  const R = frontR(ft, Math.atan2(dz, dx)), d = R - r;
  if (d < 0) return -1;
  const A = crestA(r), plateau = 0.9 + 2.1 * Math.exp(-ft / 4);
  const face = smooth(d / 2.4);
  const crest = d < 2.4 ? A * face : A * Math.exp(-(d - 2.4) / (6 + 4 * ft));
  return Math.max(crest, plateau * smooth(d / 4)) + 0.05 * Math.sin(x * 1.3 + z * 0.9 + ft * 3);
};
/** the elevated railway after the wave: sag (m) and push toward +z near x = 0 */
export const elBend = (x: number, ft: number) => {
  const k = smooth((ft - 0.28) / 0.5) * Math.exp(-((x / 13) ** 2));
  return { sag: 1.6 * k, push: 1.1 * k, tilt: 0.12 * k };
};

// ---------------- shots ----------------
export type Light = "day" | "golden" | "night";
export type Tank = "grey" | "paint" | "brown" | "burst" | "gone";
export type ShotDef = {
  id: number; a: number; b: number; light: Light;
  /** seconds since the burst for the wave (null = no wave) */
  ft?: (t: number) => number; settled?: boolean; tank: Tank; water?: "blue" | "brown"; sunAz?: number; sunEl?: number;
};
const W = (f: number) => f / FPS; // word frame -> seconds
export const BURST_F = 892, PAINT_F = 415;
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 168, light: "day", tank: "burst", sunAz: 150, ft: (t) => 1.9 + 0.18 * t },                    // hook: the wave chases runners
  { id: 2, a: 168, b: 310, light: "day", tank: "grey", sunAz: 110 },                                    // the harbour, the tank
  { id: 3, a: 310, b: 450, light: "day", tank: "paint" },                                               // leaks; paint it brown
  { id: 4, a: 450, b: 545, light: "day", tank: "brown" },                                               // kids with pails
  { id: 5, a: 545, b: 670, light: "day", tank: "brown", sunAz: 120 },                                   // the ship tops it up; groan
  { id: 6, a: 670, b: 785, light: "day", tank: "brown" },                                               // the manager
  { id: 7, a: 785, b: 925, light: "day", tank: "brown", ft: (t) => 0.55 * (t - W(BURST_F)) },          // lunch; rivets; burst
  { id: 8, a: 925, b: 1095, light: "day", tank: "burst", sunAz: 150, ft: (t) => (t < W(1047) ? 0.6 + 0.3 * (t - W(925)) : 0.12 + 0.36 * (t - W(1047))) },
  { id: 9, a: 1095, b: 1180, light: "day", tank: "brown", sunAz: 140 },                                             // grandpa: the old saying
  { id: 10, a: 1180, b: 1232, light: "day", tank: "brown", sunAz: 140 },                                            // "Luckily, it was January"
  { id: 11, a: 1232, b: 1298, light: "day", tank: "burst", ft: (t) => 0.78 + 0.16 * (t - W(1232)) },   // "nobody told the molasses"
  { id: 12, a: 1298, b: 1368, light: "night", tank: "brown", sunAz: 150 },                                          // molasses crawls in the cold
  { id: 13, a: 1368, b: 1478, light: "day", tank: "brown", sunAz: 150, sunEl: 55 },                     // kitchen: honey from the fridge
  { id: 14, a: 1478, b: 1598, light: "day", tank: "brown", sunAz: 120 },                                // warm load; thin steel
  { id: 15, a: 1598, b: 1705, light: "night", tank: "gone", settled: true },                            // night: rescuers stuck
  { id: 16, a: 1705, b: 1756, light: "night", tank: "gone", settled: true },                            // the quiet street
  { id: 17, a: 1756, b: 1815, light: "day", tank: "gone", settled: true },                              // the company blamed anarchists
  { id: 18, a: 1815, b: 1965, light: "day", tank: "gone", sunAz: 150, sunEl: 60 },                      // the court; the engineer's signature
  { id: 19, a: 1965, b: TOTAL, light: "golden", tank: "gone", water: "brown", sunAz: -25, sunEl: 9 },   // summer: the brown harbour
];
/** crossfades (frames) at place/time changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 9: 6, 12: 8, 13: 8, 14: 8, 15: 8, 17: 8, 18: 8, 19: 10 };
export const FLASH_AT = 166;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** paint progress on the tank 0 (grey steel) .. 1 (brown) */
export const paintK = (id: number, f: number) => {
  const s = SHOTS[id - 1];
  if (s.tank === "grey") return 0;
  if (s.tank === "paint") return smooth((f - PAINT_F - 4) / 32);
  return 1;
};
/** wall bulge 0..1 (groaning tank) */
export const bulgeK = (id: number, f: number) => {
  if (id === 5) return smooth((f - 622) / 30) * (0.6 + 0.4 * Math.sin(f * 0.35));
  if (id === 6) return 0.5 + 0.3 * Math.sin(f * 0.3);
  if (id === 7) return f < 811 ? 0.4 : 0.8 + 0.2 * Math.sin(f * 0.9);
  if (id === 14) return 0.7 + 0.3 * Math.sin(f * 0.32);
  return 0;
};
/** rivets popping, machine-gun style: frame of each pop (shot 7) */
export const RIVET_F = Array.from({ length: 16 }, (_, i) => 815 + i * 3 + (i % 3 === 2 ? 1 : 0));

// ---------------- runners in the hook ----------------
export const RUN_V = 3.4;
export const runX = (t: number) => -40.5 - RUN_V * t;

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });
const add = (a: V3, x: number, y: number, z: number): V3 => [a[0] + x, a[1] + y, a[2] + z];

/** x of the wave front on the street line z, for tracking shots */
export const frontX = (ft: number, z = 1) => { const R = frontR(ft, Math.PI), dz = z - TANK[2]; return -Math.sqrt(Math.max(0, R * R - dz * dz)); };

// shot 1: the hook. The camera backs away down the street ahead of the runners, the wave behind them.
const S1a = (f: number) => { const x = runX(T(f)); return dolly([x - 11, 2.0, 3.6], [x + 6, 3.2, -1.5], pushK(f, 0, 0.0018), { fov: 52 }); };
const S1b = (f: number) => { const x = runX(T(f)); return dolly([x - 9.5, 1.15, 2.2], [x + 1, 1.55, 0.2], pushK(f, 69, 0.002), { fov: 42, roll: -0.04 }); };
const S1c = (f: number) => { const x = runX(T(f)); return dolly([x - 8, 0.45, -1.2], [x + 3, 2.6, 0.8], pushK(f, 116, 0.003), { fov: 46, roll: 0.05 }); };
// shot 2: the harbour from the air, down to the tank
const S2a = (f: number) => zoom([62, 42, 34], [0, 3, -26], 44, pushK(f, 162, 0.0018));
const S2b = (f: number) => dolly([26, 12, 6], [0, 7, -22], pushK(f, 216, 0.0015, 0.005, 30), { fov: 42 });
// shot 3: a leaking seam (grey steel) -> the painter slaps on brown
const S3a = (f: number) => dolly([2.4, 2.0, -3.4], [0, 3.6, -8.5], pushK(f, 310, 0.0025), { fov: 40, roll: 0.03 });
const S3b = (f: number) => dolly([7.5, 2.6, 0.6], [0.6, 3.6, -8.4], pushK(f, 415, 0.0015, 0.006, 30), { fov: 44 });
// shot 4: kids with pails under the drips
const S4a = (f: number) => dolly([1.2, 1.0, -2.4], [0.1, 1.15, -7.2], pushK(f, 450, 0.0025), { fov: 40 });
const S4b = (f: number) => dolly([0.3, 0.95, -4.0], [0.4, 1.0, -7.1], pushK(f, 520, 0.002), { fov: 38, roll: -0.04 });
// shot 5: the ship tops the tank up; the steel groans
const S5a = (f: number) => zoom([34, 6.5, -21], [2, 4, -42], 46, pushK(f, 545, 0.0018));
const S5b = (f: number) => dolly([15.5, 1.8, -8.5], [8.2, 6.5, -12.5], pushK(f, 625, 0.0028), { fov: 42, roll: -0.05 });
// shot 6: the manager in front of the tank
const MANAGER: V3 = [-4.2, 0, -6.9];
const S6a = (f: number) => dolly(add(MANAGER, 0.7, 1.65, 4.6), add(MANAGER, 0, 1.75, 0), pushK(f, 670, 0.0022), { fov: 38 });
const S6b = (f: number) => dolly(add(MANAGER, 0.2, 1.7, 3.2), add(MANAGER, 0, 1.8, 0), pushK(f, 728, 0.002, 0.005, 30), { fov: 36, roll: 0.04 });
// shot 7: lunch -> rivets -> the burst
const WORKER: V3 = [2.4, 0, -6.6];
const S7a = (f: number) => dolly(add(WORKER, 2.5, 1.3, 4.2), add(WORKER, -0.6, 1.6, -0.6), pushK(f, 785, 0.002), { fov: 42 });
const S7b = (f: number) => dolly([1.5, 1.6, -5.3], [0, 2.6, -8.5], pushK(f, 811, 0.0015, 0.007, 50), { fov: 34, roll: 0.04 });
const S7c = (f: number) => zoom([34, 8, 18], [0, 6.5, -22], 48, pushK(f, 879, 0.0015));
// shot 8: the wave down the street, alongside it, into the El
const S8a = (f: number) => dolly([-46, 3.2, 3.8], [-16, 4.2, -9], pushK(f, 925, 0.002), { fov: 48 });
const S8b = (f: number) => { const x = frontX(SHOTS[7].ft!(T(f)), 1); return { pos: [x - 7, 1.2, 5.6] as V3, look: [x + 0.5, 2.8, -1.5] as V3, fov: 46, roll: -0.05 }; };
const S8c = (f: number) => zoom([16, 3.2, 6.6], [3, 5.2, -2.6], 44, pushK(f, 1047, 0.0015, 0.004, 24));
// shots 9-11: grandpa on his bench; the barrel tap and the snail
const S9a = (f: number) => dolly(add(BENCH, -1.4, 1.35, 4.8), add(BENCH, 0.4, 1.15, 0), pushK(f, 1095, 0.0022), { fov: 40 });
const S9b = (f: number) => dolly(add(BARREL, 0.55, 0.8, 1.25), add(BARREL, 0, 0.72, 0.36), pushK(f, 1120, 0.002), { fov: 32 });
const S10a = (f: number) => dolly(add(BENCH, -0.5, 1.2, 2.6), add(BENCH, 0, 1.12, 0), pushK(f, 1180, 0.0025), { fov: 36, roll: -0.03 });
const S11a = (f: number) => dolly(add(BENCH, -1.6, 0.8, 5.2), add(BENCH, 1.5, 3.4, -5), pushK(f, 1232, 0.002, 0.006, 30), { fov: 46, roll: 0.05 });
// shot 12: the drip at night, crawling
const S12a = (f: number) => dolly(add(BARREL, 0.45, 0.78, 1.05), add(BARREL, 0, 0.7, 0.36), pushK(f, 1298, 0.0025), { fov: 30 });
// shot 13: the kitchen (honey)
const S13a = (f: number) => dolly(add(KITCHEN, 0.3, 1.45, 3.6), add(KITCHEN, 0.3, 1.25, 0), pushK(f, 1368, 0.0022), { fov: 40 });
const S13b = (f: number) => dolly(add(KITCHEN, 0.75, 1.3, 2.4), add(KITCHEN, 0.75, 1.2, 0), pushK(f, 1415, 0.002, 0.005, 26), { fov: 38, roll: 0.03 });
// shot 14: the warm load; the thin steel
const S14a = (f: number) => dolly([24, 3, -12], [6, 9, -30], pushK(f, 1478, 0.002), { fov: 44 });
const S14b = (f: number) => dolly([1.3, 3.5, -5.4], [0, 4.3, -8.5], pushK(f, 1534, 0.0015, 0.006, 34), { fov: 30, roll: -0.04 });
// shot 15: night, rescuers stuck in the molasses
const RESC: V3 = [-10, 0, 1.2];
const S15a = (f: number) => dolly(add(RESC, 0.6, 1.8, 7.4), add(RESC, 0, 1.0, 0), pushK(f, 1598, 0.002), { fov: 44 });
const S15b = (f: number) => dolly(add(RESC, 0.4, 0.95, 3.8), add(RESC, 0.4, 0.75, 0), pushK(f, 1655, 0.0025), { fov: 36, roll: 0.04 });
// shot 16: the quiet street at night
const S16a = (f: number) => zoom([-36, 9, 16], [0, 2.5, -14], 46, pushK(f, 1705, 0.0016));
// shot 17: the manager blames anarchists
const S17a = (f: number) => dolly(add(MANAGER, 0.9, 1.7, 4.3), add(MANAGER, 0.6, 1.95, 0), pushK(f, 1756, 0.0022, 0.005, 30), { fov: 40, roll: -0.03 });
// shot 18: the court; the engineer signs
const S18a = (f: number) => dolly(add(COURT, 0.9, 1.75, 5.2), add(COURT, 0.2, 2.1, -1.8), pushK(f, 1815, 0.002), { fov: 42 });
const S18b = (f: number) => dolly(add(COURT, 0.5, 2.0, 2.8), add(COURT, 0, 2.55, -2), pushK(f, 1834, 0.002, 0.006, 24), { fov: 38, roll: 0.04 });
const S18c = (f: number) => dolly(add(COURT, -2.6, 2.2, 2.7), add(COURT, -3.0, 1.25, 0.55), pushK(f, 1859, 0.0022), { fov: 42 });
// shot 19: summer, the brown harbour; crane out
const PAINTER_END: V3 = [3, 0, -42.6];
const S19a = (f: number) => dolly(add(PAINTER_END, 2.2, 1.7, 5.2), add(PAINTER_END, -0.4, 1.4, -2), pushK(f, 1965, 0.002), { fov: 42 });
const CRANE: V3[] = [[12, 8, -26], [10, 22, 6], [0, 0, -95]];
const S19b = (f: number): Shot => {
  const a = S19a(2020), s = glide((f - 2020) / 72), r = 1 - s, [C, B, L] = CRANE;
  return { pos: [0, 1, 2].map((i) => r * r * a.pos[i] + 2 * s * r * C[i] + s * s * B[i]) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3, fov: (a.fov ?? 42) + (46 - (a.fov ?? 42)) * s, roll: 0 };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 69, dur: 30, s: S1b }, { f: 116, cut: true, s: S1c }],
  2: [{ f: 162, s: S2a }, { f: 216, cut: true, s: S2b }],
  3: [{ f: 310, s: S3a }, { f: 415, cut: true, s: S3b }],
  4: [{ f: 450, s: S4a }, { f: 520, dur: 22, s: S4b }],
  5: [{ f: 545, s: S5a }, { f: 625, cut: true, s: S5b }],
  6: [{ f: 670, s: S6a }, { f: 728, dur: 24, s: S6b }, { f: 748, dur: 20, s: rolled(S6b, -0.03) }],
  7: [{ f: 785, s: S7a }, { f: 811, cut: true, s: S7b }, { f: 879, cut: true, s: S7c }],
  8: [{ f: 925, s: S8a }, { f: 1001, cut: true, s: S8b }, { f: 1047, cut: true, s: S8c }],
  9: [{ f: 1090, s: S9a }, { f: 1120, cut: true, s: S9b }],
  10: [{ f: 1180, s: S10a }],
  11: [{ f: 1232, s: S11a }],
  12: [{ f: 1294, s: S12a }],
  13: [{ f: 1364, s: S13a }, { f: 1413, cut: true, s: S13b }],
  14: [{ f: 1474, s: S14a }, { f: 1534, cut: true, s: S14b }],
  15: [{ f: 1594, s: S15a }, { f: 1655, cut: true, s: S15b }],
  16: [{ f: 1705, s: S16a }],
  17: [{ f: 1752, s: S17a }],
  18: [{ f: 1811, s: S18a }, { f: 1834, cut: true, s: S18b }, { f: 1859, cut: true, s: S18c }],
  19: [{ f: 1960, s: S19a }, { f: 2020, cut: true, s: S19b }],
};

// impact kicks: rivets (machine gun), the burst, the wave hitting the El, the gavel
const KICKS: [number, number][] = [
  ...RIVET_F.map((f) => [W(f), 0.35] as [number, number]), [W(BURST_F), 1.8], [W(1052), 1.4], [W(1838), 0.6],
];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },                                                         // hook wide
  { f: 69, dur: 30, cInf: 12, focus: (f) => [runX(T(f)) + 0.5, 1.6, 0.3] }, // runners MS
  { f: 116, cInf: 8, focus: (f) => [runX(T(f)), 1.4, 0.3] },
  { f: 168, cInf: 0 },                                                       // aerial
  { f: 310, cInf: 14 },                                                      // seam CU (focus = look)
  { f: 415, cInf: 6 },                                                       // painter
  { f: 450, cInf: 12, focus: () => [0.1, 1.25, -7.1] },                      // kids
  { f: 545, cInf: 0 },                                                       // ship wide
  { f: 625, cInf: 8 },                                                       // tank wall
  { f: 670, cInf: 12, focus: () => [MANAGER[0], 1.85, MANAGER[2]] },         // manager MS
  { f: 785, cInf: 10, focus: () => [WORKER[0], 1.2, WORKER[2]] },            // lunch
  { f: 811, cInf: 14 },                                                      // rivets CU
  { f: 879, cInf: 0 },                                                       // burst wide, street, El
  { f: 1095, cInf: 10, focus: () => [BENCH[0], 1.2, BENCH[2]] },             // grandpa
  { f: 1120, cInf: 15 },                                                     // barrel tap insert
  { f: 1180, cInf: 13, focus: () => [BENCH[0], 1.2, BENCH[2]] },
  { f: 1232, cInf: 7, focus: () => [BENCH[0], 1.2, BENCH[2]] },
  { f: 1298, cInf: 15 },                                                     // night drip insert
  { f: 1368, cInf: 10 },                                                     // kitchen
  { f: 1478, cInf: 6 },
  { f: 1534, cInf: 14 },                                                     // thin steel CU
  { f: 1598, cInf: 7, focus: () => [RESC[0], 1.2, RESC[2]] },               // rescuers
  { f: 1655, cInf: 13 },
  { f: 1705, cInf: 0 },                                                      // quiet wide
  { f: 1756, cInf: 12, focus: () => [MANAGER[0], 1.85, MANAGER[2]] },
  { f: 1815, cInf: 8 },                                                      // court
  { f: 1859, cInf: 10 },
  { f: 1965, cInf: 7, focus: () => [PAINTER_END[0], 1.5, PAINTER_END[2]] },
  { f: 2020, dur: 40, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const SPOTS = { MANAGER, WORKER, RESC, PAINTER_END };
