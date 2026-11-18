// OpenClaw short: a realistic evening studio desk. Real images from the OpenClaw repo are used as textures
// (phone chat screenshot, laptop screens, wall display banner, channel + model icons). The mascot is built in 3D.
import * as THREE from 'three';

const L = new THREE.TextureLoader();
export async function loadTex(names) {
  const out = {}; await Promise.all(names.map(async (n) => { const t = await L.loadAsync('img/' + n); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; out[n] = t; })); return out;
}
const phys = (o) => new THREE.MeshPhysicalMaterial(o);
const rounded = (w, h, r) => { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
const slab = (w, h, d, r, m, bevel = 0.006) => { const g = new THREE.ExtrudeGeometry(rounded(w, h, r), { depth: d, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10 }); g.translate(0, 0, -d / 2); const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = true; return o; };
const screenMat = (tex, k = 0.78) => new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(k, k, k), toneMapped: false });
function cover(tex, aspect) { const ia = tex.image.width / tex.image.height; tex.repeat.set(1, 1); tex.offset.set(0, 0); if (ia > aspect) { tex.repeat.x = aspect / ia; tex.offset.x = (1 - tex.repeat.x) / 2; } else { tex.repeat.y = ia / aspect; tex.offset.y = 1 - tex.repeat.y; } return tex; }

/** the OpenClaw mascot in 3D: round red body, teal eyes, two claws, antennae. Feet at y = 0, ~0.62 tall */
export function mascot() {
  const g = new THREE.Group(), red = phys({ color: '#E2483D', roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25, sheen: 0.3, sheenColor: new THREE.Color('#ff9a8a') });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 64, 48), red); body.scale.set(1, 1.05, 0.95); body.position.y = 0.3; g.add(body);
  const eyeM = phys({ color: '#050608', roughness: 0.15, clearcoat: 1 }), pupM = new THREE.MeshStandardMaterial({ color: '#0A3B38', emissive: '#2EE6D6', emissiveIntensity: 1.6 });
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 32, 24), eyeM); e.position.set(s * 0.072, 0.35, 0.165); g.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.021, 24, 16), pupM); p.position.set(s * 0.072, 0.352, 0.205); g.add(p); }
  const arms = [-1, 1].map((s) => { const piv = new THREE.Group(); piv.position.set(s * 0.18, 0.3, 0.02); const a = new THREE.Mesh(new THREE.SphereGeometry(0.085, 40, 30), red); a.scale.set(1.15, 0.85, 0.6); a.position.set(s * 0.07, -0.02, 0); piv.add(a); g.add(piv); return piv; });
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 20), red); l.position.set(s * 0.065, 0.06, 0); l.castShadow = true; g.add(l); }
  for (const s of [-1, 1]) { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.05, 0.48, 0.04), new THREE.Vector3(s * 0.1, 0.57, 0.07), new THREE.Vector3(s * 0.19, 0.6, 0.1)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 20, 0.011, 8), red)); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, arms, wave(t, k = 1) { arms[1].rotation.z = Math.sin(t * 8) * 0.35 * k + 0.25 * k; arms[0].rotation.z = -Math.sin(t * 3) * 0.08; g.position.y += 0; } };
}

