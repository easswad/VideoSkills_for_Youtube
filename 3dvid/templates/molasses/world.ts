// Boston's North End waterfront, 15 Jan 1919, as one three.js scene: sky, harbour, wharf, Commercial Street, brick
// tenements, the Atlantic Avenue elevated railway (bends after the wave), the molasses tank (grey -> painted brown,
// groaning bulge, bursting into flying plates), the molasses flood as a live heightfield, the tanker ship and its pipe,
// grandpa's bench and barrel, plus two side sets far away (a kitchen at +400 m, a courtroom at -400 m).
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, house, Ray, setSight, quad, Kit } from "./build";
import { beam, rep, ctex, cobbleHD, stoneHD, waterNear, waterFar, cloudHD, facadeHD, planksHD, brick, rng } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset, BROWN_WATER } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import {
  FPS, D0, SHOTS, ShotDef, camAt, V3, smooth, TANK, TANK_R, TANK_H, EL, WHARF_Z, KITCHEN, COURT, BENCH, BARREL,
  floodH, elBend, paintK, bulgeK, clamp01,
} from "./story";

export const loadKit = () => Promise.resolve({} as Kit);

// ---------------- painted textures ----------------
const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
const smokeTex = (key: string, cols: string[]) => ctex(key, 256, 256, (g) => {
  const p = new Pen(g);
  ([[90, 150, 60], [150, 120, 70], [170, 165, 55], [120, 100, 50]] as const).forEach(([x, y, r], i) => p.ell(x, y, r, r * 0.85, cols[i % cols.length], 0));
});
/** riveted steel plates: light neutral (the material colour tints it grey or brown), 2 x 2 plates per tile */
const plateTex = () => ctex("tankPlates", 512, 512, (g, r) => {
  g.fillStyle = "#e6e6e6"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(120,120,130,${0.03 + 0.04 * r()})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + 60 * r(), 10 + 30 * r(), r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(60,55,70,0.75)"; g.lineWidth = 5;
  for (const v of [0, 256, 512]) { g.beginPath(); g.moveTo(0, v); g.lineTo(512, v); g.stroke(); g.beginPath(); g.moveTo(v, 0); g.lineTo(v, 512); g.stroke(); }
  for (const v of [0, 256, 512]) for (let k = 8; k < 512; k += 21) {
    for (const [x, y] of [[k, v + 12], [k, v - 12], [v + 12, k], [v - 12, k]]) {
      g.fillStyle = "rgba(70,65,80,0.8)"; g.beginPath(); g.arc(x, y, 4.2, 0, 7); g.fill();
      g.fillStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.arc(x - 1.2, y - 1.2, 1.6, 0, 7); g.fill();
    }
  }
});
const wallpaperTex = () => ctex("wallpaper", 512, 512, (g) => {
  g.fillStyle = "#e9d7a6"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "rgba(190,120,90,0.35)"; g.fillRect(x, 0, 14, 512); }
  const p = new Pen(g);
  for (let y = 32; y < 512; y += 96) for (let x = 32; x < 512; x += 64) p.ell(x + ((y / 96) % 2) * 32, y, 9, 9, "#c96a5a", 0);
});
const panelTex = () => ctex("courtPanel", 512, 512, (g) => {
  g.fillStyle = "#7a4a2c"; g.fillRect(0, 0, 512, 512);
  for (const [x, y] of [[24, 24], [268, 24], [24, 268], [268, 268]]) {
    g.fillStyle = "#8f5a36"; g.fillRect(x, y, 220, 220);
    g.strokeStyle = "#5a3220"; g.lineWidth = 8; g.strokeRect(x, y, 220, 220);
    g.strokeStyle = "#b07a4e"; g.lineWidth = 3; g.strokeRect(x + 8, y + 8, 204, 204);
  }
});
const floorTex = () => ctex("woodFloor", 512, 512, (g, r) => {
  for (let y = 0; y < 512; y += 32) for (let x = -(y % 64) * 2; x < 512; x += 128) {
    g.fillStyle = ["#b07a4a", "#a8703f", "#ba8452", "#a06a3c"][Math.floor(r() * 4)]; g.fillRect(x, y, 127, 31);
  }
  g.strokeStyle = "rgba(60,30,20,0.5)"; g.lineWidth = 2;
  for (let y = 0; y < 512; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
});
const sealTex = () => ctex("courtSeal", 256, 256, (g) => {
  const p = new Pen(g);
  p.ell(128, 128, 110, 110, "#d9b25a", 8); p.ell(128, 128, 80, 80, "#f0d488", 6);
  p.poly([[128, 70], [150, 120], [128, 186], [106, 120]], "#b8443a", 5);
});

// ---------------- helpers ----------------
const beamBetween = (a: THREE.Vector3, b: THREE.Vector3, th: number, round = false) => {
  const g = round ? new THREE.CylinderGeometry(th / 2, th / 2, a.distanceTo(b), 12) : new THREE.BoxGeometry(th, a.distanceTo(b), th);
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()), V(1, 1, 1));
  return g.applyMatrix4(m);
};
function quadUp(x0: number, x1: number, z0: number, z1: number, u: number, v: number, y = D0) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

