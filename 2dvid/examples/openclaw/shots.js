// OPENCLAW: THE FREE AI ASSISTANT THAT ACTUALLY DOES THINGS : shot list (realistic 3D studio + real repo images).
import * as THREE from 'three';
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob, rr } from './core/lib.js';
import { L, Wd } from './core/timing.js';
import { camera } from './core/engine.js';
import { studio, loadTex } from './core/studio.js';

const IMGS = ['openclaw-hero-dark.png', 'whatsapp-openclaw.jpg', 'main-chat.png', '04-choose-gateway.png', '05-permissions.png', '1024.png',
  ...['whatsapp', 'telegram', 'slack', 'discord', 'imessage', 'msteams', 'signal', 'anthropic', 'codex'].map((n) => `icon-${n}.png`)];
const TEX = await loadTex(IMGS);

const V3 = (x, y, z) => new THREE.Vector3(x, y, z), lerpV = (a, b, k) => a.clone().lerp(b, k);
const LOOK = { exposure: 0.9, bloom: 0.15, bloomThreshold: 0.95, vignette: 0.45, grain: 0.025, warm: 0.04 };
const RED = '#E2483D', TEAL = '#2EE6D6', GOLD = '#FFD43B', WHITE = '#FFFFFF', GREEN = '#3DDC84';

function pill(x, y, text, col, p = 1, size = 54) {
  if (p <= 0) return; ctx.save(); ctx.font = `900 ${size}px Inter`; const w = ctx.measureText(text).width + size * 1.1, h = size * 1.6;
  const s = eob(clamp(p)); ctx.translate(x, y); ctx.scale(s, s); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 24; rr(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = col; ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = col === GOLD || col === TEAL || col === GREEN || col === WHITE ? '#0B0D12' : WHITE; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 3); ctx.restore();
}
function tag(x, y, text, size = 30, a = 1, col = 'rgba(255,255,255,0.88)') { if (a <= 0) return; ctx.save(); ctx.globalAlpha = clamp(a); ctx.font = `700 ${size}px FreeMono`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = '#000'; ctx.shadowBlur = 12; ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.restore(); }
const source = (a = 1, t = 'SOURCE: GITHUB.COM/OPENCLAW/OPENCLAW') => tag(540, 110, t, 28, a);
function stamp(x, y, text, p, rot = -0.1, col = RED, size = 100) {
  if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const s = lerp(2.2, 1, eo(clamp(p))); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 3);
  ctx.font = `900 ${size}px Inter`; const w = ctx.measureText(text).width + 70, h = size * 1.4; rr(-w / 2, -h / 2, w, h, 16); ctx.fillStyle = 'rgba(10,12,16,0.55)'; ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = col; ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 6); ctx.restore();
}
function card(img, x, y, w, rot, p, label) {
  if (p <= 0) return; const h = w * img.height / img.width; ctx.save(); ctx.translate(x, lerp(y + 400, y, eob(clamp(p)))); ctx.rotate(rot); ctx.globalAlpha = clamp(p * 2);
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 50; rr(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 22); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowBlur = 0;
  ctx.save(); rr(-w / 2, -h / 2, w, h, 14); ctx.clip(); ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
  if (label) { ctx.font = '700 26px FreeMono'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.shadowColor = '#000'; ctx.shadowBlur = 10; ctx.fillText(label, 0, h / 2 + 46); }
  ctx.restore();
}
function strike(x, y, text, p, q) { if (p <= 0) return; ctx.save(); ctx.globalAlpha = clamp(p * 3); ctx.font = '900 70px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = '#000'; ctx.shadowBlur = 18; ctx.fillStyle = WHITE; ctx.fillText(text, x, y); const w = ctx.measureText(text).width;
  if (q > 0) { ctx.shadowBlur = 0; ctx.strokeStyle = RED; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 20, y + 4); ctx.lineTo(x - w / 2 - 20 + (w + 40) * clamp(q), y + 4); ctx.stroke(); } ctx.restore(); }