export function studio(E, T) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0C0E13'); scene.environment = E.envMap; scene.environmentIntensity = 0.25; scene.fog = new THREE.Fog('#0C0E13', 7, 16);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), phys({ color: '#14161B', roughness: 0.45 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ color: '#1C1F27', roughness: 0.9 })); wall.position.set(0, 3, -1.4); wall.receiveShadow = true; scene.add(wall);
  // wall display with the real OpenClaw banner
  const disp = new THREE.Group(); disp.position.set(0, 2.05, -1.33); scene.add(disp);
  disp.add(slab(2.7, 0.82, 0.05, 0.03, phys({ color: '#08090C', roughness: 0.3, metalness: 0.4 })));
  const bannerM = screenMat(cover(T['openclaw-hero-dark.png'].clone(), 2.6 / 0.74), 0.7); const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.74), bannerM); banner.position.z = 0.032; disp.add(banner);
  // desk (walnut) and legs
  const wood = phys({ color: '#4A2E1C', roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 1.0), wood); top.position.set(0, 0.725, 0); top.castShadow = top.receiveShadow = true; scene.add(top);
  for (const sx of [-1.1, 1.1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.8), phys({ color: '#1A1B20', roughness: 0.4, metalness: 0.6 })); l.position.set(sx, 0.35, 0); l.castShadow = true; scene.add(l); }
  // laptop: base + hinged lid with a live screen material
  const alu = phys({ color: '#B9BDC6', roughness: 0.32, metalness: 0.85 });
  const laptop = new THREE.Group(); laptop.position.set(0.25, 0.75, -0.05); scene.add(laptop);
  const base = slab(0.9, 0.6, 0.018, 0.03, alu, 0.004); base.rotation.x = -Math.PI / 2; base.position.y = 0.012; laptop.add(base);
  const kb = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.26), phys({ color: '#101114', roughness: 0.6 })); kb.rotation.x = -Math.PI / 2; kb.position.set(0, 0.0255, -0.06); laptop.add(kb);
  const lid = new THREE.Group(); lid.position.set(0, 0.02, -0.3); laptop.add(lid);
  const shell = slab(0.9, 0.58, 0.01, 0.03, alu, 0.003); shell.position.set(0, 0.29, -0.006); lid.add(shell);
  const bez = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.56), new THREE.MeshStandardMaterial({ color: '#050506', roughness: 0.2 })); bez.position.set(0, 0.29, 0.011); lid.add(bez);
  const lapScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.525), screenMat(cover(T['main-chat.png'], 0.84 / 0.525), 0.8)); lapScreen.position.set(0, 0.295, 0.012); lid.add(lapScreen);
  lid.rotation.x = -0.28;
  // phone with the real WhatsApp chat screenshot
  const phone = new THREE.Group(); scene.add(phone);
  phone.add(slab(0.36, 0.76, 0.03, 0.05, phys({ color: '#1A1C22', roughness: 0.25, metalness: 0.8, clearcoat: 1 }), 0.008));
  const ps = new THREE.Mesh(new THREE.PlaneGeometry(0.335, 0.728), screenMat(cover(T['whatsapp-openclaw.jpg'], 0.335 / 0.728))); ps.position.z = 0.024; phone.add(ps);
  // channel + model tiles (real icons on glossy rounded tiles)
  const tileM = phys({ color: '#F2F3F5', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }), darkTileM = phys({ color: '#16181E', roughness: 0.25, clearcoat: 1 });
  const tile = (name, dark = false) => { const g = new THREE.Group(); g.add(slab(0.24, 0.24, 0.035, 0.055, dark ? darkTileM : tileM, 0.01)); const ic = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), new THREE.MeshBasicMaterial({ map: T[name], transparent: true, toneMapped: false })); ic.position.z = 0.03; g.add(ic); g.traverse((o) => o.isMesh && (o.castShadow = true)); g.visible = false; scene.add(g); return g; };
  const chans = ['whatsapp', 'telegram', 'slack', 'discord', 'imessage', 'msteams', 'signal'].map((n) => tile('icon-' + n + '.png'));
  const models = [tile('icon-anthropic.png'), tile('icon-codex.png')];
  // "local model" tile: a chip
  const chip = new THREE.Group(); chip.add(slab(0.24, 0.24, 0.035, 0.03, phys({ color: '#20242C', roughness: 0.3, metalness: 0.6 }), 0.006));
  const cc = document.createElement('canvas'); cc.width = cc.height = 256; const g2 = cc.getContext('2d'); g2.fillStyle = '#2EE6D6'; g2.font = '900 74px Inter'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText('LOCAL', 128, 128); g2.strokeStyle = '#2EE6D6'; g2.lineWidth = 8; g2.strokeRect(24, 24, 208, 208);
  const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace; const cpl = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: ct, transparent: true, toneMapped: false })); cpl.position.z = 0.03; chip.add(cpl); chip.visible = false; scene.add(chip); models.push(chip);
  // padlock (gold) and shield (steel + green)
  const gold = phys({ color: '#D9A94A', roughness: 0.22, metalness: 1 });
  const lock = new THREE.Group(); const lb = slab(0.3, 0.24, 0.12, 0.04, gold, 0.012); lock.add(lb); const sh = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 20, 48, Math.PI), phys({ color: '#C9CDD4', roughness: 0.2, metalness: 1 })); sh.position.y = 0.12; lock.add(sh);
  const kh = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 24), new THREE.MeshStandardMaterial({ color: '#2A1E08' })); kh.rotation.x = Math.PI / 2; kh.position.set(0, 0, 0.07); lock.add(kh); lock.visible = false; scene.add(lock);
  const ss = new THREE.Shape(); ss.moveTo(0, 0.55); ss.quadraticCurveTo(0.25, 0.45, 0.45, 0.48); ss.quadraticCurveTo(0.48, -0.1, 0, -0.6); ss.quadraticCurveTo(-0.48, -0.1, -0.45, 0.48); ss.quadraticCurveTo(-0.25, 0.45, 0, 0.55);
  const sg = new THREE.ExtrudeGeometry(ss, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 }); sg.center();
  const shield = new THREE.Mesh(sg, phys({ color: '#2E8F5B', roughness: 0.25, metalness: 0.6, clearcoat: 1 })); shield.castShadow = true; shield.visible = false; scene.add(shield);
  // cloud (soft spheres)
  const cloud = new THREE.Group(); const cm = phys({ color: '#E9EDF5', roughness: 0.9 }); [[0, 0, 0.2], [0.2, -0.04, 0.15], [-0.2, -0.05, 0.15], [0.08, 0.1, 0.15], [-0.1, 0.07, 0.13]].forEach(([x, y, r]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), cm); s.position.set(x, y, 0); cloud.add(s); }); cloud.visible = false; scene.add(cloud);
  // mascot
  const M = mascot(); scene.add(M.group);
  // lights: warm key, cool rim, desk lamp practical, soft fill
  const key = new THREE.SpotLight('#FFD9B0', 16, 12, 0.6, 0.6, 1.4); key.position.set(2.2, 3.6, 2.6); key.target.position.set(0, 0.8, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#9EC3FF', 1.4); rim.position.set(-3, 3, -2); scene.add(rim);
  const wallWash = new THREE.PointLight('#FF6A50', 3, 4, 1.6); wallWash.position.set(0, 2.0, -0.9); scene.add(wallWash);
  scene.add(new THREE.HemisphereLight('#B9C6E0', '#1A1410', 0.35));
  const lampL = new THREE.PointLight('#FFC88A', 2.2, 3, 1.8); lampL.position.set(-0.95, 1.35, 0.1); scene.add(lampL);
  const lamp = new THREE.Group(); lamp.position.set(-0.95, 0.75, -0.2); scene.add(lamp);
  const dark = phys({ color: '#1C1D22', roughness: 0.35, metalness: 0.7 }); const lb2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 32), dark); lamp.add(lb2); const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 12), dark); arm.position.y = 0.3; lamp.add(arm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.16, 32, 1, true), phys({ color: '#1C1D22', roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide })); shade.position.set(0.05, 0.62, 0.1); shade.rotation.z = -0.4; lamp.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFE3B5').multiplyScalar(2.5), toneMapped: false })); bulb.position.set(0.06, 0.57, 0.11); lamp.add(bulb);

  return {
    scene, phone, laptop, lid, lapScreen, banner, chans, models, lock, shield, cloud, M, disp,
    setLaptop(tex, k = 0.55) { lapScreen.material = screenMat(cover(tex, 0.84 / 0.525), k); },
    reset(t) {
      phone.visible = false; [...chans, ...models].forEach((o) => (o.visible = false)); lock.visible = shield.visible = cloud.visible = false;
      M.group.visible = true; M.group.position.set(-0.5, 0.75, 0.15); M.group.rotation.set(0, 0.35, 0); M.group.scale.setScalar(1); M.arms[0].rotation.set(0, 0, 0); M.arms[1].rotation.set(0, 0, 0);
      M.group.position.y += Math.abs(Math.sin(t * 2.2)) * 0.015; lid.rotation.x = -0.28; laptop.visible = true;
    },
  };
}
