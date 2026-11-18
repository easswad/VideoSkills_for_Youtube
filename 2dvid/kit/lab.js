// REA short: a dark hacker lab with one desk lamp. Desk + monitor (live canvas screen), a floating "app box" made of
// three slabs (UI / CODE / BINARY) that can split apart, a scrolling binary wall, a neon REA sign, a GitHub star,
// an AI chip with a cable, five orbiting target objects, and a permission shield. Shots drive the refs directly.
import * as THREE from 'three';
import { lightCone } from './sets3d.js';

const std = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
const glow = (hex, k = 3) => new THREE.LineBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });
function canvasTex(w, h, paint) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); paint && paint(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { c, g, t }; }
const R = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function paintUI(g, w, h) { g.fillStyle = '#0D1320'; g.fillRect(0, 0, w, h); g.fillStyle = '#E4322B'; g.fillRect(0, 0, w, 34); g.fillStyle = '#3FD0FF';
  for (let i = 0; i < 4; i++) { g.globalAlpha = 0.9 - i * 0.15; g.beginPath(); g.roundRect(20, 56 + i * 46, w - 40 - (i % 2) * 60, 28, 8); g.fill(); } g.globalAlpha = 1; g.fillStyle = '#F4F1E8'; g.beginPath(); g.arc(w - 50, h - 46, 22, 0, 7); g.fill(); }
function paintCode(g, w, h) { g.fillStyle = '#07120E'; g.fillRect(0, 0, w, h); const cols = ['#3FD0FF', '#7CF29A', '#E4322B', '#F4D35E', '#C9D1D9'];
  for (let i = 0; i < 14; i++) { let x = 14 + (R(i) > 0.6 ? 26 : 0); for (let k = 0; k < 4; k++) { const ww = 20 + R(i * 7 + k) * 60; g.fillStyle = cols[(i + k) % 5]; g.fillRect(x, 12 + i * 17.5, ww, 9); x += ww + 10; if (x > w - 30) break; } } }
function paintBin(g, w, h, col = '#36E07A', size = 22) { g.fillStyle = '#020604'; g.fillRect(0, 0, w, h); g.font = `700 ${size}px FreeMono`; g.textBaseline = 'top';
  for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size * 0.62) { const r = R(x * 3.1 + y * 7.7); g.fillStyle = col; g.globalAlpha = 0.35 + r * 0.65; g.fillText(r > 0.5 ? '1' : '0', x, y); } g.globalAlpha = 1; }

