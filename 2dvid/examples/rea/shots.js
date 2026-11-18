// REA: THIS FREE TOOL CAN REVERSE ENGINEER ANY APP : shot list (Night File 3D, hacker lab).
// One desk lamp, a glowing red hacker at the desk, a floating app box that splits into UI / CODE / BINARY.
import * as THREE from 'three';
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob, rr } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { camera } from './core/engine.js';
import { Human } from './core/human.js';
import * as SETS from './core/sets3d.js';
import { hackerLab } from './core/lab.js';
import * as K from './core/kit.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z), lerpV = (a, b, k) => a.clone().lerp(b, k);
const NIGHT = { exposure: 1.2, bloom: 0.7, bloomThreshold: 0.6, vignette: 0.6, grain: 0.05, warm: 0 };
const CY = '#3FD0FF', RED = K.P.red, CREAM = K.P.cream, GOLD = '#FFC233', GREEN = '#2BD47D';

// ── 2D helpers ──
function pill(x, y, text, col, p = 1, size = 54, align = 'center') {
  if (p <= 0) return; ctx.save(); ctx.font = `900 ${size}px Inter`; const w = ctx.measureText(text).width + size * 1.1, h = size * 1.55;
  const s = eob(clamp(p)); ctx.translate(x, y); ctx.scale(s, s); const ox = align === 'left' ? 0 : align === 'right' ? -w : -w / 2;
  ctx.shadowColor = col; ctx.shadowBlur = 30; rr(ox, -h / 2, w, h, h / 2); ctx.fillStyle = 'rgba(6,8,12,0.88)'; ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 6; ctx.strokeStyle = col; ctx.stroke();
  ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, ox + w / 2, 3); ctx.restore();
}
function stamp(x, y, text, p, rot = -0.12, col = RED, size = 92) {
  if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const s = lerp(2.2, 1, eo(clamp(p))); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 3);
  ctx.font = `700 ${size}px FreeMono`; const w = ctx.measureText(text).width + 70, h = size * 1.35; rr(-w / 2, -h / 2, w, h, 10); ctx.fillStyle = 'rgba(6,8,12,0.6)'; ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = col; ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 6); ctx.restore();
}
function tag(x, y, text, col = CREAM, size = 40, align = 'center', a = 1) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = clamp(a); ctx.font = `700 ${size}px FreeMono`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 14; ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.restore();
}
function source(a = 1) { tag(540, 120, 'SOURCE: GITHUB.COM/MORLUTO/REA', 'rgba(234,227,210,0.85)', 30, 'center', a); }
function question(x, y, p) { if (p <= 0) return; ctx.save(); ctx.translate(x, y); const s = eob(clamp(p)); ctx.scale(s, s); ctx.font = '900 220px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = RED; ctx.shadowBlur = 50; ctx.fillStyle = '#FF5A50'; ctx.fillText('?', 0, 0); ctx.restore(); }
function evidence(x, y, p) {
  if (p <= 0) return; ctx.save(); ctx.translate(x, lerp(y + 500, y, eob(clamp(p)))); ctx.rotate(-0.05);
  rr(-300, -250, 220, 60, 10); ctx.fillStyle = '#A58548'; ctx.fill(); rr(-320, -220, 640, 440, 14); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 40; ctx.fillStyle = K.P.manila; ctx.fill(); ctx.shadowBlur = 0;
  rr(-280, -180, 400, 72, 4); ctx.fillStyle = K.P.paper; ctx.fill(); ctx.font = '700 46px FreeMono'; ctx.fillStyle = K.P.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('EVIDENCE', -260, -142);
  ctx.font = '700 34px FreeMono'; [['fn  playVideo()', '#1d4a8a'], ['@ 0x004A3F20', K.P.redDeep], ['calls api/stream', '#1d4a8a'], ['proof attached', '#245f2e']].forEach(([s, c], i) => { ctx.fillStyle = c; ctx.fillText(s, -270, -55 + i * 62); });
  ctx.restore();
}
function bubble(x, y, p) {
  if (p <= 0) return; ctx.save(); ctx.translate(x, y); const s = eob(clamp(p)); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 40; rr(-420, -170, 840, 300, 40); ctx.fillStyle = '#F4F1E8'; ctx.fill(); ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.moveTo(-260, 125); ctx.lineTo(-300, 220); ctx.lineTo(-180, 125); ctx.fill();
  ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(-330, -80, 46, 0, 7); ctx.fill(); ctx.font = '900 46px Inter'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', -330, -77);
  ctx.textAlign = 'left'; ctx.fillStyle = K.P.ink; ctx.font = '900 58px Inter'; ctx.fillText('Which tool next?', -260, -80);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-370, 10, 560, 26); ctx.fillRect(-370, 60, 420, 26); ctx.restore();
}

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.1);
  const cam = camera(34);
  const B = hackerLab();
  const hacker = new Human({ face: false }); hacker.setAllMaterial(SETS.subjectMat(1.6)); B.scene.add(hacker.group);
  hacker.group.position.set(0, 0, 1.0); hacker.group.rotation.y = Math.PI; hacker.hips.position.y = 0.66;
  const typePose = (t) => hacker.pose({ hipL: [88, 0, 2], hipR: [88, 0, 2], knL: 88, knR: 88, spine: [8, 0, 0], head: [6, 0, 0], shL: [55 + Math.sin(t * 9) * 4, 0, 10], shR: [55 + Math.cos(t * 11) * 4, 0, -10], elL: 60, elR: 60 });
  const render = (focusP, extra = {}) => { const f = extra.fov || 34; if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } E.render(B.scene, cam, { ...NIGHT, focus: cam.position.distanceTo(focusP), aperture: 0.001, ...extra }); };
  const scr = (v) => { cam.updateMatrixWorld(); const p = v.clone().project(cam); return [(p.x + 1) * W / 2, (1 - p.y) * H / 2]; };
  const appW = () => B.app.getWorldPosition(new THREE.Vector3());
  // editor look on the monitor by default
  const editor = () => B.paintScreen((g, w, h) => { g.fillStyle = '#0A0F18'; g.fillRect(0, 0, w, h); const cols = ['#3FD0FF', '#7CF29A', '#E4322B', '#C9D1D9'];
    for (let i = 0; i < 14; i++) { const r = Math.sin(i * 91.7) * 0.5 + 0.5; g.fillStyle = cols[i % 4]; g.globalAlpha = 0.85; g.fillRect(24 + (i % 3) * 22, 24 + i * 25, 120 + r * 320, 12); } g.globalAlpha = 1; });
  const base = (t) => { B.reset(t); typePose(t); hacker.group.visible = true; editor(); };

  // 1 · dark lab: the glowing app box with a "?"
  add({ id: 'S01', at: 0, note: 'dark lab, push in to the floating app box, ? appears', draw(lt, d, t, blit) {
    base(t); cam.position.copy(lerpV(V3(3.4, 2.4, 6.6), V3(2.1, 2.15, 4.7), eio(lt / d))); cam.lookAt(0, 1.6, -0.2); render(appW()); blit();
    const [x, y] = scr(appW().add(V3(0, 0.62, 0))); question(x, y, seg(lt, 0.5, 0.9));
  } });
  cue(0.15, 'whoosh', { gain: 0.5 }); cue(0.55, 'pop', { gain: 0.45 });

  // 2 · free tool, exploding on GitHub (star pops, FREE stamp, GitHub pill)
  { const st = cut(1), fr = Wd('free', 1) - st, ex = Wd('exploding', 1) - st, gh = Wd('github', 1) - st;
    add({ id: 'S02', at: st, note: 'orbit the box; FREE stamp, gold star bursts on exploding', draw(lt, d, t, blit) {
      base(t); const a = lerp(0.5, -0.4, eio(lt / d)); cam.position.set(Math.sin(a) * 4.2, 2.3, -0.25 + Math.cos(a) * 4.2); cam.lookAt(0, 2.0, -0.25);
      if (lt > ex) { const k = eob(seg(lt, ex, ex + 0.5)); B.star.visible = true; B.star.scale.setScalar(0.32 * k); B.star.position.set(0.62, 2.55, 0.05); B.star.rotation.set(0, Math.sin(t * 1.6) * 0.6, 0.1);
        B.mini.forEach((m, i) => { const q = seg(lt, ex + i * 0.03, ex + 1.6 + i * 0.03); if (q <= 0 || q >= 1) return; m.visible = true; const ang = i * 2.39, r = q * (0.6 + (i % 5) * 0.15); m.position.set(0.62 + Math.cos(ang) * r, 2.55 + Math.sin(ang) * r * 0.8 + q * 0.3, 0.05 + Math.sin(i) * 0.2); m.rotation.y = Math.sin(t * 3 + i) * 0.6; m.scale.setScalar(0.07 * (1 - q * 0.6)); }); }
      render(appW()); blit();
      stamp(330, 560, 'FREE', seg(lt, fr, fr + 0.35), -0.14, RED, 120);
      pill(700, 1190, '★ GITHUB TRENDING', GOLD, seg(lt, gh, gh + 0.35), 50);
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + fr, 'slam', { gain: 0.6 }); cue(st + ex, 'pop', { gain: 0.6 }); cue(st + gh, 'tock', { gain: 0.4 }); }

  // 3 · the neon sign turns on: REA
  { const st = cut(2), rea = Wd('rea', 2) - st;
    add({ id: 'S03', at: st, note: 'neon REA sign flickers on behind the box', draw(lt, d, t, blit) {
      base(t); const on = lt < rea ? 0.12 : (seg(lt, rea, rea + 0.5) < 1 ? (Math.sin(lt * 70) > 0 ? 1.6 : 0.3) : 1.6); B.signM.color.setScalar(on);
      cam.position.copy(lerpV(V3(0.2, 1.9, 2.9), V3(0.1, 2.25, 1.6), eio(lt / d))); cam.lookAt(0, 2.6, -3.9); render(V3(0, 3, -3.9)); blit();
      source(seg(lt, 0.3, 0.8));
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + rea, 'thud', { gain: 0.6 }); cue(st + rea + 0.15, 'tock', { gain: 0.35 }); cue(st + rea + 0.3, 'tock', { gain: 0.35 }); }

  // 4 · 460,000+ stars in ~7 months
  { const st = cut(3), sv = Wd('seven', 3) - st;
    add({ id: 'S04', at: st, note: 'big gold star spins, counter to 460,000+, 7 MONTHS pill', draw(lt, d, t, blit) {
      base(t); B.signM.color.setScalar(1.0); B.star.visible = true; B.star.position.set(0, 2.3, 1.3); B.star.scale.setScalar(0.26 * eob(seg(lt, 0, 0.5))); B.star.rotation.set(0.1, Math.sin(t * 1.5) * 0.6, 0);
      B.mini.forEach((m, i) => { m.visible = true; const q = ((lt * 0.35 + i / 26) % 1); m.position.set(Math.sin(i * 2.39) * (0.5 + (i % 4) * 0.25), 1.5 + q * 2.0, 0.3 + Math.cos(i * 1.7) * 0.4); m.rotation.y = Math.sin(t * 2 + i) * 0.6; m.scale.setScalar(0.05 + (i % 3) * 0.015); });
      cam.position.copy(lerpV(V3(0, 2.3, 4.2), V3(0, 2.3, 3.5), eio(lt / d))); cam.lookAt(0, 2.25, 0.6); render(V3(0, 2.35, 0.6)); blit();
      const n = Math.round(460000 * eo(seg(lt, 0.1, 2.2)) / 1000) * 1000; ctx.save(); ctx.font = '900 150px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = GOLD; ctx.shadowBlur = 40; ctx.fillStyle = '#FFE7A8'; ctx.fillText(n.toLocaleString('en-US') + (lt > 2.2 ? '+' : ''), 540, 330); ctx.restore();
      tag(540, 450, 'GITHUB STARS', GOLD, 48); source(); pill(540, 1190, 'IN ~7 MONTHS', RED, seg(lt, sv, sv + 0.35), 62);
    } });
    cue(st, 'whoosh', { gain: 0.5 }); for (let i = 0; i < 9; i++) cue(st + 0.15 + i * 0.22, 'tock', { gain: 0.22 }); cue(st + sv, 'pop', { gain: 0.5 }); }

  // 5 · plug it into your AI coding agent
  { const st = cut(4), ag = Wd('agent', 4) - st, cc = Wd('claude', 4) - st, cx = Wd('codex', 4) - st, cu = Wd('cursor', 4) - st;
    add({ id: 'S05', at: st, note: 'cable runs from the box to the AI chip; agent pills', draw(lt, d, t, blit) {
      base(t); B.signM.color.setScalar(0.9); B.cableProgress(eio(seg(lt, 0.2, Math.max(0.6, ag)))); B.chipL.intensity = lt > ag ? 3 + Math.sin(t * 8) : 0;
      cam.position.copy(lerpV(V3(3.4, 2.0, 3.6), V3(2.9, 1.85, 3.0), eio(lt / d))); cam.lookAt(0.5, 1.35, -0.05); render(V3(0.7, 1.2, 0.1)); blit();
      const [x, y] = scr(V3(0.85, 0.82, 0.12)); tag(x, y + 90, 'AI AGENT', CY, 40, 'center', seg(lt, ag, ag + 0.3));
      pill(540, 300, 'CLAUDE CODE', CY, seg(lt, cc, cc + 0.3), 58); pill(540, 440, 'CODEX', CY, seg(lt, cx, cx + 0.3), 58); pill(540, 580, 'CURSOR', CY, seg(lt, cu, cu + 0.3), 58);
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + 0.2, 'slide', { dur: Math.max(0.6, ag) - 0.2, gain: 0.4 }); [cc, cx, cu].forEach((k) => cue(st + k, 'pop', { gain: 0.45 })); }

  // 6 · ask how it works: the agent scans the box, no source code needed
  { const st = cut(5), ins = Wd('inspects', 5) - st, src = Wd('source', 5) - st;
    add({ id: 'S06', at: st, note: 'push in; red scan sweeps the box; SOURCE CODE crossed out', draw(lt, d, t, blit) {
      base(t); B.signM.color.setScalar(0.8); B.cableProgress(1); B.chipL.intensity = 3; hacker.group.visible = false;
      B.app.rotation.y = 0.6 + lt * 0.15; if (lt > ins) { B.scan.visible = true; B.scan.position.y = 0.4 - ((lt - ins) * 0.55 % 0.8); } B.split(0.25 * eio(seg(lt, ins, ins + 1)));
      cam.position.copy(lerpV(V3(1.3, 2.4, 3.4), V3(0.9, 2.3, 2.5), eio(lt / d))); cam.lookAt(0, 2.02, -0.25); render(appW()); blit();
      if (lt > src) { const p = seg(lt, src, src + 0.3); ctx.save(); ctx.globalAlpha = p; ctx.font = '700 70px FreeMono'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = '#000'; ctx.shadowBlur = 16; ctx.fillStyle = CREAM; ctx.fillText('SOURCE CODE', 540, 250); ctx.restore();
        const q = seg(lt, src + 0.25, src + 0.55); if (q > 0) { ctx.strokeStyle = RED; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(270, 255); ctx.lineTo(lerp(270, 810, q), 255); ctx.stroke(); }
        pill(540, 380, 'NOT NEEDED', RED, seg(lt, src + 0.5, src + 0.8), 54); }
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + ins, 'slide', { dur: 1.2, gain: 0.5 }); cue(st + src + 0.25, 'slam', { gain: 0.5 }); }

  // 7 · down to the binary level, and the evidence
  { const st = cut(6), bn = Wd('binary', 6) - st, ev = Wd('evidence', 6) - st;
    add({ id: 'S07', at: st, note: 'layers split apart: UI / CODE / BINARY; EVIDENCE file drops in', draw(lt, d, t, blit) {
      base(t); B.signM.color.setScalar(0.7); hacker.group.visible = false; B.app.rotation.y = 0.75 + lt * 0.1; B.split(lerp(0.25, 0.7, eio(seg(lt, 0, 1.2))));
      cam.position.copy(lerpV(V3(0.8, 2.25, 4.0), V3(0.6, 2.1, 3.4), eio(lt / d))); cam.lookAt(0, 2.0, -0.25); render(appW()); blit();
      const names = [['UI', CY], ['CODE', '#7CF29A'], ['BINARY', RED]]; B.layers.forEach((g, i) => { const [x, y] = scr(g.getWorldPosition(new THREE.Vector3()).add(V3(0.42, 0, 0))); const a = i === 2 ? seg(lt, bn, bn + 0.3) : seg(lt, 0.4 + i * 0.25, 0.7 + i * 0.25); pill(60, y, names[i][0], names[i][1], a, i === 2 ? 56 : 44, 'left'); });
      evidence(540, 1000, seg(lt, ev, ev + 0.45));
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + bn, 'thud', { gain: 0.55 }); cue(st + ev, 'whoosh', { gain: 0.5 }); cue(st + ev + 0.3, 'slam', { gain: 0.5 }); }

  // 8 · it reads desktop apps, Android, websites, game files, AI models
  { const st = cut(7), keys = ['desktop', 'android', 'websites', 'game', 'model'].map((w) => Wd(w, 7) - st), names = ['DESKTOP', 'ANDROID', 'WEBSITES', 'GAMES', 'AI MODELS'], cols = [CY, '#3DDC84', '#7FB2FF', '#B04CFF', GOLD];
    add({ id: 'S08', at: st, note: 'five target objects orbit the box, each pops on its word', draw(lt, d, t, blit) {
      base(t); B.signM.color.setScalar(0.8); const c = appW();
      B.tg.forEach((g, i) => { const k = seg(lt, keys[i], keys[i] + 0.4); if (k <= 0) return; g.visible = true; const a = i / 5 * Math.PI * 2 + lt * 0.5; g.position.set(c.x + Math.cos(a) * 0.68, c.y + Math.sin(a * 2) * 0.1 - 0.05, c.z + Math.sin(a) * 0.68); g.scale.setScalar(eob(k) * 0.8); g.rotation.y = t * 1.2 + i; });
      const a0 = lerp(-0.25, 0.35, eio(lt / d)); cam.position.set(c.x + Math.sin(a0) * 4.8, 2.9, c.z + Math.cos(a0) * 4.8); cam.lookAt(c.x, 1.95, c.z); render(c); blit();
      B.tg.forEach((g, i) => { if (!g.visible) return; const [x, y] = scr(g.position.clone().add(V3(0, 0.3, 0))); tag(x, y, names[i], cols[i], 46, 'center', seg(lt, keys[i], keys[i] + 0.3)); });
    } });
    cue(st, 'whoosh', { gain: 0.5 }); keys.forEach((k) => cue(st + k, 'pop', { gain: 0.45 })); }

  // 9 · runs locally, one command (terminal on the monitor)
  { const st = cut(8), lo = Wd('locally', 8) - st, one = Wd('one', 8) - st, cmd = '$ npx rea-agents setup';
    const term = (lt, n, lo, t) => { const p = eo(seg(lt, 0, 0.35)); if (p <= 0) return; ctx.save(); ctx.translate(540, lerp(1100, 900, p)); ctx.globalAlpha = p; ctx.shadowColor = 'rgba(63,208,255,0.5)'; ctx.shadowBlur = 40; rr(-470, -190, 940, 380, 24); ctx.fillStyle = 'rgba(5,8,12,0.94)'; ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 4; ctx.strokeStyle = '#2A3A50'; ctx.stroke();
      ['#E4322B', '#F4D35E', '#3DDC84'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(-430 + i * 34, -158, 11, 0, 7); ctx.fill(); }); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = '700 54px FreeMono'; ctx.fillStyle = '#7CF29A'; ctx.fillText(cmd.slice(0, n) + (n < cmd.length && Math.floor(t * 4) % 2 ? '_' : ''), -430, -80);
      ctx.font = '700 40px FreeMono'; if (lt > 1.8) { ctx.fillStyle = '#C9D1D9'; ctx.fillText('> installing...', -430, 0); } if (lt > 2.3) { ctx.fillStyle = '#3FD0FF'; ctx.fillText('OK agent connected', -430, 60); } if (lt > lo) { ctx.fillStyle = '#F4D35E'; ctx.fillText('OK analysis runs locally', -430, 120); } ctx.restore(); };
    add({ id: 'S09', at: st, note: 'over the shoulder: terminal types the setup command; LOCAL + 1 COMMAND', draw(lt, d, t, blit) {
      base(t); B.signM.color.setScalar(0.6); B.app.visible = false; hacker.group.visible = false;
      const n = Math.floor(cmd.length * clamp((lt - 0.2) / 1.4));
      B.paintScreen((g, w, h) => { g.fillStyle = '#05080C'; g.fillRect(0, 0, w, h); g.fillStyle = '#1A2230'; g.fillRect(0, 0, w, 34); ['#E4322B', '#F4D35E', '#3DDC84'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(22 + i * 26, 17, 8, 0, 7); g.fill(); });
        g.font = '700 36px FreeMono'; g.textBaseline = 'top'; g.fillStyle = '#7CF29A'; g.fillText(cmd.slice(0, n) + (Math.floor(t * 3) % 2 && n < cmd.length ? '_' : ''), 26, 70);
        g.font = '700 28px FreeMono'; if (lt > 1.8) { g.fillStyle = '#C9D1D9'; g.fillText('> installing skills...', 26, 140); } if (lt > 2.3) { g.fillStyle = '#3FD0FF'; g.fillText('OK agent connected', 26, 190); } if (lt > lo) { g.fillStyle = '#F4D35E'; g.fillText('OK analysis runs locally', 26, 240); } });
      cam.position.copy(lerpV(V3(1.1, 1.6, 2.6), V3(0.8, 1.5, 2.1), eio(lt / d))); cam.lookAt(0, 1.2, -0.22); render(V3(0, 1.18, -0.2)); blit(); term(lt, n, lo, t);
      pill(540, 380, '100% LOCAL', '#F4D35E', seg(lt, lo, lo + 0.3), 60); pill(540, 520, '1 COMMAND', CY, seg(lt, one, one + 0.3), 60);
    } });
    cue(st, 'whoosh', { gain: 0.5 }); for (let i = 0; i < 12; i++) cue(st + 0.2 + i * 0.12, 'tock', { gain: 0.15 }); cue(st + lo, 'pop', { gain: 0.45 }); cue(st + one, 'pop', { gain: 0.45 }); }

  // 10 · one rule: only with permission (the shield)
  { const st = cut(9), ru = Wd('rule', 9) - st, ow = Wd('own', 9) - st, pe = Wd('permission', 9) - st;
    add({ id: 'S10', at: st, note: 'green shield rises in front of the box; WITH PERMISSION stamp', draw(lt, d, t, blit) {
      base(t); B.signM.color.setScalar(0.6); const c = appW(); B.shield.visible = true; const k = eob(seg(lt, ru, ru + 0.6)); B.shield.position.set(c.x, c.y - 0.05, c.z + 0.75); B.shield.scale.setScalar(Math.max(0.001, k) * 0.6); B.shield.rotation.set(0, Math.sin(t * 1.3) * 0.25, 0);
      cam.position.copy(lerpV(V3(-0.8, 2.3, 4.0), V3(-0.4, 2.2, 3.2), eio(lt / d))); cam.lookAt(c.x, c.y - 0.05, c.z + 0.5); render(B.shield.position); blit();
      pill(540, 300, 'APPS YOU OWN', GREEN, seg(lt, ow, ow + 0.3), 58); stamp(540, 1200, 'WITH PERMISSION', seg(lt, pe, pe + 0.35), -0.08, GREEN, 76);
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + ru, 'thud', { gain: 0.55 }); cue(st + ow, 'pop', { gain: 0.4 }); cue(st + pe, 'slam', { gain: 0.6 }); }

  // 11 · which tool next? comment bubble, pull back
  { const st = cut(10), cm = Wd('comments', 10) - st;
    add({ id: 'S11', at: st, note: 'wide pull-back of the lab; comment bubble', draw(lt, d, t, blit) {
      base(t); B.signM.color.setScalar(1.4);
      cam.position.copy(lerpV(V3(1.0, 2.1, 2.6), V3(2.2, 2.6, 5.4), eio(lt / d))); cam.lookAt(0, 1.9, -0.6); render(V3(0, 1.8, -0.2)); blit();
      bubble(540, 470, seg(lt, 0.2, 0.6)); pill(540, 1200, 'COMMENT BELOW', RED, seg(lt, cm, cm + 0.3), 56); source(seg(lt, 0.5, 1));
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + 0.3, 'pop', { gain: 0.5 }); cue(st + cm, 'pop', { gain: 0.45 }); }

  return { shots: S, cues: CUES };
}
