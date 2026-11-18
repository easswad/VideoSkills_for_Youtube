// The cast of "Slower Than Molasses in January" as lit flat cards in the 3D world (same machinery as the bridge short:
// canvas pool, cardShade actors, unlit effect cards, contact blobs, blinks). stage(id, f, cam, ft) lists every
// character and effect for shot `id` at frame f; ft = seconds since the burst (wave), < 0 before it.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxCreak, fxShadow, fxContact, fxDrip, fxSnail, fxHoney, fxBomb, fxBlueprint, fxWisp, fxSparkle, fxRivet, fxStrands,
  folk1919, KIDS1919, MANAGER, PAINTER, GRANDPA, SAILOR, FIREMAN, JUDGE, ENGINEER, Outfit, Expr, FrontOpts, SideOpts, Pose,
} from "./toon";
import {
  FPS, D0, SHOTS, V3, smooth, clamp01, TANK, BENCH, BARREL, KITCHEN, COURT, SPOTS, RIVET_F, BURST_F, runX, frontX, floodH,
} from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    } else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale?: number; mirror?: boolean; yaw?: number; roll?: number; size?: [number, number, number] };
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean; yaw?: number };
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun: THREE.Vector3 };
export type Stage = { places: Place[]; fx: FxPlace[] };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const tmp = new THREE.Vector3();
let SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
let LNAME: "day" | "golden" | "night" = "day";
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57 && c > -0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- blinks ----------------
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, i: number, swaps: number[] = []) => {
  for (const fs of swaps) { const k = f - (fs - 2) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13));
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2 * scale, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return { key, x, y, z, scale, mirror, draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)), size: [w, h, k] };
};
const front = { side: false, mirror: false };

// ---------------- contact shadows ----------------
const CONTACT: Record<"day" | "golden" | "night", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33], night: [0.25, 0.27, 0.42] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h;
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c, w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc, w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- shorthands ----------------
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => folk1919(v));
const T = (f: number) => f / FPS;
type Opt = { pose?: Pose; pk?: number; mode?: FrontOpts["mode"]; phase?: number; lift?: number; look?: number; facing?: -1 | 0 | 1; tilt?: number; prop?: FrontOpts["prop"]; scale?: number; noBlob?: boolean; swaps?: number[] };
const put = (out: Stage, cam: CamInfo, f: number, who: Who, x: number, y: number, z: number, expr: Expr, o: Opt = {}) => {
  const blink = expr === "whistle" ? 0 : lidAt(f, who.i, o.swaps);
  const fo: FrontOpts = { mode: o.mode ?? "stand", expr, blink, pose: o.pose, pk: o.pk, phase: o.phase, lift: o.lift, look: o.look, facing: o.facing, tilt: o.tilt, prop: o.prop };
  out.places.push(person(cam, who, x, y, z, front, fo, {}, o.scale ?? 1));
  if (!o.noBlob) blob(out, x, y, z, o.scale ?? 1);
};
const runner = (out: Stage, cam: CamInfo, f: number, who: Who, x: number, z: number, expr: Expr, sc = 1) => {
  const ph = q((T(f) * 1.7 + hh(who.i, 4)) % 1, 60);
  const view = viewOf(cam, x, z, -1, 0);
  const fo: FrontOpts = { mode: "march", phase: ph, lift: 95, expr, pose: "run", blink: lidAt(f, who.i) };
  const so: SideOpts = { mode: "march", phase: ph, expr, stomp: 0.6, stride: view.fs, blink: lidAt(f, who.i) };
  out.places.push(person(cam, who, x, D0, z, view.side ? view : front, fo, so, sc));
  blob(out, x, D0, z, sc);
};
const drip = (out: Stage, key: string, x: number, y: number, z: number, s: number, w = 0.12, yaw?: number) =>
  out.fx.push({ key: `drip${key}${q(s, 30)}`, cw: 200, ch: 400, draw: (p) => fxDrip(p, q(s, 30)), x, y: y - w, z, w, h: w * 2, yaw });
const creaks = (out: Stage, f: number, pts: V3[], size = 0.9) =>
  pts.forEach(([x, y, z], i) => {
    const u = q(((f / FPS) * 1.3 + i * 0.37) % 1, 30);
    out.fx.push({ key: `creak${u}`, cw: 300, ch: 300, draw: (p) => fxCreak(p, u), x, y, z, w: size, h: size, rot: i * 0.6 - 0.6 });
  });