export function hackerLab() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#04060A'); scene.fog = new THREE.Fog('#04060A', 6, 20);
  scene.add(box(20, 0.1, 20, std('#0C0F15', 0.5, { metalness: 0.3 }), 0, -0.05, 0));
  // scrolling binary wall
  const bw = canvasTex(512, 512, (g, w, h) => paintBin(g, w, h, '#1F8FB0', 26)); bw.t.wrapS = bw.t.wrapT = THREE.RepeatWrapping; bw.t.repeat.set(5, 3.4);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshBasicMaterial({ map: bw.t, color: new THREE.Color(0.55, 0.55, 0.55) })); wall.position.set(0, 3.5, -4); scene.add(wall);
  // neon REA sign on the wall
  const sign = canvasTex(1024, 512, (g) => { g.clearRect(0, 0, 1024, 512); g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#FF2A20'; g.shadowBlur = 40; g.fillStyle = '#FF5A50'; g.font = '900 300px Inter'; g.fillText('REA', 512, 210); g.shadowBlur = 20; g.font = '700 58px FreeMono'; g.fillStyle = '#FFD9D4'; g.fillText('REVERSE ENGINEER ANYTHING', 512, 430); });
  const signM = new THREE.MeshBasicMaterial({ map: sign.t, transparent: true, toneMapped: false, depthWrite: false }); const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), signM); signMesh.position.set(0, 3.0, -3.9); scene.add(signMesh);
  const backing = box(3.6, 1.9, 0.05, std('#07090D', 0.9), 0, 3.0, -3.96); scene.add(backing);
  // desk, chair, keyboard
  const deskM = std('#1A1F2A', 0.6, { metalness: 0.2 });
  scene.add(box(2.4, 0.07, 1.0, deskM, 0, 0.75, 0)); for (const sx of [-1.12, 1.12]) for (const sz of [-0.42, 0.42]) scene.add(box(0.06, 0.75, 0.06, deskM, sx, 0.375, sz));
  scene.add(box(0.5, 0.06, 0.5, std('#151922'), 0, 0.6, 1.0), box(0.5, 0.6, 0.06, std('#151922'), 0, 0.92, 1.25), box(0.06, 0.6, 0.06, std('#151922'), 0, 0.3, 1.0));
  const kb = box(0.62, 0.025, 0.2, std('#0E1118', 0.5, { emissive: '#3FD0FF', emissiveIntensity: 0.25 }), 0, 0.8, 0.3); scene.add(kb);
  // monitor with a live screen
  const screen = canvasTex(640, 384); const mon = new THREE.Group(); mon.position.set(0, 1.18, -0.22); scene.add(mon);
  mon.add(box(1.16, 0.7, 0.05, std('#0A0C10', 0.4), 0, 0, -0.03)); const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.64), new THREE.MeshBasicMaterial({ map: screen.t, toneMapped: false })); scr.position.z = 0.0; mon.add(scr);
  scene.add(box(0.08, 0.36, 0.06, deskM, 0, 0.94, -0.26), box(0.36, 0.02, 0.22, deskM, 0, 0.79, -0.26));
  // desk lamp (the one light)
  const lampPos = new THREE.Vector3(-0.85, 2.3, 0.35);
  const spot = new THREE.SpotLight('#F6DDAE', 16, 9, 0.75, 0.55, 1.3); spot.position.copy(lampPos); spot.target.position.set(-0.1, 0.75, 0.15); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0004; scene.add(spot, spot.target);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.18, 32, 1, true), std('#1C2230', 0.5, { side: THREE.DoubleSide })); shade.position.copy(lampPos).add(new THREE.Vector3(0, 0.05, 0)); scene.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFF0CF' })); bulb.position.copy(lampPos); scene.add(bulb);
  const cone = lightCone(1.6, 0.75, '#F1D9A6', 0.09); cone.position.copy(lampPos); scene.add(cone);
  scene.add(box(0.03, 1.55, 0.03, deskM, -0.85, 1.52, 0.35));
  const monL = new THREE.PointLight('#3FB8FF', 2.5, 3, 1.5); monL.position.set(0, 1.2, 0.3); scene.add(monL);
  scene.add(new THREE.HemisphereLight('#2A3A60', '#05070C', 0.45));

  // the app box: three slabs + glowing edges, floating above the monitor
  const app = new THREE.Group(); app.position.set(0, 2.05, -0.25); scene.add(app);
  const S = 0.6, layers = [paintUI, paintCode, (g, w, h) => paintBin(g, w, h)].map((p, i) => {
    const tx = canvasTex(256, 256, p); const m = new THREE.MeshStandardMaterial({ color: '#05070A', emissive: '#ffffff', emissiveMap: tx.t, emissiveIntensity: 0.8, roughness: 0.5 });
    const g = new THREE.Group(); const sl = new THREE.Mesh(new THREE.BoxGeometry(S, S / 3 - 0.01, S), m); g.add(sl);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(sl.geometry), glow('#E4322B', 3.2))); app.add(g); return g; });
  const appL = new THREE.PointLight('#FF4A3A', 3, 3, 1.6); app.add(appL);
  const scanM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FF3A2A').multiplyScalar(2.5), transparent: true, opacity: 0.55, side: THREE.DoubleSide, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), scanM); scan.rotation.x = -Math.PI / 2; scan.visible = false; app.add(scan);
  // GitHub star
  const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.42 : 1; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const starG = new THREE.ExtrudeGeometry(st, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 }); starG.center();
  const starM = new THREE.MeshStandardMaterial({ color: '#7A5A10', emissive: '#FFC233', emissiveIntensity: 0.75, roughness: 0.35, metalness: 0.4 });
  const star = new THREE.Mesh(starG, starM); star.visible = false; scene.add(star);
  const mini = []; for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(starG, starM); m.visible = false; m.scale.setScalar(0.05 + R(i) * 0.05); scene.add(m); mini.push(m); }
  // AI chip + cable
  const chip = new THREE.Group(); chip.position.set(0.85, 0.82, 0.12); scene.add(chip);
  const chipTop = canvasTex(256, 256, (g) => { g.fillStyle = '#0B0F18'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#3FD0FF'; g.lineWidth = 6; g.strokeRect(30, 30, 196, 196); g.fillStyle = '#3FD0FF'; g.font = '900 96px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AI', 128, 132); });
  const chipM = [std('#151A24'), std('#151A24'), new THREE.MeshStandardMaterial({ color: '#080A10', emissive: '#ffffff', emissiveMap: chipTop.t, emissiveIntensity: 1.2 }), std('#151A24'), std('#151A24'), std('#151A24')];
  chip.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.34), chipM)); for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { chip.add(box(0.025, 0.012, 0.06, std('#B8A06A', 0.3, { metalness: 0.9 }), -0.13 + i * 0.052, -0.012, s * 0.19)); chip.add(box(0.06, 0.012, 0.025, std('#B8A06A', 0.3, { metalness: 0.9 }), s * 0.19, -0.012, -0.13 + i * 0.052)); }
  const chipL = new THREE.PointLight('#3FD0FF', 0, 2, 1.5); chipL.position.set(0, 0.2, 0); chip.add(chipL);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.3, 1.85, -0.2), new THREE.Vector3(0.75, 1.6, 0.0), new THREE.Vector3(0.95, 1.1, 0.15), new THREE.Vector3(0.85, 0.86, 0.12)]);
  const cableG = new THREE.TubeGeometry(curve, 80, 0.016, 8); const cable = new THREE.Mesh(cableG, new THREE.MeshBasicMaterial({ color: new THREE.Color('#3FD0FF').multiplyScalar(2.2), toneMapped: false })); cable.visible = false; scene.add(cable);
  const cableIdx = cableG.index.count;
  // five target objects (desktop app, android, website, game, AI model)
  const tg = [];
  { const g = new THREE.Group(); g.add(box(0.36, 0.24, 0.03, std('#10141C', 0.4, { emissive: '#3FD0FF', emissiveIntensity: 0.9 }), 0, 0.04, 0), box(0.04, 0.1, 0.03, std('#2A3040'), 0, -0.12, 0), box(0.16, 0.02, 0.08, std('#2A3040'), 0, -0.17, 0)); tg.push(g); }
  { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.025), std('#10141C', 0.4)); g.add(b); g.add(box(0.135, 0.25, 0.005, std('#0A0F0A', 0.4, { emissive: '#3DDC84', emissiveIntensity: 1.3 }), 0, 0, 0.014)); tg.push(g); }
  { const g = new THREE.Group(); g.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(0.16, 12, 8)), glow('#7FB2FF', 2.4))); g.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), std('#0A1428', 0.6))); tg.push(g); }
  { const g = new THREE.Group(); const pad = std('#2A1240', 0.4, { emissive: '#B04CFF', emissiveIntensity: 0.9 }); g.add(box(0.3, 0.12, 0.08, pad, 0, 0, 0)); for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.08, 20), pad); c.rotation.x = Math.PI / 2; c.position.set(s * 0.15, -0.03, 0); g.add(c); } tg.push(g); }
  { const g = new THREE.Group(); g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.16, 1)), glow('#FFC233', 2.6))); g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), std('#2A1E05', 0.5, { emissive: '#FF9A1F', emissiveIntensity: 0.6 }))); tg.push(g); }
  tg.forEach((g) => { g.visible = false; scene.add(g); });
  // permission shield
  const sh = new THREE.Shape(); sh.moveTo(0, 0.55); sh.quadraticCurveTo(0.25, 0.45, 0.45, 0.48); sh.quadraticCurveTo(0.48, -0.1, 0, -0.6); sh.quadraticCurveTo(-0.48, -0.1, -0.45, 0.48); sh.quadraticCurveTo(-0.25, 0.45, 0, 0.55);
  const shieldG = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }); shieldG.center();
  const shield = new THREE.Mesh(shieldG, new THREE.MeshStandardMaterial({ color: '#05301A', emissive: '#2BD47D', emissiveIntensity: 0.45, roughness: 0.35, metalness: 0.3 })); shield.visible = false; scene.add(shield);
  const tick = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.17, 0.0, 0), new THREE.Vector3(-0.05, -0.13, 0), new THREE.Vector3(0.2, 0.17, 0)], false, 'catmullrom', 0.0), 24, 0.035, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#E8FFF2').multiplyScalar(2), toneMapped: false })); tick.position.z = 0.08; shield.add(tick);

  return {
    scene, app, layers, scan, star, mini, chip, chipL, cable, tg, shield, signM, mon, appL,
    /** screen painter: fn(g, w, h) */
    paintScreen(fn) { fn(screen.g, 640, 384); screen.t.needsUpdate = true; },
    cableProgress(p) { cable.visible = p > 0; cableG.setDrawRange(0, Math.floor(cableIdx * p / 6) * 6); },
    reset(t) {
      bw.t.offset.y = -t * 0.06; signM.color.setScalar(0.12); app.visible = true; app.rotation.set(0, t * 0.35, 0); app.position.set(0, 2.05 + Math.sin(t * 1.6) * 0.03, -0.25); app.scale.setScalar(1);
      layers.forEach((g, i) => { g.position.set(0, (1 - i) * S / 3, 0); g.rotation.set(0, 0, 0); }); scan.visible = false; star.visible = false; mini.forEach((m) => (m.visible = false));
      cable.visible = false; chipL.intensity = 0; tg.forEach((g) => (g.visible = false)); shield.visible = false; appL.intensity = 3;
    },
    split(k) { layers.forEach((g, i) => (g.position.y = (1 - i) * (S / 3 + k * 0.32))); },
  };
}