function bubble(x, y, p) {
  if (p <= 0) return; ctx.save(); ctx.translate(x, y); const s = eob(clamp(p)); ctx.scale(s, s); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; rr(-430, -150, 860, 270, 40); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.moveTo(-250, 115); ctx.lineTo(-290, 210); ctx.lineTo(-170, 115); ctx.fill(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#0B0D12'; ctx.font = '900 54px Inter'; ctx.fillText('Would you let an AI', -380, -60); ctx.fillStyle = RED; ctx.fillText('run your computer?', -380, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-380, 70, 500, 22); ctx.restore();
}
function terminal(x, y, cmd, n, p) {
  if (p <= 0) return; ctx.save(); ctx.translate(x, lerp(y + 200, y, eo(clamp(p)))); ctx.globalAlpha = clamp(p * 2); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 40; rr(-480, -110, 960, 220, 22); ctx.fillStyle = 'rgba(10,12,16,0.96)'; ctx.fill(); ctx.shadowBlur = 0;
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(-440 + i * 32, -78, 10, 0, 7); ctx.fill(); }); ctx.font = '700 33px FreeMono'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#7CF29A'; ctx.fillText(cmd.slice(0, n), -450, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '700 24px FreeMono'; ctx.fillText('macOS / Linux / WSL2 · from the official README', -450, 70); ctx.restore();
}

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.1);
  const cam = camera(34), B = studio(E, TEX), M = B.M;
  const render = (focus, extra = {}) => { const f = extra.fov || 34; if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } E.render(B.scene, cam, { ...LOOK, focus: cam.position.distanceTo(focus), aperture: 0.0012, maxblur: 0.006, ...extra }); };
  const scr = (v) => { cam.updateMatrixWorld(); const p = v.clone().project(cam); return [(p.x + 1) * W / 2, (1 - p.y) * H / 2]; };

  // 1 · a real WhatsApp chat with OpenClaw, on a 3D phone
  { const ac = Wd('actually', 0), wk = Wd('work', 0);
    add({ id: 'S01', at: 0, note: 'phone with the real OpenClaw WhatsApp chat, mascot peeks up', draw(lt, d, t, blit) {
      B.reset(t); B.phone.visible = true; B.phone.position.set(0, 1.32, 0.55); B.phone.rotation.set(-0.05, Math.sin(t * 0.8) * 0.18 - 0.1, 0.02);
      const k = eob(seg(lt, ac, ac + 0.6)); M.group.position.set(0.32, 0.75, 0.35); M.group.rotation.set(0, -0.35, 0); M.group.scale.setScalar(0.6 * Math.max(0.001, k)); M.wave(t, k);
      cam.position.copy(lerpV(V3(0.15, 1.3, 3.4), V3(0.05, 1.28, 2.8), eio(lt / d))); cam.lookAt(0, 1.25, 0.55); render(V3(0, 1.3, 0.55)); blit();
      tag(540, 110, 'REAL CHAT SCREENSHOT · OPENCLAW REPO', 28, seg(lt, 0.4, 0.9)); pill(540, 1240, 'IT DOES THE WORK', GOLD, seg(lt, wk, wk + 0.3), 56);
    } });
    cue(0.15, 'whoosh', { gain: 0.5 }); cue(ac, 'pop', { gain: 0.5 }); cue(wk, 'pop', { gain: 0.45 }); }

  // 2 · meet OpenClaw: the real banner on the wall, mascot on the desk, star counter
  { const st = cut(1), fr = Wd('free', 1) - st, os = Wd('opensource', 1) - st, sr = Wd('stars', 1) - st, nr = Wd('nearly', 1) - st;
    add({ id: 'S02', at: st, note: 'wall display with the real banner; mascot waves; counter', draw(lt, d, t, blit) {
      B.reset(t); M.group.position.set(-0.55, 0.75, 0.2); M.group.rotation.set(0, 0.25, 0); M.group.scale.setScalar(1.15); M.wave(t, 1);
      cam.position.copy(lerpV(V3(0.2, 1.8, 6.8), V3(0, 1.8, 5.8), eio(lt / d))); cam.lookAt(0, 1.45, -0.6); render(V3(0, 1.3, 0)); blit();
      stamp(300, 470, 'FREE', seg(lt, fr, fr + 0.35), -0.12, RED, 110); pill(720, 480, 'OPEN SOURCE', TEAL, seg(lt, os, os + 0.3), 52);
      if (lt > nr) { const n = Math.round(394618 * eo(seg(lt, nr, sr + 0.6))); ctx.save(); ctx.font = '900 140px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 30; ctx.fillStyle = GOLD; ctx.fillText('★ ' + n.toLocaleString('en-US'), 540, 1180); ctx.restore(); tag(540, 1275, 'GITHUB STARS · NOV 17, 2026', 32, seg(lt, nr, nr + 0.4), GOLD); }
      source(seg(lt, 0.3, 0.8));
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + fr, 'slam', { gain: 0.55 }); cue(st + os, 'pop', { gain: 0.45 }); for (let i = 0; i < 8; i++) cue(st + nr + i * 0.2, 'tock', { gain: 0.2 }); }

  // 3 · runs on your own computer, not the cloud
  { const st = cut(2), yo = Wd('own', 2) - st, cl = Wd('cloud', 2) - st;
    add({ id: 'S03', at: st, note: 'laptop with the real Control UI screenshot; cloud gets crossed out', draw(lt, d, t, blit) {
      B.reset(t); B.cloud.visible = true; B.cloud.position.set(0.25, 1.85 + Math.sin(t) * 0.03, -0.3); M.group.position.set(-0.4, 0.75, 0.15); M.group.rotation.set(0, 0.5, 0);
      cam.position.copy(lerpV(V3(0.6, 1.5, 4.2), V3(0.45, 1.45, 3.6), eio(lt / d))); cam.lookAt(0.15, 1.2, -0.2); render(V3(0.25, 1.0, -0.2)); blit();
      pill(540, 1220, 'YOUR COMPUTER', TEAL, seg(lt, yo, yo + 0.3), 58);
      if (lt > cl) { const [x, y] = scr(B.cloud.position); const q = seg(lt, cl, cl + 0.35); ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(x - 140, y - 110); ctx.lineTo(x - 140 + 280 * clamp(q * 2), y - 110 + 220 * clamp(q * 2)); ctx.stroke(); if (q > 0.5) { ctx.beginPath(); ctx.moveTo(x + 140, y - 110); ctx.lineTo(x + 140 - 280 * clamp(q * 2 - 1), y - 110 + 220 * clamp(q * 2 - 1)); ctx.stroke(); } ctx.restore(); }
      tag(540, 110, 'REAL SCREENSHOT: OPENCLAW CONTROL UI', 28, seg(lt, 0.3, 0.8));
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + yo, 'pop', { gain: 0.45 }); cue(st + cl, 'slam', { gain: 0.55 }); }

  // 4 · where you chat: real channel icons pop into an arc around the mascot
  { const st = cut(3), names = ['whatsapp', 'telegram', 'slack', 'discord', 'imessage'], ks = names.map((w) => Wd(w, 3) - st), tw = Wd('twenty', 3) - st;
    add({ id: 'S04', at: st, note: 'real channel app icons fly in on their words; +20 MORE', draw(lt, d, t, blit) {
      B.reset(t); M.group.position.set(0, 0.75, 0.25); M.group.rotation.set(0, 0, 0); M.group.scale.setScalar(1.2); M.wave(t, 0.6);
      B.chans.forEach((g, i) => { const k = i < 5 ? seg(lt, ks[i], ks[i] + 0.4) : seg(lt, tw + (i - 5) * 0.12, tw + 0.4 + (i - 5) * 0.12); if (k <= 0) return; g.visible = true; const a = Math.PI * (0.92 - i * 0.14), r = 0.72;
        g.position.set(Math.cos(a) * r, 1.05 + Math.sin(a) * r * 0.75 + Math.sin(t * 2 + i) * 0.015, 0.3); g.scale.setScalar(eob(k)); g.rotation.set(0, Math.sin(t * 1.5 + i) * 0.25, 0); });
      cam.position.copy(lerpV(V3(0, 1.3, 5.0), V3(0, 1.3, 4.4), eio(lt / d))); cam.lookAt(0, 1.2, 0.25); render(V3(0, 1.1, 0.3)); blit();
      pill(540, 1220, '+ 20 MORE', GOLD, seg(lt, tw, tw + 0.3), 64);
    } });
    cue(st, 'whoosh', { gain: 0.5 }); ks.forEach((k) => cue(st + k, 'pop', { gain: 0.45 })); cue(st + tw, 'pop', { gain: 0.5 }); }

  // 5 · memory and logins stay on your hardware: gold padlock locks onto the laptop
  { const st = cut(4), me = Wd('memory', 4) - st, lo = Wd('logins', 4) - st, hw = Wd('hardware', 4) - st;
    add({ id: 'S05', at: st, note: 'gold padlock drops in front of the laptop and snaps shut', draw(lt, d, t, blit) {
      B.reset(t); B.lock.visible = true; const k = eob(seg(lt, 0.1, 0.7)); B.lock.position.set(0.25, lerp(1.9, 1.08, k), 0.25); B.lock.rotation.set(0, Math.sin(t * 1.2) * 0.25, 0); B.lock.children[1].position.y = lerp(0.18, 0.12, eob(seg(lt, hw, hw + 0.3)));
      cam.position.copy(lerpV(V3(0.25, 1.45, 3.6), V3(0.25, 1.4, 3.1), eio(lt / d))); cam.lookAt(0.25, 1.1, 0); render(B.lock.position); blit();
      pill(320, 330, 'MEMORY', TEAL, seg(lt, me, me + 0.3), 54); pill(760, 330, 'LOGINS', TEAL, seg(lt, lo, lo + 0.3), 54); pill(540, 1220, 'YOUR HARDWARE', GOLD, seg(lt, hw, hw + 0.3), 60);
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + 0.6, 'thud', { gain: 0.5 }); cue(st + me, 'pop', { gain: 0.4 }); cue(st + lo, 'pop', { gain: 0.4 }); cue(st + hw, 'slam', { gain: 0.55 }); }

  // 6 · pick the brain: Claude / Codex / local model tiles above the mascot, then they swap
  { const st = cut(5), ks = [Wd('claude', 5), Wd('codex', 5), Wd('local', 5)].map((x) => x - st), sw = Wd('swap', 5) - st, lbl = ['CLAUDE', 'CODEX', 'LOCAL MODEL'];
    add({ id: 'S06', at: st, note: 'three model tiles (real Anthropic + OpenAI icons, LOCAL chip) orbit and swap', draw(lt, d, t, blit) {
      B.reset(t); M.group.position.set(0, 0.75, 0.25); M.group.rotation.set(0, 0, 0); M.group.scale.setScalar(1.2);
      const spin = lt > sw ? eio(seg(lt, sw, sw + 0.9)) * Math.PI * 2 / 3 : 0;
      B.models.forEach((g, i) => { const k = seg(lt, ks[i], ks[i] + 0.4); if (k <= 0) return; g.visible = true; const a = Math.PI / 2 + (i - 1) * 0.9 + spin; g.position.set(Math.cos(a) * 0.55, 1.3 + Math.sin(a) * 0.18, 0.3); g.scale.setScalar(eob(k) * 1.15); g.rotation.set(0, 0, 0); });
      cam.position.copy(lerpV(V3(0, 1.3, 4.6), V3(0, 1.32, 4.0), eio(lt / d))); cam.lookAt(0, 1.2, 0.25); render(V3(0, 1.2, 0.3)); blit();
      B.models.forEach((g, i) => { if (!g.visible) return; const [x, y] = scr(g.position.clone().add(V3(0, -0.2, 0))); tag(x, y, lbl[i], 34, seg(lt, ks[i], ks[i] + 0.3), WHITE); });
      pill(540, 1220, 'SWAP ANYTIME', GOLD, seg(lt, sw, sw + 0.3), 58);
    } });
    cue(st, 'whoosh', { gain: 0.5 }); ks.forEach((k) => cue(st + k, 'pop', { gain: 0.45 })); cue(st + sw, 'slide', { dur: 0.9, gain: 0.45 }); }

  // 7 · no paid tier, no hosted service, no token; a non-profit runs it (real banner up close)
  { const st = cut(6), pa = Wd('paid', 6) - st, ho = Wd('hosted', 6) - st, to = Wd('token', 6) - st, np = Wd('nonprofit', 6) - st;
    add({ id: 'S07', at: st, note: 'close on the real banner; three strike-throughs; NON-PROFIT stamp', draw(lt, d, t, blit) {
      B.reset(t); cam.position.copy(lerpV(V3(-0.3, 1.9, 3.6), V3(0.2, 2.0, 3.0), eio(lt / d))); cam.lookAt(0, 2.0, -1.33); render(V3(0, 2.05, -1.3)); blit();
      if (lt > pa - 0.2) { ctx.save(); ctx.globalAlpha = 0.72 * seg(lt, pa - 0.2, pa); rr(170, 680, 740, 400, 30); ctx.fillStyle = '#07080B'; ctx.fill(); ctx.restore(); }
      strike(540, 760, 'PAID TIER', seg(lt, pa - 0.2, pa), seg(lt, pa + 0.15, pa + 0.45)); strike(540, 880, 'HOSTED SERVICE', seg(lt, ho - 0.2, ho), seg(lt, ho + 0.15, ho + 0.45)); strike(540, 1000, 'CRYPTO TOKEN', seg(lt, to - 0.2, to), seg(lt, to + 0.15, to + 0.45));
      stamp(540, 1200, 'NON-PROFIT 501(c)(3)', seg(lt, np, np + 0.35), -0.06, GREEN, 66); source();
    } });
    cue(st, 'whoosh', { gain: 0.5 }); [pa, ho, to].forEach((k) => cue(st + k + 0.15, 'slide', { dur: 0.3, gain: 0.4 })); cue(st + np, 'slam', { gain: 0.6 }); }

  // 8 · install on Mac, Windows or Linux with one command (lid opens; real onboarding screenshot)
  { const st = cut(7), ks = ['mac', 'windows', 'linux'].map((w) => Wd(w, 7) - st), oc = Wd('one', 7) - st, cmd = 'curl -fsSL https://openclaw.ai/install.sh | bash';
    add({ id: 'S08', at: st, note: 'laptop lid opens; real Choose-your-Gateway screenshot card; install command', draw(lt, d, t, blit) {
      B.reset(t); M.group.position.set(-0.45, 0.75, 0.2); B.lid.rotation.x = lerp(-1.62, -0.28, eio(seg(lt, 0, 1.0)));
      cam.position.copy(lerpV(V3(0.25, 1.6, 4.2), V3(0.25, 1.55, 3.6), eio(lt / d))); cam.lookAt(0.2, 1.05, -0.1); render(V3(0.25, 1.0, -0.1)); blit();
      ['MAC', 'WINDOWS', 'LINUX'].forEach((s, i) => pill(220 + i * 320, 250, s, WHITE, seg(lt, ks[i], ks[i] + 0.3), 50));
      card(TEX['04-choose-gateway.png'].image, 760, 640, 330, 0.05, seg(lt, 0.6, 1.1), 'REAL ONBOARDING SCREEN');
      terminal(540, 1150, cmd, Math.floor(cmd.length * clamp((lt - oc) / 1.0)), seg(lt, oc - 0.2, oc + 0.2));
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + 0.2, 'slide', { dur: 0.8, gain: 0.4 }); ks.forEach((k) => cue(st + k, 'pop', { gain: 0.4 })); for (let i = 0; i < 8; i++) cue(st + oc + i * 0.12, 'tock', { gain: 0.15 }); }

  // 9 · security: it runs tools on your machine; read the guide (shield + real permissions screen)
  { const st = cut(8), to = Wd('tools', 8) - st, sg = Wd('security', 8) - st;
    add({ id: 'S09', at: st, note: 'shield rises in front of the laptop; real Permissions screenshot card', draw(lt, d, t, blit) {
      B.reset(t); B.shield.visible = true; const k = eob(seg(lt, sg - 0.4, sg + 0.3)); B.shield.position.set(0.25, 1.15, 0.35); B.shield.scale.setScalar(Math.max(0.001, k) * 0.55); B.shield.rotation.set(0, Math.sin(t * 1.3) * 0.25, 0);
      cam.position.copy(lerpV(V3(-0.3, 1.5, 4.2), V3(0.0, 1.45, 3.6), eio(lt / d))); cam.lookAt(0.2, 1.1, 0); render(V3(0.25, 1.1, 0.2)); blit();
      card(TEX['05-permissions.png'].image, 290, 640, 330, -0.05, seg(lt, to, to + 0.5), 'REAL PERMISSIONS SCREEN');
      pill(540, 1220, 'READ THE SECURITY GUIDE', GREEN, seg(lt, sg, sg + 0.3), 50); tag(540, 1300, 'docs.openclaw.ai/gateway/security', 30, seg(lt, sg + 0.2, sg + 0.6));
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + to, 'pop', { gain: 0.45 }); cue(st + sg, 'thud', { gain: 0.55 }); }

  // 10 · would you let an AI run your computer? (pull back, mascot waves)
  { const st = cut(9), cm = Wd('comments', 9) - st;
    add({ id: 'S10', at: st, note: 'wide pull-back, mascot waves, comment bubble', draw(lt, d, t, blit) {
      B.reset(t); M.group.position.set(-0.5, 0.75, 0.25); M.group.scale.setScalar(1.15); M.wave(t, 1);
      cam.position.copy(lerpV(V3(0.3, 1.7, 4.6), V3(0.8, 2.1, 6.6), eio(lt / d))); cam.lookAt(0, 1.4, -0.4); render(V3(0, 1.2, 0)); blit();
      bubble(540, 420, seg(lt, 0.2, 0.6)); pill(540, 1220, 'COMMENT BELOW', RED, seg(lt, cm, cm + 0.3), 56); source(seg(lt, 0.5, 1));
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(st + 0.3, 'pop', { gain: 0.5 }); cue(st + cm, 'pop', { gain: 0.45 }); }

  return { shots: S, cues: CUES };
}