const burstAt = (out: Stage, f: number, f0: number, n: number, x: number, y: number, z: number, s: number, col = "#fff3b0") => {
  if (f < f0 || f >= f0 + n) return;
  const u = q((f - f0) / n, 30);
  out.fx.push({ key: `burst${col}${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, col), x, y, z, w: s, h: s });
};
const wisps = (out: Stage, f: number, x: number, y: number, z: number, n: number, size: number, col: string, rate = 0.5) => {
  for (let i = 0; i < n; i++) {
    const u = q(((f / FPS) * rate + i / n) % 1, 30);
    out.fx.push({ key: `wisp${col}${u}`, cw: 300, ch: 300, draw: (p) => fxWisp(p, u, col), x: x + (hh(i, 3) - 0.5) * size, y: y + u * size * 0.6, z, w: size, h: size, soft: true });
  }
};
/** the floor under someone: molasses where the flood is, else the street */
const groundY = (x: number, z: number, ft: number, settled: boolean) => Math.max(D0, floodH(x, z, ft, settled) - 0.35);

// ---------------- the shots ----------------
export const stage = (id: number, f: number, cam: CamInfo, ft: number): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], t = T(f);
  LNAME = s.light; SUN = cam.sun.clone().normalize();
  const { MANAGER: MG, WORKER: WK, RESC, PAINTER_END: PE } = SPOTS;
  switch (id) {
    case 1: { // the hook: people run from a brown wave down Commercial Street
      const x = runX(t);
      runner(out, cam, f, { i: 1, o: FOLK[0], okey: "f0" }, x, 0.2, "shock");
      runner(out, cam, f, { i: 2, o: FOLK[1], okey: "f1" }, x + 1.3, 1.9, "shock");
      runner(out, cam, f, { i: 3, o: KIDS1919[0], okey: "k0" }, x - 0.9, 1.3, "shock", 0.72);
      runner(out, cam, f, { i: 4, o: FOLK[2], okey: "f2" }, x + 2.6, -0.9, "nervous");
      break;
    }
    case 2: { // the harbour on a mild January day: a few people about
      for (let i = 0; i < 8; i++) {
        const x = -30 + i * 8.5 + 0.4 * Math.sin(t + i), z = i % 2 ? 5.9 : -3.5 + hh(i) * 2;
        put(out, cam, f, { i: 10 + i, o: FOLK[i % 6], okey: `f${i % 6}` }, x + (i % 2 ? 1 : -1) * 0.8 * (t - 5.6), D0 + (i % 2 ? 0.12 : 0), z, "smile",
          { mode: "stroll", phase: q((t * 0.7 + hh(i)) % 1, 60) });
      }
      break;
    }
    case 3: { // it leaks: drips down the seams; the painter's fix
      for (let i = 0; i < 5; i++) {
        const u = ((t * 0.5 + hh(i, 2)) % 1);
        drip(out, `w${i}`, -0.9 + i * 0.5, 3.9 - i * 0.25, -8.47, 0.15 + 0.85 * u, 0.12, 0);
      }
      if (f >= 415) {
        const pk = q(0.5 + 0.5 * Math.sin(t * 9), 20);
        put(out, cam, f, { i: 30, o: PAINTER, okey: "painter" }, 0.55, 2.18, -7.75, f < 440 ? "grin" : "whistle", { pose: "brush", pk, noBlob: true, facing: 1 });
      }
      break;
    }
    case 4: { // kids with pails catch the drips
      const xs = [-0.7, 0.15, 1.0], poses: Pose[] = ["pailUp", "pail", "pailUp"], ex: Expr[] = ["laugh", "grin", "smile"];
      xs.forEach((x, i) => {
        put(out, cam, f, { i: 40 + i, o: KIDS1919[i], okey: `k${i}` }, x, D0, -7.25 - 0.1 * i, f > 520 && i === 1 ? "laugh" : ex[i], { pose: poses[i], pk: 1, scale: 0.74 });
        const u = ((t * 0.9 + hh(i, 5)) % 1);
        drip(out, `k${i}`, x + 0.02, 2.4 - u * 0.9, -8.0, 0.3 + 0.4 * u, 0.1);
      });
      break;
    }
    case 5: { // the ship tops it up; the steel groans
      wisps(out, f, 6, 14.6, -34, 3, 2.2, "rgba(255,255,255,0.7)", 0.35);
      if (f >= 622) creaks(out, f, [[9.5, 5.5, -11], [7.0, 7.8, -9.6], [10.8, 3.5, -12.5]], 1.4);
      break;
    }
    case 6: { // the manager: "The groaning? Totally fine."
      const pose: Pose | undefined = f >= 750 ? "thumb" : f >= 728 ? "ear" : undefined;
      put(out, cam, f, { i: 50, o: MANAGER, okey: "mgr" }, MG[0], D0, MG[2], f >= 750 ? "grin" : f >= 728 ? "nervous" : "smile", { pose, pk: 1, swaps: [728, 750] });
      if (f >= 700) creaks(out, f, [[MG[0] - 1.6, 2.9, -9.5], [MG[0] + 1.4, 3.6, -9.2]], 0.9);
      break;
    }
    case 7: { // lunch -> rivets machine-gun out -> the burst
      const shocked = f >= 813;
      put(out, cam, f, { i: 60, o: FOLK[3], okey: "f3" }, WK[0], D0 + 0.42, WK[2], shocked ? "shock" : "grin",
        { mode: "sit", pose: "sandwich", pk: 1, swaps: [813], noBlob: false });
      RIVET_F.forEach((fr, i) => {
        if (f < fr || f >= fr + 7) return;
        const u = q((f - fr) / 7, 30);
        out.fx.push({ key: `rivet${u}`, cw: 300, ch: 300, draw: (p) => fxRivet(p, u), x: -1.6 + (i % 8) * 0.42, y: 1.9 + Math.floor(i / 8) * 1.1 + 0.1 * Math.sin(i), z: -7.9, w: 0.5, h: 0.5 });
      });
      burstAt(out, f, BURST_F, 10, TANK[0], 8, TANK[2] + 14, 16);
      break;
    }
    case 8: { // the wave: people flee ahead of the front
      for (let i = 0; i < 5; i++) {
        const z = -2.8 + i * 1.5, fx = frontX(Math.max(0.3, ft), z), x = fx - 4 - (i % 3) * 2.3 - hh(i) * 2;
        runner(out, cam, f, { i: 70 + i, o: i === 2 ? KIDS1919[1] : FOLK[(i + 1) % 6], okey: i === 2 ? "k1" : `f${(i + 1) % 6}` }, x, z, i % 2 ? "shock" : "nervous", i === 2 ? 0.72 : 1);
      }
      burstAt(out, f, 1052, 9, 3, 5.2, -0.2, 6, "#ffe9b0");
      break;
    }
    case 9: case 10: case 11: { // grandpa on his bench; the barrel tap and the snail
      const ex: Expr = id === 9 ? "smile_closed" : id === 10 ? "grin" : f < 1262 ? "smile" : "shock";
      const pose: Pose = id === 10 ? "thumb" : "cup";
      put(out, cam, f, { i: 90, o: GRANDPA, okey: "gpa" }, BENCH[0] - 0.35, 0.48, BENCH[2] + 0.02, ex, { mode: "sit", pose, pk: 1, swaps: [1182, 1262] });
      const [rx, , rz] = BARREL;
      const u = clamp01((f - 1100) / 260);
      drip(out, "tap", rx, 0.64, rz + 0.48, 0.05 + 0.25 * u, 0.06);
      // the snail crawls past the tap on the barrel front, beating the drip
      const sx = rx - 0.2 + 0.0016 * (f - 1095);
      out.fx.push({ key: `snail${q((t * 2) % 1, 12)}`, cw: 400, ch: 260, draw: (p) => fxSnail(p, q((t * 2) % 1, 12)), x: sx, y: 0.56, z: rz + 0.37, w: 0.16, h: 0.104, yaw: 0 });
      if (id === 11 && ft > 0.9) for (let i = 0; i < 3; i++) runner(out, cam, f, { i: 95 + i, o: FOLK[i + 2], okey: `f${i + 2}` }, BENCH[0] + 3 - i * 1.6 - 3.4 * (t - 41), 1.5 + i, "shock");
      break;
    }
    case 12: { // night: the cold drip barely moves; frost
      const [rx, , rz] = BARREL;
      drip(out, "night", rx, 0.64, rz + 0.48, 0.28 + 0.03 * Math.sin(t * 0.8), 0.06);
      for (let i = 0; i < 6; i++) {
        const u = q(((t * 0.7 + i / 6) % 1), 20);
        out.fx.push({ key: `spark${u}`, cw: 200, ch: 200, draw: (p) => fxSparkle(p, u), x: rx - 0.3 + hh(i) * 0.6, y: 0.5 + hh(i, 2) * 0.45, z: rz + 0.42, w: 0.05, h: 0.05 });
      }
      break;
    }
    case 13: { // kitchen: honey from the fridge vs warm honey
      const [kx, , kz] = KITCHEN;
      const warm = f >= 1415 ? 1 : 0;
      out.fx.push({ key: `honey${warm}${q(t % 4, 15)}`, cw: 600, ch: 900, draw: (p) => fxHoney(p, warm, q(t % 4, 15)), x: kx + 0.8, y: 0.88 + 0.42, z: kz + 0.05, w: 0.56, h: 0.84, yaw: 0 });
      put(out, cam, f, { i: 100, o: KIDS1919[2], okey: "k2" }, kx - 0.15, 0, kz + 0.85, warm ? "laugh" : "nervous", { scale: 0.74, swaps: [1415] });
      break;
    }
    case 14: { // a warm load into thin steel
      wisps(out, f, 6, 14.6, -34, 3, 2.6, "rgba(255,255,255,0.75)", 0.45);
      creaks(out, f, f < 1534 ? [[9.5, 5.5, -11], [7.0, 7.8, -9.6]] : [[-0.8, 4.0, -8.4], [0.9, 4.6, -8.4]], f < 1534 ? 1.4 : 0.7);
      break;
    }
    case 15: { // night: rescuers stuck in molasses
      const xs = [-1.3, 0, 1.25], o = [SAILOR, FIREMAN, SAILOR], ok = ["sailor", "fireman", "sailor"];
      xs.forEach((dx, i) => {
        const x = RESC[0] + dx, z = RESC[2] + (i === 1 ? -0.4 : 0), y = 0.28;
        const tug = q(0.5 + 0.5 * Math.sin(t * 3.2 + i * 1.7), 12);
        put(out, cam, f, { i: 110 + i, o: o[i], okey: ok[i] }, x, y, z, i === 1 ? "pained" : tug > 0.6 ? "nervous" : "pained",
          { pose: i === 1 ? "lantern" : "pull", pk: tug, tilt: (tug - 0.5) * 6, noBlob: true });
        out.fx.push({ key: `strands${q(tug, 12)}`, cw: 400, ch: 400, draw: (p) => fxStrands(p, q(tug, 12)), x, y: 0.55 + 0.12, z: z + 0.08, w: 0.42, h: 0.42 });
      });
      break;
    }
    case 16: { // the quiet street at night: lanterns searching
      for (let i = 0; i < 3; i++) {
        const x = -14 + i * 5.5, z = -1 + i;
        put(out, cam, f, { i: 120 + i, o: i === 1 ? FIREMAN : SAILOR, okey: i === 1 ? "fireman" : "sailor" }, x, 0.28, z, "pained", { pose: "lantern", pk: 0.5, noBlob: true });
      }
      break;
    }
    case 17: { // the company blamed anarchists
      const pop = clamp01((f - 1784) / 6);
      put(out, cam, f, { i: 50, o: MANAGER, okey: "mgr" }, MG[0], groundY(MG[0], MG[2], 0, true) - 0.15, MG[2], f >= 1784 ? "stern" : "nervous", { pose: f >= 1784 ? "point" : "shrug", pk: 1, swaps: [1784], noBlob: true });
      if (pop > 0) out.fx.push({ key: `bomb${q(pop, 12)}`, cw: 600, ch: 520, draw: (p) => fxBomb(p, q(pop, 12)), x: MG[0] + 0.85, y: 2.75, z: MG[2], w: 1.0, h: 0.87 });
      break;
    }
    case 18: { // the court; the engineer never checked the steel: one signature
      const [ox, , oz] = COURT;
      // gavel: wind up 4 f, hold, strike on "company" (1838)
      const n = f - 1838, gk = n >= -11 && n < -7 ? 1 - smooth((n + 11) / 4) : n >= -7 && n < 0 ? 0 : 1;
      put(out, cam, f, { i: 130, o: JUDGE, okey: "judge" }, ox + 0.2, 0.75, oz - 2.9, f >= 1838 ? "stern" : "neutral", { prop: ["hammer", q(gk, 30)], noBlob: true, facing: 1, scale: 1.1 });
      burstAt(out, f, 1838, 5, ox + 0.85, 1.75, oz - 1.9, 0.8);
      put(out, cam, f, { i: 50, o: MANAGER, okey: "mgr" }, ox + 3.4, 0, oz - 1.1, f >= 1838 ? "nervous" : "smile", { noBlob: false });
      put(out, cam, f, { i: 131, o: ENGINEER, okey: "eng" }, ox - 3.05, 0, oz + 0.05, f >= 1936 ? "grin" : "smile_closed", { pose: "pen", pk: 1 });
      const k = clamp01((f - 1915) / 31);
      out.fx.push({ key: `bp${q(k, 30)}`, cw: 600, ch: 440, draw: (p) => fxBlueprint(p, q(k, 30)), x: ox - 3.0, y: 0.93, z: oz + 0.95, w: 0.82, h: 0.6, flat: true });
      break;
    }
    case 19: { // summer: the brown harbour, the painter's callback
      put(out, cam, f, { i: 30, o: PAINTER, okey: "painter" }, PE[0], D0 + 0.03, PE[2], f > 2040 ? "laugh" : "smile", { pose: "brush", pk: q(0.5 + 0.5 * Math.sin(t * 5), 12), facing: -1 });
      break;
    }
  }
  return out;
};
export { FPS };