/** every lens position of the film looking at its subject (buildings there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

// ---------------- tank plates ----------------
const NA = 24, NR = 3; // plates around x rings
type Plate = { m: THREE.Mesh; c: THREE.Vector3; th: number; k: number; vo: number; vu: number; sp: number; ax: THREE.Vector3 };
const SUN_SHOT: Record<number, { az?: number; el?: number }> = {};

// ---------------- flood grid ----------------
const FX0 = -130, FX1 = 110, FZ0 = WHARF_Z, FZ1 = 7.1, FD = 0.6;
const NXF = Math.round((FX1 - FX0) / FD) + 1, NZF = Math.round((FZ1 - FZ0) / FD) + 1;

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden" | "night", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private plates: Plate[] = [];
  private roof: THREE.Mesh; private tank = new THREE.Group();
  private TU: Record<string, THREE.IUniform>;
  private flood: THREE.Mesh; private floodGeo: THREE.BufferGeometry;
  private elSegs: { g: THREE.Group; x: number }[] = [];
  private lampMat: THREE.MeshLambertMaterial; private winMat: THREE.MeshLambertMaterial;
  private smoke: { m: THREE.Mesh; mat: THREE.MeshLambertMaterial; top: V3; k: number; drift: V3; size: number; op: number }[] = [];
  private stars: THREE.Points;
  private ladder = new THREE.Group();
  private ship = new THREE.Group();
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor() {
    const R = this.root;
    // ---- sky + light ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    // night stars
    const sp: number[] = [], sr = rng(7);
    for (let i = 0; i < 700; i++) { const a = sr() * Math.PI * 2, e = 0.12 + sr() * 1.3; sp.push(Math.cos(a) * Math.cos(e) * 1000, Math.sin(e) * 1000, Math.sin(a) * Math.cos(e) * 1000); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: new THREE.Color(1.6, 1.6, 1.8), size: 2.2, sizeAttenuation: false, fog: false, depthWrite: false }));
    this.stars.frustumCulled = false; this.stars.layers.set(NOINK); this.stars.renderOrder = -0.8;
    R.add(this.stars);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = {
      day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)),
      night: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.night.cloud)),
    };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- static scenery ----
    setSight(sightLines());
    const b = new Batch();
    const M = {
      cobble: lam("cobbleHD", () => ({ map: cobbleHD() })),
      pave: lam("paveHD", () => ({ map: stoneHD("paveHD", ["#c9bfb0", "#bfb4a4", "#d2c9ba", "#b8ad9c"], "#9a8f80") })),
      yard: lam("yard", () => ({ color: "#b7a288" })),
      kerb: lam("kerb", () => ({ map: stoneHD("copeHD", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") })),
      wharf: lam("wharfPl", () => ({ map: planksHD() })),
      wood: lam("wood", () => ({ map: beam() })),
      wall: lam("wharfWall", () => ({ map: stoneHD("wharfHD", ["#9c9488", "#8f877c", "#a69e92", "#878075"], "#6c6559") })),
      iron: twoTone(new THREE.MeshPhongMaterial({ color: "#4a5262", specular: "#8a8a8a", shininess: 50 }), 0.15),
      elIron: twoTone(new THREE.MeshPhongMaterial({ color: "#5b6b5a", specular: "#8a8a8a", shininess: 40 }), 0.15),
      hull: lam("hull", () => ({ color: "#2f3542" })),
      hullRed: lam("hullRed", () => ({ color: "#b8443a" })),
      cabin: lam("cabin", () => ({ color: "#efe6d2" })),
      funnel: lam("funnel", () => ({ color: "#d9a43a" })),
      soot: lam("soot", () => ({ color: "#2a2630" })),
      barrel: lam("barrelWood", () => ({ color: "#9a6238" })),
      hoop: twoTone(new THREE.MeshPhongMaterial({ color: "#4a4a52", specular: "#999999", shininess: 50 }), 0.15),
      brass: twoTone(new THREE.MeshPhongMaterial({ color: "#c99a3a", specular: "#fff0c0", shininess: 70 }), 0.15),
      white: lam("whiteEnamel", () => ({ color: "#f2f0ea" })),
      wallpaper: lam("wallpaper", () => ({ map: rep(wallpaperTex(), 3, 1.5) })),
      floor: lam("woodFloor", () => ({ map: rep(floorTex(), 3, 3) })),
      panel: lam("courtPanel", () => ({ map: rep(panelTex(), 4, 1.5) })),
      dark: lam("darkWood", () => ({ color: "#5a3420" })),
      green: lam("baize", () => ({ color: "#3f6a4a" })),
      pipe: twoTone(new THREE.MeshPhongMaterial({ color: "#6c6a72", specular: "#aaaaaa", shininess: 40 }), 0.15),
    };
    // ground: street (z -5..5), pavement to the house fronts (5..7.2), the yard round the tank, the wharf
    b.add(quadUp(-400, 400, -5, 5, 200, 5), M.cobble);
    b.add(quadUp(-400, 400, 5, 7.2, 200, 1.1, D0 + 0.12), M.pave);
    b.add(boxGeo(V(-400, D0, 4.9), V(400, D0 + 0.12, 5.1)), M.kerb);
    b.add(quadUp(-400, 400, 7.2, 400, 100, 100, D0 + 0.12), M.pave);
    b.add(quadUp(-400, 400, -38, -5, 100, 8), M.yard);
    b.add(quadUp(-400, 400, WHARF_Z, -38, 200, 3, D0 + 0.03), M.wharf);
    // wharf face down to the water, pilings
    b.add(quad(V(400, -2.2, WHARF_Z), V(-400, -2.2, WHARF_Z), V(-400, D0 + 0.03, WHARF_Z), V(400, D0 + 0.03, WHARF_Z), 200, 0.6), M.wall);
    for (let x = -120; x <= 120; x += 4) b.add(new THREE.CylinderGeometry(0.18, 0.18, 2.6, 8).translate(x, -0.9, WHARF_Z - 0.25), M.wood);
    for (let x = -100; x <= 100; x += 11) {
      b.add(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 10).translate(x + 0.5, D0 + 0.28, WHARF_Z + 0.6), M.iron); // bollards
      b.add(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 10).translate(x + 0.5, D0 + 0.55, WHARF_Z + 0.6), M.iron);
    }
    // North End tenements: fronts on the pavement at z = 7.2, facing the harbour (-z), plus back rows up the hill
    const rr = rng(23), pick = <T,>(a: T[]) => a[Math.floor(rr() * a.length) % a.length];
    const brickish = [2, 7, 7, 1, 5, 7, 0, 6];
    for (const [zf, step] of [[7.2, 0.15], [26, 1.5], [44, 3], [62, 4]] as const) {
      let x = -170 + rr() * 4;
      while (x < 170) {
        const w = pick([7, 8, 9]), h = pick([9.8, 11.2, 12.6]) + (zf > 10 ? 1.4 : 0), d = 9;
        house(b, x + w / 2, zf + d / 2, Math.PI, w, d, h, brickish[Math.floor(rr() * 8)], zf > 10 ? D0 + 0.12 + (zf - 7) * 0.12 : D0 + 0.12);
        x += w + step + (rr() < 0.1 ? 3 : 0);
      }
    }
    // Old North Church: white steeple above the roofs (left of frame in the wides)
    const tower = lam("churchBrick", () => ({ map: rep(brick(), 2, 6) })), spireW = lam("spireWhite", () => ({ color: "#f4f1e8" }));
    const cx = -46, cz = 58;
    b.add(boxGeo(V(cx - 3.5, D0, cz - 3.5), V(cx + 3.5, D0 + 26, cz + 3.5), 4), tower);
    b.add(boxGeo(V(cx - 2.6, D0 + 26, cz - 2.6), V(cx + 2.6, D0 + 31, cz + 2.6)), spireW);
    b.add(boxGeo(V(cx - 1.9, D0 + 31, cz - 1.9), V(cx + 1.9, D0 + 35, cz + 1.9)), spireW);
    const spire = new THREE.ConeGeometry(1.8, 13, 8); spire.translate(cx, D0 + 41.5, cz);
    b.add(spire, spireW);
    // harbour sheds left and right of the tank yard + the city paving yard building and firehouse next to it
    const shedWall = lam("shedWall", () => ({ map: facadeHD("shed", 24, 7, { wall: "#b5543c", shutter: "#3b3f52", brick: true }) }));
    const shedRoof = lam("shedRoof", () => ({ color: "#6f7686", side: THREE.DoubleSide }));
    for (const [x0, x1, z0, z1, hgt] of [[-110, -62, -40, -26, 7], [-58, -36, -41, -28, 6], [26, 50, -40, -27, 6.5], [56, 104, -41, -26, 7]] as const) {
      const hx = (x0 + x1) / 2, hz = (z0 + z1) / 2;
      b.add(boxGeo(V(x0, D0, z0), V(x1, D0 + hgt, z1), 0), shedWall);
      b.add(quad(V(x0 - 0.3, D0 + hgt, z1 + 0.3), V(x1 + 0.3, D0 + hgt, z1 + 0.3), V(x1 + 0.3, D0 + hgt + 2.4, hz), V(x0 - 0.3, D0 + hgt + 2.4, hz), 1, 1), shedRoof);
      b.add(quad(V(x1 + 0.3, D0 + hgt, z0 - 0.3), V(x0 - 0.3, D0 + hgt, z0 - 0.3), V(x0 - 0.3, D0 + hgt + 2.4, hz), V(x1 + 0.3, D0 + hgt + 2.4, hz), 1, 1), shedRoof);
      void hx;
    }
    // street lamps along the pavement (lamps glow at night)
    this.lampMat = new THREE.MeshLambertMaterial({ color: "#fff1c4", emissive: new THREE.Color("#ffcf6a"), emissiveIntensity: 0 });
    for (let x = -150; x <= 150; x += 15) {
      b.add(new THREE.CylinderGeometry(0.07, 0.1, 3.6, 8).translate(x, D0 + 0.12 + 1.8, 6.3), M.iron);
      b.add(new THREE.CylinderGeometry(0.26, 0.16, 0.12, 8).translate(x, D0 + 4.38, 6.3), M.iron);
      b.add(new THREE.ConeGeometry(0.3, 0.3, 8).translate(x, D0 + 4.5 + 0.12, 6.3), M.iron);
      b.add(new THREE.BoxGeometry(0.34, 0.5, 0.34).translate(x, D0 + 4.1, 6.3), this.lampMat);
    }
    // lit windows at night: a few warm squares on the house fronts (only emissive at night)
    this.winMat = new THREE.MeshLambertMaterial({ color: "#3a2a20", emissive: new THREE.Color("#ffb860"), emissiveIntensity: 0 });
    for (let i = 0; i < 70; i++) {
      const x = -140 + rr() * 280, fl = Math.floor(rr() * 3);
      b.add(quad(V(x + 0.45, 1.3 + fl * 2.8, 7.17), V(x - 0.45, 1.3 + fl * 2.8, 7.17), V(x - 0.45, 2.55 + fl * 2.8, 7.17), V(x + 0.45, 2.55 + fl * 2.8, 7.17)), this.winMat);
    }
    // grandpa's bench and barrel (harbour side of the street)
    const [bx, , bz] = BENCH;
    b.add(boxGeo(V(bx - 0.9, 0.42, bz - 0.22), V(bx + 0.9, 0.48, bz + 0.22)), M.wood);
    b.add(boxGeo(V(bx - 0.9, 0.5, bz - 0.26), V(bx + 0.9, 0.95, bz - 0.2)), M.wood);
    for (const sx of [-0.8, 0.8]) b.add(boxGeo(V(bx + sx - 0.05, 0, bz - 0.22), V(bx + sx + 0.05, 0.42, bz + 0.2)), M.iron);
    const [rx, , rz] = BARREL;
    const barrel = new THREE.CylinderGeometry(0.36, 0.33, 0.95, 18); barrel.translate(rx, 0.475, rz);
    b.add(barrel, M.barrel);
    for (const y of [0.18, 0.77]) b.add(new THREE.TorusGeometry(0.355, 0.022, 6, 24).rotateX(Math.PI / 2).translate(rx, y, rz), M.hoop);
    b.add(beamBetween(V(rx, 0.72, rz + 0.3), V(rx, 0.72, rz + 0.48), 0.06, true), M.brass); // the tap
    b.add(beamBetween(V(rx, 0.72, rz + 0.48), V(rx, 0.64, rz + 0.48), 0.05, true), M.brass);
    b.add(boxGeo(V(rx - 0.03, 0.75, rz + 0.36), V(rx + 0.03, 0.86, rz + 0.4)), M.brass);
    // painter's ladder against the tank (shot 3 only) and the worker's crate (shot 7)
    const lb = new Batch();
    for (const sx of [0.15, 0.95]) lb.add(beamBetween(V(sx, 0, -7.3), V(sx, 5.2, -8.62), 0.07), M.wood);
    for (let k = 1; k < 13; k++) { const u = k / 13; lb.add(beamBetween(V(0.15, 5.2 * u, -7.3 - 1.32 * u), V(0.95, 5.2 * u, -7.3 - 1.32 * u), 0.05, true), M.wood); }
    lb.build(this.ladder); R.add(this.ladder);
    b.add(boxGeo(V(2.1, 0, -6.95), V(2.75, 0.42, -6.45)), M.wood);
    // ship at the wharf: hull, red boot top, cabin, funnel, masts; and its pipe to the tank (gone by summer, shot 19)
    const SX = 4, SZ = -52.5;
    const outerB = b;
    { const b = new Batch();
    b.add(boxGeo(V(SX - 22, -2.2, SZ - 4.2), V(SX + 18, 2.4, SZ + 4.2)), M.hull);
    b.add(boxGeo(V(SX - 22.05, -2.2, SZ - 4.25), V(SX + 18.05, -1.1, SZ + 4.25)), M.hullRed);
    const bow = new THREE.BufferGeometry();
    bow.setAttribute("position", new THREE.Float32BufferAttribute([
      SX + 18, -2.2, SZ - 4.2, SX + 18, 2.4, SZ - 4.2, SX + 25, 2.6, SZ, SX + 18, -2.2, SZ - 4.2, SX + 25, 2.6, SZ, SX + 22, -2.2, SZ,
      SX + 18, 2.4, SZ + 4.2, SX + 18, -2.2, SZ + 4.2, SX + 25, 2.6, SZ, SX + 18, -2.2, SZ + 4.2, SX + 22, -2.2, SZ, SX + 25, 2.6, SZ,
      SX + 18, 2.4, SZ - 4.2, SX + 18, 2.4, SZ + 4.2, SX + 25, 2.6, SZ], 3));
    bow.computeVertexNormals(); b.add(bow, M.hull);
    b.add(boxGeo(V(SX - 8, 2.4, SZ - 2.8), V(SX + 2, 5.2, SZ + 2.8)), M.cabin);
    b.add(boxGeo(V(SX - 8.3, 5.2, SZ - 3.1), V(SX + 2.3, 5.45, SZ + 3.1)), M.wood);
    b.add(new THREE.CylinderGeometry(1.1, 1.2, 6.5, 16).translate(SX - 3, 8.6, SZ), M.funnel);
    b.add(new THREE.CylinderGeometry(1.13, 1.13, 1.1, 16).translate(SX - 3, 11.5, SZ), M.soot);
    for (const mx of [SX - 16, SX + 12]) b.add(new THREE.CylinderGeometry(0.14, 0.2, 13, 8).translate(mx, 2.4 + 6.5, SZ), M.wood);
    const pipePts = [V(SX + 8, 2.6, SZ + 3.6), V(SX + 8, 2.0, WHARF_Z - 0.6), V(SX + 8, 0.5, WHARF_Z + 1), V(6, 0.5, -34.5), V(6, 14.4, -34.0)];
    for (let i = 0; i < pipePts.length - 1; i++) b.add(beamBetween(pipePts[i], pipePts[i + 1], 0.42, true), M.pipe);
    b.build(this.ship); R.add(this.ship); }
    void outerB;
    // ---- kitchen set (+400 m) ----
    const [kx, , kz] = KITCHEN;
    b.add(quadUp(kx - 4, kx + 4, kz - 1.7, kz + 6, 4, 4, 0), M.floor);
    b.add(quad(V(kx - 4, 0, kz - 1.7), V(kx + 4, 0, kz - 1.7), V(kx + 4, 3, kz - 1.7), V(kx - 4, 3, kz - 1.7), 1, 1), M.wallpaper);
    b.add(quad(V(kx - 4, 0, kz + 6), V(kx - 4, 0, kz - 1.7), V(kx - 4, 3, kz - 1.7), V(kx - 4, 3, kz + 6), 1, 1), M.wallpaper);
    b.add(quad(V(kx + 4, 0, kz - 1.7), V(kx + 4, 0, kz + 6), V(kx + 4, 3, kz + 6), V(kx + 4, 3, kz - 1.7), 1, 1), M.wallpaper);
    b.add(boxGeo(V(kx - 4, 0, kz - 1.68), V(kx + 4, 0.9, kz - 1.62)), M.wood); // wainscot
    b.add(boxGeo(V(kx - 0.45, 0.82, kz - 0.5), V(kx + 1.95, 0.88, kz + 0.45)), M.wood); // table top
    for (const [lx, lz] of [[-0.35, -0.4], [1.85, -0.4], [-0.35, 0.35], [1.85, 0.35]]) b.add(boxGeo(V(kx + lx - 0.04, 0, kz + lz - 0.04), V(kx + lx + 0.04, 0.82, kz + lz + 0.04)), M.wood);
    // fridge (rounded white box, chrome handle) and a window with a sunny view
    b.add(boxGeo(V(kx - 2.4, 0, kz - 1.6), V(kx - 1.3, 1.85, kz - 0.9)), M.white);
    b.add(boxGeo(V(kx - 2.42, 1.15, kz - 0.9), V(kx - 1.28, 1.17, kz - 0.89)), M.hoop);
    b.add(boxGeo(V(kx - 1.45, 0.5, kz - 0.9), V(kx - 1.4, 1.05, kz - 0.84)), M.hoop);
    b.add(boxGeo(V(kx + 2.2, 1.2, kz - 1.66), V(kx + 3.5, 2.4, kz - 1.6)), lam("kWindow", () => ({ color: "#9cc9ef" })));
    // ---- courtroom set (-400 m) ----
    const [ox, , oz] = COURT;
    b.add(quadUp(ox - 7, ox + 7, oz - 3.6, oz + 8, 7, 6, 0), M.floor);
    b.add(quad(V(ox - 7, 0, oz - 3.6), V(ox + 7, 0, oz - 3.6), V(ox + 7, 4.5, oz - 3.6), V(ox - 7, 4.5, oz - 3.6), 1, 1), M.panel);
    b.add(quad(V(ox - 7, 0, oz + 8), V(ox - 7, 0, oz - 3.6), V(ox - 7, 4.5, oz - 3.6), V(ox - 7, 4.5, oz + 8), 1, 1), M.panel);
    b.add(quad(V(ox + 7, 0, oz - 3.6), V(ox + 7, 0, oz + 8), V(ox + 7, 4.5, oz + 8), V(ox + 7, 4.5, oz - 3.6), 1, 1), M.panel);
    b.add(boxGeo(V(ox - 1.4, 0, oz - 3.5), V(ox + 1.8, 0.55, oz - 2.0)), M.dark);           // judge's platform
    b.add(boxGeo(V(ox - 1.5, 0, oz - 2.2), V(ox + 1.9, 1.55, oz - 1.6)), M.dark);           // bench front
    b.add(boxGeo(V(ox - 1.6, 1.55, oz - 2.3), V(ox + 2.0, 1.62, oz - 1.5)), M.wood);        // bench top
    b.add(quad(V(ox - 0.5, 2.9, oz - 3.58), V(ox + 0.9, 2.9, oz - 3.58), V(ox + 0.9, 4.3, oz - 3.58), V(ox - 0.5, 4.3, oz - 3.58)),
      lam("courtSeal", () => ({ map: sealTex(), alphaTest: 0.5 })));
    b.add(boxGeo(V(ox + 2.4, 0, oz - 0.6), V(ox + 4.4, 1.05, oz - 0.45)), M.dark);           // dock rail front
    b.add(boxGeo(V(ox - 4.2, 0.86, oz + 0.4), V(ox - 1.8, 0.92, oz + 1.5)), M.dark);         // engineer's table
    for (const [lx, lz] of [[-4.1, 0.5], [-1.9, 0.5], [-4.1, 1.4], [-1.9, 1.4]]) b.add(boxGeo(V(ox + lx - 0.04, 0, oz + lz - 0.04), V(ox + lx + 0.04, 0.86, oz + lz + 0.04)), M.dark);
    b.add(boxGeo(V(ox - 4.25, 0.92, oz + 0.38), V(ox - 1.75, 0.925, oz + 1.52)), M.green);
    b.build(R);
    setSight([]);

    // ---- harbour water ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "harbour1";
    const wm = new THREE.Mesh(quadUp(-1100, 1100, -1100, WHARF_Z, 1, 1, -1.3), waterM);
    wm.receiveShadow = true;
    R.add(wm);

    // ---- the elevated railway: static far parts + 9 m segments near the tank that bend ----
    const elStatic = new Batch();
    const elPiece = (bb: Batch, x0: number, x1: number, ox = 0) => {
      const y = EL.y;
      for (const z of [EL.z0, EL.z1]) {
        bb.add(boxGeo(V(x0 - ox, y - 0.95, z - 0.14), V(x1 - ox, y - 0.05, z + 0.14)), M.elIron);    // girders
        bb.add(boxGeo(V(x0 - ox, y - 1.0, z - 0.3), V(x1 - ox, y - 0.92, z + 0.3)), M.elIron);       // bottom flange
      }
      for (let x = x0; x < x1; x += 0.75) bb.add(boxGeo(V(x - ox, y - 0.05, EL.z0 - 0.3), V(x + 0.22 - ox, y + 0.1, EL.z1 + 0.3)), M.wood); // ties
      for (const z of [EL.z0 + 1.1, EL.z0 + 2.6, EL.z1 - 1.0]) bb.add(boxGeo(V(x0 - ox, y + 0.1, z - 0.05), V(x1 - ox, y + 0.25, z + 0.05)), M.iron); // rails
      for (let x = x0; x < x1; x += 1.5) { // lattice diagonals on the street-facing girder
        bb.add(beamBetween(V(x - ox, y - 0.92, EL.z1 + 0.16), V(x + 0.75 - ox, y - 0.1, EL.z1 + 0.16), 0.06), M.elIron);
        bb.add(beamBetween(V(x + 0.75 - ox, y - 0.1, EL.z1 + 0.16), V(x + 1.5 - ox, y - 0.92, EL.z1 + 0.16), 0.06), M.elIron);
      }
      bb.add(boxGeo(V(x0 - ox - 0.18, y - 1.25, EL.z0 - 0.4), V(x0 - ox + 0.18, y - 0.95, EL.z1 + 0.4)), M.elIron); // cross beam
      for (const z of EL.colZ) {
        bb.add(boxGeo(V(x0 - ox - 0.17, D0, z - 0.17), V(x0 - ox + 0.17, y - 1.2, z + 0.17)), M.elIron); // column
        bb.add(boxGeo(V(x0 - ox - 0.3, D0, z - 0.3), V(x0 - ox + 0.3, D0 + 0.35, z + 0.3)), M.kerb);   // footing
        bb.add(beamBetween(V(x0 - ox, y - 2.2, z), V(x0 - ox + 0.9, y - 1.2, z), 0.12), M.elIron);     // knee braces
        bb.add(beamBetween(V(x0 - ox, y - 2.2, z), V(x0 - ox - 0.9, y - 1.2, z), 0.12), M.elIron);
      }
    };
    for (let x = -297; x < 297; x += 9) if (x < -27 || x >= 27) elPiece(elStatic, x, x + 9);
    elStatic.build(R);
    for (let x = -27; x < 27; x += 9) {
      const g = new THREE.Group(), bb = new Batch(), xc = x + 4.5;
      elPiece(bb, x, x + 9, xc);
      bb.build(g);
      g.traverse((o) => { o.matrixAutoUpdate = true; });
      g.position.set(xc, 0, 0);
      this.elSegs.push({ g, x: xc }); R.add(g);
    }

    // ---- the tank: 24 x 3 riveted plates (each its own mesh, so they can fly), a cone roof ----
    this.TU = { uGrey: { value: new THREE.Color("#9aa1ab") }, uBrown: { value: new THREE.Color("#7a4524") }, uPC: { value: new THREE.Vector3(0.9, 3.4, -8.6) }, uPR: { value: 0 } };
    const tankM = twoTone(new THREE.MeshPhongMaterial({ map: plateTex(), specular: "#444444", shininess: 18, side: THREE.DoubleSide }), 0.15);
    const base = tankM.onBeforeCompile;
    tankM.onBeforeCompile = (sh, r) => {
      base.call(tankM, sh, r);
      Object.assign(sh.uniforms, this.TU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vTW;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvTW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vTW; uniform vec3 uGrey, uBrown, uPC; uniform float uPR;")
        .replace("#include <map_fragment>", `#include <map_fragment>
          float pk = 1.0 - smoothstep(uPR - 0.35, uPR, distance(vTW, uPC) + 0.25 * sin(vTW.y * 9.0 + vTW.x * 3.0));
          diffuseColor.rgb *= mix(uGrey, uBrown, pk);`);
    };
    tankM.customProgramCacheKey = () => "tankPaint2";
    const ph = TANK_H / NR, dth = (Math.PI * 2) / NA;
    for (let k = 0; k < NR; k++) for (let i = 0; i < NA; i++) {
      const th0 = i * dth, g = new THREE.CylinderGeometry(TANK_R, TANK_R, ph, 4, 1, true, th0, dth);
      const thc = th0 + dth / 2, c = V(TANK[0] + Math.sin(thc) * TANK_R, D0 + ph * (k + 0.5), TANK[2] + Math.cos(thc) * TANK_R);
      g.translate(TANK[0] - c.x, D0 + ph * (k + 0.5) - c.y, TANK[2] - c.z);
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let j = 0; j < uv.count; j++) uv.setXY(j, uv.getX(j) * 1.8, uv.getY(j) * 1.6);
      const m = new THREE.Mesh(g, tankM);
      m.position.copy(c); m.castShadow = true; m.receiveShadow = true;
      const n = i + k * NA;
      this.plates.push({ m, c, th: thc, k, vo: k === 0 ? 2 + 2 * hh(n) : 7 + 7 * hh(n), vu: k === 0 ? 1 + hh(n, 2) : 3 + 6 * hh(n, 2) + 2 * k, sp: (hh(n, 3) - 0.5) * 8,
        ax: V(Math.cos(thc), 0, -Math.sin(thc)) });
      this.tank.add(m);
    }
    const roofG = new THREE.ConeGeometry(TANK_R + 0.25, 2.2, 48, 1, true); roofG.translate(0, 1.1, 0);
    this.roof = new THREE.Mesh(roofG, tankM);
    this.roof.castShadow = true; this.roof.receiveShadow = true;
    this.tank.add(this.roof);
    const ringM = lam("tankBase", () => ({ map: stoneHD("copeHD") }));
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(TANK_R + 0.6, TANK_R + 0.8, 0.5, 48).translate(TANK[0], 0.2, TANK[2]), ringM);
    ring.receiveShadow = true; R.add(ring);
    R.add(this.tank);

    // ---- the flood: a live heightfield of glossy molasses ----
    this.floodGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(NXF * NZF * 3), idx: number[] = [];
    for (let j = 0; j < NZF; j++) for (let i = 0; i < NXF; i++) pos.set([FX0 + i * FD, -1, FZ0 + j * FD], (j * NXF + i) * 3);
    for (let j = 0; j < NZF - 1; j++) for (let i = 0; i < NXF - 1; i++) { const a = j * NXF + i, c = a + 1, d = a + NXF, e = d + 1; idx.push(a, d, c, c, d, e); }
    this.floodGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.floodGeo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(NXF * NZF * 3), 3));
    this.floodGeo.setIndex(idx);
    const floodM = twoTone(new THREE.MeshPhongMaterial({ color: "#4f240f", specular: "#ffcf90", shininess: 60 }), 0.3);
    this.flood = new THREE.Mesh(this.floodGeo, floodM);
    this.flood.castShadow = true; this.flood.receiveShadow = true; this.flood.frustumCulled = false;
    R.add(this.flood);

    // ---- smoke from the ship funnel and two chimneys ----
    const dark = smokeTex("smokeDark", ["#5a5560", "#6c6772", "#4f4a56"]), pale = smokeTex("smokePale", ["#c8c6cf", "#dedce4", "#b8b6c0"]);
    for (const [top, n, tex, drift, size, op] of [
      [[SX - 3, 12.2, SZ], 7, dark, [-14, 9, 4], 5, 0.85], [[-60, 22, 30], 5, pale, [-12, 10, 2], 4, 0.7], [[70, 24, 48], 5, pale, [-12, 10, 2], 4, 0.7],
    ] as const)
      for (let k = 0; k < n; k++) {
        const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        m.layers.set(NOINK);
        this.smoke.push({ m, mat, top: top as unknown as V3, k: k / n, drift: drift as unknown as V3, size, op }); R.add(m);
      }
    for (const [x, z] of [[-60, 30], [70, 48]]) {
      const cb = new Batch(); cb.add(new THREE.CylinderGeometry(0.6, 0.8, 22, 12).translate(x, 11, z), lam("chimney", () => ({ map: rep(brick(), 1, 6) }))); cb.build(R);
    }
  }

  /** camera-relative sun, frozen per shot */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? SUN_SHOT[id]?.az ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? SUN_SHOT[id]?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    const ft = s.ft ? s.ft(t) : s.tank === "gone" ? 30 : -1;
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun, clouds, stars ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    this.stars.visible = s.light === "night"; this.stars.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    const night = s.light === "night";
    this.lampMat.emissiveIntensity = night ? 3.2 : 0;
    this.winMat.emissiveIntensity = night ? 1.6 : 0;
    // ---- harbour colours ----
    const W = this.WU, wc = s.water === "brown" ? BROWN_WATER : K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    // ---- tank, El, flood ----
    this.poseTank(id, f, ft);
    this.ladder.visible = id === 3;
    this.ship.visible = id !== 19;
    for (const sg of this.elSegs) {
      const bd = elBend(sg.x, ft < 0 ? 0 : ft);
      sg.g.position.set(sg.x, -bd.sag, bd.push); sg.g.rotation.set(bd.tilt, 0, 0.02 * Math.sign(sg.x) * bd.sag);
    }
    this.poseFlood(s.water === "brown" ? -1 : ft, !!s.settled, t);
    for (const sm of this.smoke) {
      const u = (t * 0.11 + sm.k) % 1, sz = sm.size * (0.6 + u * 2.2);
      sm.m.position.set(sm.top[0] + sm.drift[0] * u, sm.top[1] + sm.drift[1] * u + u * u * 3, sm.top[2] + sm.drift[2] * u);
      sm.m.scale.set(sz, sz, 1); sm.m.quaternion.copy(cam.quaternion);
      sm.mat.opacity = sm.op * (1 - u) ** 1.2 * Math.min(1, u * 8);
    }
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, f, { pos: cam.position, right, sun: sunDir }, ft);
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const fe = this.fx(fi++);
      fe.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      fe.use(!!p.soft);
      fe.mesh.visible = true;
      fe.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) fe.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else if (p.yaw !== undefined) fe.mesh.rotation.set(0, p.yaw, p.rot ?? 0);
      else { fe.mesh.quaternion.copy(cam.quaternion); fe.mesh.rotateZ(p.rot ?? 0); }
      fe.mesh.scale.set(p.w, p.h, 1);
      fused.push(fe);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const fe of fused) fe.bind();
    return focus;
  }

  private poseTank(id: number, f: number, ft: number) {
    const s = SHOTS[id - 1];
    this.TU.uPR.value = s.tank === "grey" ? 0 : 0.2 + 46 * paintK(id, f) ** 2;
    const bk = bulgeK(id, f), burst = ft > 0 && s.tank !== "grey" && s.tank !== "paint" && (s.tank === "burst" || s.tank === "gone" || ft > 0);
    const wob = burst ? 0 : bk;
    this.tank.visible = true;
    for (const p of this.plates) {
      const m = p.m;
      if (!burst) {
        // groaning: the lower rings swell, plates shiver
        const sw = wob * (p.k === 0 ? 0.32 : p.k === 1 ? 0.22 : 0.08) * (1 + 0.15 * Math.sin(f * 0.9 + p.th * 7));
        m.position.set(p.c.x + Math.sin(p.th) * sw, p.c.y, p.c.z + Math.cos(p.th) * sw);
        m.quaternion.identity();
        continue;
      }
      const T = Math.min(ft, 8);
      const out = V(Math.sin(p.th), 0, Math.cos(p.th));
      if (p.k === 0) { // the bottom ring peels outward about its foot
        const a = Math.min(1.35, T * (2.2 + p.vo * 0.3));
        const half = TANK_H / NR / 2;
        m.position.set(p.c.x + out.x * half * Math.sin(a), half * Math.cos(a) + 0.05, p.c.z + out.z * half * Math.sin(a));
        m.quaternion.setFromAxisAngle(p.ax, -a);
        continue;
      }
      const g = 9.8, y0 = p.c.y, tl = (p.vu + Math.sqrt(p.vu * p.vu + 2 * g * (y0 - 0.4))) / g, tt = Math.min(T, tl);
      m.position.set(p.c.x + out.x * p.vo * tt, y0 + p.vu * tt - 0.5 * g * tt * tt, p.c.z + out.z * p.vo * tt);
      const land = smooth((T - tl) / 0.3);
      const spin = p.sp * tt;
      m.quaternion.setFromAxisAngle(p.ax, -(spin * (1 - land) + 1.45 * land * Math.sign(p.sp || 1)));
      if (T >= tl) m.position.y = 0.35;
    }
    if (!burst) { this.roof.position.set(TANK[0], TANK_H + wob * 0.08 * Math.sin(f * 0.7), TANK[2]); this.roof.rotation.set(0, 0, 0); }
    else {
      const T = Math.min(ft, 8), vu = 14, tl = (vu + Math.sqrt(vu * vu + 2 * 9.8 * TANK_H)) / 9.8, tt = Math.min(T, tl);
      this.roof.position.set(TANK[0] - 3 * tt, TANK_H + vu * tt - 4.9 * tt * tt, TANK[2] - 4 * tt);
      this.roof.rotation.set(0.6 * tt, 0, 0.3 * tt);
      if (T >= tl) { this.roof.position.y = 0.4; this.roof.rotation.set(1.2, 0, 0.5); }
    }
  }

  private poseFlood(ft: number, settled: boolean, t: number) {
    const on = settled || ft > 0;
    this.flood.visible = on;
    if (!on) return;
    const pos = this.floodGeo.attributes.position.array as Float32Array;
    const moundR = TANK_R + SPEED_M * ft * 0.6, moundH = settled ? 0 : 13 * Math.exp(-3 * ft);
    for (let j = 0; j < NZF; j++) for (let i = 0; i < NXF; i++) {
      const x = FX0 + i * FD, z = FZ0 + j * FD, o = (j * NXF + i) * 3;
      let h = floodH(x, z, settled ? 0 : ft, settled);
      if (moundH > 0.05) {
        const r = Math.hypot(x - TANK[0], z - TANK[2]), mk = 1 - (r / moundR) ** 2;
        if (mk > 0) h = Math.max(h, moundH * mk);
      }
      pos[o + 1] = h < 0 ? -0.6 : h + 0.03 + (settled ? 0.01 * Math.sin(x * 0.8 + t * 0.4) : 0);
    }
    this.floodGeo.attributes.position.needsUpdate = true;
    this.floodGeo.computeVertexNormals();
  }
}
const SPEED_M = 15.6;
void clamp01;

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.12 * wTime, 0.05 * wTime);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;
