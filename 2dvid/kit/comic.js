// COMIC LAYER for Inside Out: ink outlines, halftone dots, sunbursts, SFX bursts, narration boxes, bubbles,
// and the props for "What if the world banned AI?". Same flat look as kit.js, plus comic-book ink.
import { ctx, setCtx, C, W, H, TAU, lerp, clamp, rnd, eob, rr, circle, ell, line, fillAll } from './lib.js';

Object.assign(C, {
  paper: '#FFF3D9', paperDot: '#F3DFB6', blue: '#2F6FE4', blueDark: '#2154B8', blueLight: '#6FA3FF', sky2: '#8FD3F4',
  green: '#3FAE5A', greenDark: '#2C8744', gold: '#F5B820', goldDark: '#C98A0B', goldLight: '#FFE07A',
  purple: '#6C4CE0', purpleDark: '#4E34B0', purpleLight: '#8F75F0', grey: '#B9C0CC', greyDark: '#6E7787',
  stone: '#EDE5D2', stoneDark: '#CFC4A9', redDark: '#A51D2D', wood: '#9A6332', woodDark: '#6E4321', orange: '#FF8A3D',
  itGreen: '#009246', itRed: '#CE2B37', euBlue: '#1F3FA8',
});

// ═════════════ INK ═════════════
// inked(fn): draw fn() on a transparent layer (same transform), then stamp it with a solid ink outline (w px)
// and an optional hard comic drop shadow. Nested calls are fine (layer pool by depth).
const pool = []; let depth = 0;
export function inked(fn, w = 6, shadow = 0.0) {
  if (!pool[depth]) { const c = document.createElement('canvas'); c.width = W; c.height = H; pool[depth] = c; }
  const layer = pool[depth], l = layer.getContext('2d'), main = ctx, m = main.getTransform();
  l.setTransform(1, 0, 0, 1, 0, 0); l.clearRect(0, 0, W, H); l.setTransform(m); l.globalAlpha = 1; l.filter = 'none';
  depth++; setCtx(l);
  try { fn(); } finally { setCtx(main); depth--; }
  main.save(); main.setTransform(1, 0, 0, 1, 0, 0);
  const k = C.ink, ff = `drop-shadow(${w}px 0 0 ${k}) drop-shadow(-${w}px 0 0 ${k}) drop-shadow(0 ${w}px 0 ${k}) drop-shadow(0 -${w}px 0 ${k})`;
  main.filter = shadow ? `${ff} drop-shadow(12px 14px 0 rgba(26,26,30,${shadow}))` : ff;
  main.drawImage(layer, 0, 0); main.filter = 'none'; main.restore();
}

// ═════════════ BACKGROUNDS ═════════════
const patCache = {};
function dotPattern(color, step, r) {
  const key = color + step + r; if (patCache[key]) return patCache[key];
  const c = document.createElement('canvas'); c.width = step; c.height = step; const g = c.getContext('2d');
  g.fillStyle = color; g.beginPath(); g.arc(step / 4, step / 4, r, 0, TAU); g.arc(step * 3 / 4, step * 3 / 4, r, 0, TAU); g.fill();
  return (patCache[key] = c);
}
/** flat paper colour + an even halftone dot screen */
export function paper(bg = C.paper, dot = C.paperDot, step = 34, r = 5) {
  fillAll(bg);
  ctx.save(); ctx.fillStyle = ctx.createPattern(dotPattern(dot, step, r), 'repeat'); ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore();
}
/** comic halftone shading: dots grow toward (x, y) inside radius R */
export function halftone(x, y, R, color, step = 30, maxR = 11, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.beginPath();
  for (let gy = Math.floor((y - R) / step) * step; gy <= y + R; gy += step)
    for (let gx = Math.floor((x - R) / step) * step; gx <= x + R; gx += step) {
      const ox = (Math.round(gy / step) % 2) * step / 2, px = gx + ox, d = Math.hypot(px - x, gy - y) / R; if (d >= 1) continue;
      const r = maxR * (1 - d); if (r < 1) continue; ctx.moveTo(px + r, gy); ctx.arc(px, gy, r, 0, TAU);
    }
  ctx.fill(); ctx.restore();
}
/** action sunburst: alternating rays from (x, y) */
export function sunburst(x, y, a, b, rot = 0, n = 22) {
  fillAll(a);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = b; ctx.beginPath();
  for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = a0 + TAU / n / 2; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * 2600, Math.sin(a0) * 2600); ctx.lineTo(Math.cos(a1) * 2600, Math.sin(a1) * 2600); ctx.closePath(); }
  ctx.fill(); ctx.restore();
}
/** comic speed/focus lines converging on (x, y) */
export function focusLines(x, y, r0, a = 1, color = C.ink, n = 40, seed = 0) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const an = i / n * TAU + rnd(i + seed) * 0.1, w = 0.012 + rnd(i + 40 + seed) * 0.02, r1 = r0 + rnd(i + 80 + seed) * 160;
    ctx.moveTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1);
    ctx.lineTo(x + Math.cos(an - w) * 2400, y + Math.sin(an - w) * 2400); ctx.lineTo(x + Math.cos(an + w) * 2400, y + Math.sin(an + w) * 2400); ctx.closePath();
  }
  ctx.fill(); ctx.restore();
}

// ═════════════ LETTERING ═════════════
/** comic SFX starburst with text ("BAM!"). sc animates the pop */
export function sfx(text, x, y, r, sc = 1, rot = -0.12, fill = C.yellow, txt = C.red, size) {
  if (sc <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  const star = (rr0) => { ctx.beginPath(); const n = 14; for (let i = 0; i <= n * 2; i++) { const an = i / (n * 2) * TAU, R = (i % 2 ? rr0 * 0.66 : rr0) * (0.9 + rnd(i + text.length) * 0.2); i ? ctx.lineTo(Math.cos(an) * R, Math.sin(an) * R) : ctx.moveTo(Math.cos(an) * R, Math.sin(an) * R); } ctx.closePath(); };
  ctx.translate(12, 14); star(r); ctx.fillStyle = C.ink; ctx.fill(); ctx.translate(-12, -14);
  star(r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.strokeStyle = C.ink; ctx.stroke();
  const fs = size || r * 0.5; ctx.font = `900 ${fs}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.transform(1, 0, -0.12, 1, 0, 0);
  ctx.lineWidth = fs * 0.22; ctx.lineJoin = 'round'; ctx.strokeStyle = C.ink; ctx.strokeText(text, 0, 4); ctx.fillStyle = txt; ctx.fillText(text, 0, 4);
  ctx.restore();
}
/** comic narration box (yellow, ink border, hard shadow). text may contain \n. anchor = centre */
export function box(text, x, y, size = 40, sc = 1, bg = C.yellow, fg = C.ink, rot = -0.015) {
  if (sc <= 0) return;
  const ls = text.split('\n');
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.font = `900 ${size}px Inter`; ctx.letterSpacing = '1px';
  const w = Math.max(...ls.map((s) => ctx.measureText(s).width)) + size * 1.1, h = ls.length * size * 1.18 + size * 0.75;
  ctx.fillStyle = C.ink; ctx.fillRect(-w / 2 + 10, -h / 2 + 10, w, h);
  ctx.fillStyle = bg; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ls.forEach((s, i) => ctx.fillText(s, 0, (i - (ls.length - 1) / 2) * size * 1.18 + size * 0.04));
  ctx.letterSpacing = '0px'; ctx.restore();
}
/** source tag: small white box "SOURCE: …" at the top of the panel */
export const source = (text, sc = 1, y = 170) => box('SOURCE: ' + text, 540, y, 32, sc, C.white, C.ink, 0.01);
/** big outlined comic number / word with a hard shadow */
export function bigInk(text, x, y, size, fill = C.yellow, rot = -0.04, sc = 1) {
  if (sc <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.transform(1, 0, -0.1, 1, 0, 0);
  ctx.font = `900 ${size}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.2; ctx.strokeStyle = C.ink; ctx.strokeText(text, size * 0.06, size * 0.08);
  ctx.fillStyle = C.ink; ctx.fillText(text, size * 0.06, size * 0.08); ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fill; ctx.fillText(text, 0, 0); ctx.restore();
}
/** speech / thought bubble with tail to (tx, ty). content() draws at the bubble centre (or text) */
export function bubble(x, y, w, h, tx, ty, sc = 1, thought = false, content = null) {
  if (sc <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  const lx = (tx - x) / sc, ly = (ty - y) / sc;
  ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.fillStyle = C.white; ctx.lineJoin = 'round';
  if (thought) {
    for (let i = 1; i <= 3; i++) { const k = 1 - i * 0.24; ctx.beginPath(); ctx.arc(lx * (1 - k) + 0, ly * (1 - k) + 0, 0, 0, 0); }
    [[0.35, 26], [0.62, 18], [0.85, 12]].forEach(([k, r]) => { ctx.beginPath(); ctx.arc(lx * k, ly * k + (k - 0.3) * 0, r, 0, TAU); ctx.fill(); ctx.stroke(); });
    ctx.beginPath();
    const n = 11; for (let i = 0; i < n; i++) { const a = i / n * TAU, bx = Math.cos(a) * w / 2 * 0.86, by = Math.sin(a) * h / 2 * 0.86; ctx.moveTo(bx + h * 0.2, by); ctx.arc(bx, by, h * 0.2, 0, TAU); }
    ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, w / 2 * 0.92, h / 2 * 0.92, 0, 0, TAU); ctx.fill();
  } else {
    ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, TAU); ctx.moveTo(-w * 0.12, h * 0.3); ctx.lineTo(lx, ly); ctx.lineTo(w * 0.08, h * 0.36);
    ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, w / 2 - 4, h / 2 - 4, 0, 0, TAU); ctx.fill();
  }
  if (typeof content === 'function') content(); else if (content) { ctx.font = `900 ${h * 0.3}px Inter`; ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(content, 0, 4); }
  ctx.restore();
}

// ═════════════ THE AI MASCOT ═════════════
/** a friendly chip with eyes = "AI". mood: 'happy' | 'scared' | 'sad' | 'wink'. arms: [leftAngle, rightAngle] (rad, 0 = down) */
export function chip(x, y, s = 1, o = {}) {
  const mood = o.mood || 'happy', arms = o.arms || [0.5, -0.5], look = o.look || 0;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  ctx.fillStyle = C.gold;
  for (let i = -2; i <= 2; i++) { rr(i * 34 - 9, -138, 18, 40, 6); ctx.fill(); rr(i * 34 - 9, 98, 18, 40, 6); ctx.fill(); }
  for (const sd of [-1, 1]) {        // arms: angle from straight down, outward
    const an = sd < 0 ? arms[0] : arms[1], sx = sd * 112, sy = 10, hx = sx + sd * 110 * Math.sin(Math.abs(an)), hy = sy + Math.cos(an) * 110;
    line([[sx, sy], [hx, hy]], C.ink, 14); circle(hx, hy, 20, C.white);
  }
  const col = o.col || [C.purple, C.purpleDark, C.purpleLight];
  rr(-112, -112, 224, 224, 34); ctx.fillStyle = col[1]; ctx.fill();
  rr(-112, -112, 224, 206, 34); ctx.fillStyle = col[0]; ctx.fill();
  rr(-88, -92, 70, 22, 11); ctx.fillStyle = col[2]; ctx.fill();
  // face
  const ey = -10;
  if (mood === 'scared') { for (const sd of [-1, 1]) { ell(sd * 40, ey, 26, 30, C.white); circle(sd * 40 + look * 8, ey + 4, 9, C.ink); } }
  else if (mood === 'wink') { ell(-40, ey, 22, 26, C.white); circle(-40 + look * 6, ey + 2, 12, C.ink); line([[22, ey], [58, ey]], C.ink, 9); }
  else { for (const sd of [-1, 1]) { ell(sd * 40, ey, 22, 26, C.white); circle(sd * 40 + look * 6, ey + 2, 12, C.ink); circle(sd * 40 + 5 + look * 6, ey - 4, 4, C.white); } }
  ctx.lineCap = 'round'; ctx.strokeStyle = C.ink; ctx.lineWidth = 9;
  if (mood === 'happy' || mood === 'wink') { ctx.beginPath(); ctx.arc(0, 36, 26, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  if (mood === 'scared') { ell(0, 52, 16, 20, C.ink); }
  if (mood === 'sad') { ctx.beginPath(); ctx.arc(0, 66, 24, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
  if (mood === 'scared' || mood === 'sad') { ell(92, -60, 9, 14, C.sky2); }
  ctx.font = '900 34px Inter'; ctx.fillStyle = C.goldLight; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('AI', 58, -72);
  if (o.holding) o.holding();
  ctx.restore();
}

// ═════════════ PROPS ═════════════
/** cartoon globe. spin = longitude offset (0..1 wraps) */
export function globe(x, y, r, spin = 0) {
  ctx.save(); ctx.translate(x, y);
  circle(0, 0, r, C.blue);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
  const land = [[0.05, -0.45, 0.32, 0.22], [0.12, -0.05, 0.18, 0.34], [0.42, -0.4, 0.4, 0.26], [0.5, 0.05, 0.16, 0.3], [0.62, -0.05, 0.12, 0.12], [0.78, 0.45, 0.16, 0.12], [0.3, 0.72, 0.5, 0.12], [0.86, -0.3, 0.2, 0.18]];
  for (let k = -1; k <= 1; k++) for (const [lx, ly, rx, ry] of land) {
    const u = ((lx + spin) % 1 + 1) % 1 + k, px = (u - 0.5) * 2.4 * r; if (Math.abs(px) > r * 1.5) continue;
    const squash = Math.max(0.25, Math.cos(clamp(px / r, -1, 1) * Math.PI / 2));
    ell(px, ly * r, rx * r * squash * 1.1, ry * r, C.green); ell(px - rx * r * 0.25 * squash, ly * r - ry * r * 0.25, rx * r * squash * 0.5, ry * r * 0.45, C.greenDark);
  }
  ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.15, r * 1.05, 0, TAU); ctx.arc(-r * 0.32, -r * 0.32, r * 1.05, 0, TAU, true); ctx.fillStyle = 'rgba(14,26,43,0.22)'; ctx.fill('evenodd');
  ctx.restore();
  ell(-r * 0.42, -r * 0.5, r * 0.18, r * 0.08, 'rgba(255,255,255,0.55)', -0.6);
  ctx.restore();
}
/** rubber stamp text (red, rotated). sc animates the slam */
export function stamp(text, x, y, size, sc = 1, rot = -0.18, color = C.red, a = 1) {
  if (sc <= 0 || a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = a;
  ctx.font = `900 ${size}px Inter`; ctx.letterSpacing = '6px';
  const w = ctx.measureText(text).width + size * 0.9, h = size * 1.45;
  ctx.fillStyle = C.white; rr(-w / 2, -h / 2, w, h, 18); ctx.fill();
  ctx.lineWidth = size * 0.11; ctx.strokeStyle = color; rr(-w / 2, -h / 2, w, h, 18); ctx.stroke();
  rr(-w / 2 + size * 0.14, -h / 2 + size * 0.14, w - size * 0.28, h - size * 0.28, 10); ctx.lineWidth = size * 0.04; ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, size * 0.05);
  ctx.letterSpacing = '0px'; ctx.restore();
}
/** red "no" sign (circle + slash) */
export function noSign(x, y, r, sc = 1) {
  if (sc <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.lineWidth = r * 0.2; ctx.strokeStyle = C.red; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.stroke();
  ctx.restore();
}
/** envelope. spam = red SPAM label */
export function envelope(x, y, s = 1, rot = 0, spam = true) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = C.white; ctx.fillRect(-80, -52, 160, 104);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.strokeRect(-80, -52, 160, 104);
  ctx.beginPath(); ctx.moveTo(-80, -52); ctx.lineTo(0, 12); ctx.lineTo(80, -52); ctx.stroke();
  if (spam) { ctx.save(); ctx.rotate(-0.15); ctx.fillStyle = C.red; rr(-58, 8, 116, 40, 8); ctx.fill(); ctx.font = '900 30px Inter'; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SPAM', 0, 29); ctx.restore(); }
  ctx.restore();
}
/** smartphone. screen(w, h) draws the screen content in local coords (top-left of the screen = 0,0) */
export function phone(x, y, s = 1, rot = 0, screen = null) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-200, -380, 400, 760, 56); ctx.fillStyle = C.ink; ctx.fill();
  rr(-178, -350, 356, 700, 34); ctx.fillStyle = C.white; ctx.fill();
  if (screen) { ctx.save(); rr(-178, -350, 356, 700, 34); ctx.clip(); ctx.translate(-178, -350); screen(356, 700); ctx.restore(); }
  rr(-50, -368, 100, 16, 8); ctx.fillStyle = '#33333a'; ctx.fill();
  ctx.restore();
}
/** heater shield with a check or label */
export function shield(x, y, s = 1, rot = 0, label = 'AI', crack = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const p = () => { ctx.beginPath(); ctx.moveTo(0, -150); ctx.quadraticCurveTo(70, -112, 130, -120); ctx.quadraticCurveTo(140, 60, 0, 160); ctx.quadraticCurveTo(-140, 60, -130, -120); ctx.quadraticCurveTo(-70, -112, 0, -150); ctx.closePath(); };
  p(); ctx.fillStyle = C.white; ctx.fill();
  ctx.save(); ctx.scale(0.84, 0.84); ctx.translate(0, 4); p(); ctx.fillStyle = C.blue; ctx.fill(); ctx.restore();
  ctx.save(); ctx.scale(0.84, 0.84); p(); ctx.clip(); ctx.fillStyle = C.blueDark; ctx.fillRect(0, -200, 200, 400); ctx.restore();
  ctx.font = '900 92px Inter'; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 0);
  if (crack > 0) line([[-10, -150], [20, -60], [-30, 0], [25, 70], [0, 160]].slice(0, 1 + Math.round(crack * 4)), C.ink, 10);
  ctx.restore();
}
/** classical bank building, ~640 wide at s = 1, origin = base centre */
export function bank(x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = C.stoneDark; ctx.fillRect(-340, -40, 680, 40); ctx.fillStyle = C.stone; ctx.fillRect(-310, -80, 620, 40);
  ctx.fillStyle = C.stoneDark; ctx.fillRect(-290, -460, 580, 380);
  for (let i = 0; i < 5; i++) { const cx = -240 + i * 120; ctx.fillStyle = C.stone; ctx.fillRect(cx - 34, -440, 68, 360); ctx.fillStyle = '#DCD2BA'; ctx.fillRect(cx + 10, -440, 24, 360); ctx.fillStyle = C.stone; ctx.fillRect(cx - 46, -460, 92, 26); ctx.fillRect(cx - 46, -100, 92, 22); }
  ctx.fillStyle = C.stone; ctx.fillRect(-320, -530, 640, 74);
  ctx.beginPath(); ctx.moveTo(-340, -530); ctx.lineTo(0, -720); ctx.lineTo(340, -530); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-250, -548); ctx.lineTo(0, -686); ctx.lineTo(250, -548); ctx.closePath(); ctx.fillStyle = C.stoneDark; ctx.fill();
  ctx.font = '900 56px Inter'; ctx.letterSpacing = '14px'; ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BANK', 8, -492); ctx.letterSpacing = '0px';
  circle(0, -600, 34, C.gold); ctx.font = '900 44px Inter'; ctx.fillStyle = C.ink; ctx.fillText('$', 0, -598);
  ctx.restore();
}
/** rotating red alarm light. on 0..1 */
export function siren(x, y, s, t, on = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (on > 0) { const an = t * 9; ctx.save(); ctx.globalAlpha = 0.35 * on; ctx.fillStyle = C.red; for (const k of [0, Math.PI]) { ctx.beginPath(); ctx.moveTo(0, -40); ctx.arc(0, -40, 700, an + k - 0.3, an + k + 0.3); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  rr(-70, 0, 140, 34, 8); ctx.fillStyle = C.greyDark; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 58, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = on > 0 && Math.sin(t * 18) > -0.3 ? C.red : C.redDark; ctx.fill();
  ell(-20, -30, 12, 8, 'rgba(255,255,255,0.6)', -0.5);
  ctx.restore();
}
/** bank card, 560x350 at s = 1 */
export function card(x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-280, -175, 560, 350, 34); ctx.fillStyle = C.blue; ctx.fill();
  ctx.save(); rr(-280, -175, 560, 350, 34); ctx.clip(); ctx.beginPath(); ctx.ellipse(220, 200, 330, 220, 0, 0, TAU); ctx.fillStyle = C.blueDark; ctx.fill(); ctx.restore();
  rr(-220, -80, 96, 74, 12); ctx.fillStyle = C.gold; ctx.fill(); ctx.strokeStyle = C.goldDark; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-220, -43); ctx.lineTo(-124, -43); ctx.moveTo(-172, -80); ctx.lineTo(-172, -6); ctx.stroke();
  ctx.font = '900 42px Inter'; ctx.letterSpacing = '6px'; ctx.fillStyle = C.white; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('•••• •••• •••• 4242', -220, 60); ctx.font = '900 28px Inter'; ctx.fillText('BANK CARD', -220, 120); ctx.letterSpacing = '0px';
  ctx.restore();
}
/** red masked "fraud" blob */
export function bandit(x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  circle(0, 0, 70, C.red); ell(-22, -24, 18, 10, 'rgba(255,255,255,0.35)', -0.5);
  rr(-74, -26, 148, 38, 19); ctx.fillStyle = C.ink; ctx.fill();
  for (const sd of [-1, 1]) { circle(sd * 26, -7, 11, C.white); circle(sd * 26 + 2, -6, 5, C.ink); }
  ctx.beginPath(); ctx.moveTo(-22, 36); ctx.quadraticCurveTo(0, 24, 22, 36); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();
  ctx.restore();
}
/** hospital scan monitor: screen(w, h) draws inside the 700x520 screen */
export function monitor(x, y, s = 1, screen = null) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-40, 290, 80, 160, 10); ctx.fillStyle = C.greyDark; ctx.fill(); rr(-180, 440, 360, 40, 16); ctx.fill();
  rr(-390, -310, 780, 620, 40); ctx.fillStyle = C.grey; ctx.fill(); rr(-390, 250, 780, 60, [0, 0, 40, 40]); ctx.fillStyle = '#A3ABB9'; ctx.fill();
  rr(-350, -270, 700, 520, 18); ctx.fillStyle = C.navy; ctx.fill();
  if (screen) { ctx.save(); rr(-350, -270, 700, 520, 18); ctx.clip(); ctx.translate(-350, -270); screen(700, 520); ctx.restore(); }
  circle(330, 280, 12, C.green);
  ctx.restore();
}
/** red medical cross sign */
export function medCross(x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  circle(0, 0, 90, C.white); ctx.fillStyle = C.red; rr(-24, -64, 48, 128, 8); ctx.fill(); rr(-64, -24, 128, 48, 8); ctx.fill();
  ctx.restore();
}
/** twisting protein ribbon along an S-curve. t animates the twist and sway */
export function protein(x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const N = 220, cols = [C.blue, '#3FB7E8', C.yellow, C.orange];
  const P = (u) => [Math.sin(u * TAU * 1.25 + t * 0.6) * 230 + Math.sin(u * 23 + t) * 26, (u - 0.5) * 900 + Math.cos(u * 23 + t) * 26];
  let prev = null;
  for (let i = 0; i <= N; i++) {
    const u = i / N, [px, py] = P(u), [qx, qy] = P(u + 0.002), dx = qx - px, dy = qy - py, dl = Math.hypot(dx, dy) || 1;
    const tw = u * 38 + t * 3, wdt = 40 * Math.cos(tw), nx = -dy / dl * wdt, ny = dx / dl * wdt;
    const cur = [px + nx, py + ny, px - nx, py - ny, Math.sin(tw)];
    if (prev) {
      ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.lineTo(cur[2], cur[3]); ctx.lineTo(prev[2], prev[3]); ctx.closePath();
      const base = cols[Math.min(3, Math.floor(u * 4))]; ctx.fillStyle = base; ctx.fill();
      if (cur[4] < 0) { ctx.fillStyle = 'rgba(14,26,43,0.28)'; ctx.fill(); }
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.5; ctx.stroke();
    }
    prev = cur;
  }
  ctx.restore();
}
/** gold medal on a ribbon (hangs from (x, y - 330) ), swing = rotation */
export function medal(x, y, s = 1, swing = 0) {
  ctx.save(); ctx.translate(x, y - 330 * s); ctx.rotate(swing); ctx.scale(s, s);
  ctx.fillStyle = C.blue; ctx.beginPath(); ctx.moveTo(-120, -200); ctx.lineTo(-30, -200); ctx.lineTo(40, 250); ctx.lineTo(-40, 250); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(120, -200); ctx.lineTo(30, -200); ctx.lineTo(-40, 250); ctx.lineTo(40, 250); ctx.closePath(); ctx.fill();
  ctx.translate(0, 330);
  circle(0, 0, 170, C.goldDark); circle(0, -6, 160, C.gold); circle(0, -6, 122, C.goldDark); circle(0, -10, 116, C.gold);
  ctx.fillStyle = C.goldDark; ctx.beginPath(); for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, R = i % 2 ? 30 : 72; ctx.lineTo(Math.cos(an) * R, -10 + Math.sin(an) * R); } ctx.closePath(); ctx.fill();
  ell(-70, -80, 34, 14, C.goldLight, -0.7);
  ctx.restore();
}
/** waving flag of vertical bands on a pole. w x h at s = 1 */
export function flag(x, y, w, h, cols, t, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-16, -20, 20, h + 520, 10); ctx.fillStyle = C.greyDark; ctx.fill(); circle(-6, -26, 18, C.gold);
  const n = 40, bw = w / cols.length;
  for (let i = 0; i < n; i++) {
    const x0 = i / n * w, x1 = (i + 1) / n * w, o0 = Math.sin(x0 * 0.012 - t * 5) * 26 * (x0 / w), o1 = Math.sin(x1 * 0.012 - t * 5) * 26 * (x1 / w);
    ctx.beginPath(); ctx.moveTo(x0, o0); ctx.lineTo(x1 + 0.8, o1); ctx.lineTo(x1 + 0.8, o1 + h); ctx.lineTo(x0, o0 + h); ctx.closePath();
    ctx.fillStyle = cols[Math.min(cols.length - 1, Math.floor(x0 / bw))]; ctx.fill();
    const sh = Math.cos(x0 * 0.012 - t * 5) * (x0 / w); if (sh < 0) { ctx.fillStyle = `rgba(14,26,43,${-sh * 0.16})`; ctx.fill(); }
  }
  ctx.restore();
}
/** padlock. open 0..1 lifts and swings the shackle */
export function lock(x, y, s = 1, open = 0, col = C.gold) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.save(); ctx.translate(60, -60 - open * 60); ctx.rotate(-open * 0.5); ctx.translate(-60, 0);
  ctx.beginPath(); ctx.arc(0, -40, 64, Math.PI, TAU); ctx.lineTo(64, open > 0 ? 10 : 60); ctx.moveTo(-64, -40); ctx.lineTo(-64, 60);
  ctx.strokeStyle = C.greyDark; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
  rr(-110, -70, 220, 190, 28); ctx.fillStyle = col; ctx.fill(); rr(-110, 60, 220, 60, [0, 0, 28, 28]); ctx.fillStyle = col === C.gold ? C.goldDark : C.greenDark; ctx.fill();
  circle(0, 10, 22, C.ink); rr(-9, 14, 18, 44, 6); ctx.fillStyle = C.ink; ctx.fill();
  ctx.restore();
}
/** laptop with screen(w, h) content */
export function laptop(x, y, s = 1, screen = null) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-170, -230, 340, 230, 18); ctx.fillStyle = C.greyDark; ctx.fill(); rr(-154, -214, 308, 198, 8); ctx.fillStyle = C.navy; ctx.fill();
  if (screen) { ctx.save(); rr(-154, -214, 308, 198, 8); ctx.clip(); ctx.translate(-154, -214); screen(308, 198); ctx.restore(); }
  ctx.beginPath(); ctx.moveTo(-200, 0); ctx.lineTo(200, 0); ctx.lineTo(220, 30); ctx.lineTo(-220, 30); ctx.closePath(); ctx.fillStyle = C.grey; ctx.fill();
  ctx.restore();
}
/** cage of bars dropping over something. origin = bottom centre */
export function cage(x, y, w, h) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = C.greyDark;
  for (let i = 0; i <= 6; i++) rr(-w / 2 + i * w / 6 - 9, -h, 18, h, 9), ctx.fill();
  rr(-w / 2 - 20, -h - 30, w + 40, 40, 14); ctx.fill(); rr(-w / 2 - 20, -18, w + 40, 30, 12); ctx.fill();
  rr(-30, -h - 80, 60, 60, 20); ctx.fill();
  ctx.restore();
}
/** five-point star */
export function star(x, y, r, col = C.yellow, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, R = i % 2 ? r * 0.42 : r; ctx.lineTo(Math.cos(an) * R, Math.sin(an) * R); }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
/** EU-style ring of 12 stars (n = how many are visible, for the build-in) */
export function starRing(x, y, R, r, n = 12, rot = 0) {
  for (let i = 0; i < Math.min(12, n); i++) { const an = -Math.PI / 2 + i * TAU / 12; star(x + Math.cos(an) * R, y + Math.sin(an) * R, r, C.yellow, rot); }
}
/** hardback rule book with a title */
export function book(x, y, s = 1, rot = 0, title = 'RULES') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-230, -300, 470, 600, 22); ctx.fillStyle = C.white; ctx.fill();
  for (let i = 0; i < 6; i++) { ctx.fillStyle = '#E6E0D2'; ctx.fillRect(220, -280 + i * 100, 16, 6); }
  rr(-250, -310, 460, 600, 22); ctx.fillStyle = C.euBlue; ctx.fill();
  rr(-250, -310, 70, 600, [22, 0, 0, 22]); ctx.fillStyle = '#162E80'; ctx.fill();
  starRing(-20, -110, 110, 22, 12);
  ctx.font = '900 64px Inter'; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  title.split('\n').forEach((s2, i) => ctx.fillText(s2, -16, 110 + i * 74));
  ctx.restore();
}
/** gavel; ang = swing (0 = resting head-down on the right) */
export function gavel(x, y, s = 1, ang = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(ang);
  rr(-20, -20, 300, 40, 18); ctx.fillStyle = C.wood; ctx.fill();
  rr(250, -90, 110, 180, 24); ctx.fillStyle = C.woodDark; ctx.fill(); rr(262, -90, 30, 180, 8); ctx.fillStyle = C.wood; ctx.fill();
  ctx.restore();
}
/** progress bar with label. p 0..1 */
export function progress(x, y, w, h, p, col = C.green, label = '') {
  rr(x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = C.white; ctx.fill();
  if (p > 0) { rr(x - w / 2 + 8, y - h / 2 + 8, Math.max(h - 16, (w - 16) * clamp(p)), h - 16, (h - 16) / 2); ctx.fillStyle = col; ctx.fill(); }
  ctx.lineWidth = 7; ctx.strokeStyle = C.ink; rr(x - w / 2, y - h / 2, w, h, h / 2); ctx.stroke();
  if (label) { ctx.font = `900 ${h * 0.42}px Inter`; ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y + 2); }
}
/** snail (slow!) facing right */
export function snail(x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const st = Math.sin(t * 4) * 6;
  rr(-120, -10, 260 + st, 50, 25); ctx.fillStyle = '#C9E07A'; ctx.fill();
  line([[110 + st, 0], [130 + st, -80]], '#C9E07A', 12); line([[90 + st, 0], [95 + st, -70]], '#C9E07A', 12);
  circle(130 + st, -84, 12, C.ink); circle(95 + st, -74, 12, C.ink);
  circle(-10, -70, 90, C.orange); ctx.beginPath(); for (let a = 0; a < 14; a += 0.2) { const r = 6 * a; ctx.lineTo(-10 + Math.cos(a) * r, -70 + Math.sin(a) * r); } ctx.strokeStyle = '#C8642A'; ctx.lineWidth = 12; ctx.stroke();
  ctx.restore();
}
/** green check mark */
export function check(x, y, s = 1, p = 1) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  circle(0, 0, 90, C.green);
  const pts = [[-44, 2], [-12, 36], [48, -32]], k = clamp(p) * 2;
  const seg1 = [pts[0], [lerp(pts[0][0], pts[1][0], Math.min(1, k)), lerp(pts[0][1], pts[1][1], Math.min(1, k))]];
  line(seg1, C.white, 22); if (k > 1) line([pts[1], [lerp(pts[1][0], pts[2][0], k - 1), lerp(pts[1][1], pts[2][1], k - 1)]], C.white, 22);
  ctx.restore();
}
/** a counting number with commas: v (0..1) of target */
export const countText = (target, v, prefix = '', suffix = '') => prefix + Math.round(target * clamp(v)).toLocaleString('en-US') + suffix;

// ═════════════ SHORT #2 PROPS: who controls AI ═════════════
/** AI accelerator card (generic GPU), 620x300 at s = 1 */
export function gpu(x, y, s = 1, rot = 0, fanT = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-310, -150, 620, 300, 26); ctx.fillStyle = '#2A2F3A'; ctx.fill();
  rr(-310, -150, 620, 60, [26, 26, 0, 0]); ctx.fillStyle = C.green; ctx.fill();
  for (const fx of [-150, 150]) { circle(fx, 30, 100, '#1B1F27'); ctx.save(); ctx.translate(fx, 30); ctx.rotate(fanT * 8); for (let i = 0; i < 7; i++) { ctx.rotate(TAU / 7); ell(0, -50, 18, 44, '#4A5160', 0.3); } ctx.restore(); circle(fx, 30, 24, C.green); }
  ctx.fillStyle = C.gold; for (let i = 0; i < 18; i++) ctx.fillRect(-240 + i * 26, 150, 16, 30);
  ctx.font = '900 40px Inter'; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('AI CHIP', 0, -120);
  ctx.restore();
}
/** pie chart: frac (0..1) of the slice drawn so far, slice share `share` */
export function pie(x, y, r, share, grow = 1, a = C.green, b = C.grey) {
  circle(x, y, r, b);
  const e = -Math.PI / 2 + TAU * share * clamp(grow);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, -Math.PI / 2, e); ctx.closePath(); ctx.fillStyle = a; ctx.fill();
  ctx.save(); ctx.globalAlpha = 0.18; circle(x - r * 0.25, y - r * 0.3, r * 0.35, C.white); ctx.restore();
}
/** chip factory (fab): long building, cleanroom windows, two stacks */
export function fab(x, y, s = 1, label = 'TSMC') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-260, -320, 70, 200, 10); ctx.fillStyle = C.greyDark; ctx.fill(); rr(190, -360, 70, 240, 10); ctx.fill();
  rr(-320, -200, 640, 200, 16); ctx.fillStyle = C.white; ctx.fill(); rr(-320, -200, 640, 50, [16, 16, 0, 0]); ctx.fillStyle = C.blue; ctx.fill();
  for (let i = 0; i < 6; i++) { rr(-280 + i * 95, -130, 70, 70, 8); ctx.fillStyle = C.sky2; ctx.fill(); }
  ctx.font = '900 40px Inter'; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, -174);
  ctx.restore();
}
/** stylised island (a leaf shape), rot tilt */
export function island(x, y, w, h, rot = -0.35, col = C.green) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.bezierCurveTo(w * 0.6, -h * 0.35, w * 0.55, h * 0.3, 0, h / 2); ctx.bezierCurveTo(-w * 0.5, h * 0.25, -w * 0.45, -h * 0.3, 0, -h / 2); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
/** big lithography machine with a beam (on 0..1) */
export function machine(x, y, s = 1, t = 0, on = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-360, -300, 720, 420, 30); ctx.fillStyle = C.white; ctx.fill(); rr(-360, -300, 720, 90, [30, 30, 0, 0]); ctx.fillStyle = C.blue; ctx.fill();
  rr(140, -180, 180, 120, 14); ctx.fillStyle = C.navy; ctx.fill(); for (let i = 0; i < 3; i++) { ctx.fillStyle = [C.green, C.yellow, C.red][i]; ctx.fillRect(160 + i * 50, -150, 30, 14); }
  rr(-120, 120, 240, 60, 10); ctx.fillStyle = C.greyDark; ctx.fill();
  if (on > 0) { ctx.save(); ctx.globalAlpha = on * (0.7 + 0.3 * Math.sin(t * 30)); ctx.fillStyle = '#B57BFF'; ctx.beginPath(); ctx.moveTo(-30, 180); ctx.lineTo(30, 180); ctx.lineTo(60, 330); ctx.lineTo(-60, 330); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ell(0, 350, 230, 50, '#C8CDD8'); ell(0, 344, 210, 42, '#9FA8B8');
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 344, 210, 42, 0, 0, TAU); ctx.clip(); ctx.strokeStyle = C.gold; ctx.lineWidth = 3; for (let i = -200; i <= 200; i += 30) { ctx.beginPath(); ctx.moveTo(i, 300); ctx.lineTo(i, 390); ctx.stroke(); } for (let j = 310; j < 390; j += 14) { ctx.beginPath(); ctx.moveTo(-220, j); ctx.lineTo(220, j); ctx.stroke(); } ctx.restore();
  ctx.font = '900 54px Inter'; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EUV MACHINE', 0, -254);
  ctx.restore();
}
/** money bag with $ */
export function moneyBag(x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ell(0, 60, 200, 190, C.green); ell(-60, 0, 50, 90, '#56C26F', -0.3);
  ctx.beginPath(); ctx.moveTo(-70, -110); ctx.lineTo(70, -110); ctx.lineTo(110, -190); ctx.lineTo(-110, -190); ctx.closePath(); ctx.fillStyle = C.green; ctx.fill();
  rr(-90, -125, 180, 34, 14); ctx.fillStyle = C.goldDark; ctx.fill();
  ctx.font = '900 180px Inter'; ctx.fillStyle = C.goldLight; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 80);
  ctx.restore();
}
/** stack of n bills */
export function cash(x, y, n, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let i = 0; i < n; i++) { const yy = -i * 26, ox = Math.sin(i * 1.7) * 10; rr(-170 + ox, yy - 22, 340, 44, 6); ctx.fillStyle = i % 2 ? '#7FCF8E' : '#6BBF7C'; ctx.fill(); rr(-150 + ox, yy - 14, 300, 28, 4); ctx.strokeStyle = '#3E8E50'; ctx.lineWidth = 3; ctx.stroke(); circle(ox, yy, 11, '#3E8E50'); }
  ctx.restore();
}
/** vertical bar with value label */
export function bar(x, base, w, h, col, val, label, a = 1) {
  if (h <= 0) return;
  rr(x - w / 2, base - h, w, h, [16, 16, 0, 0]); ctx.fillStyle = col; ctx.fill();
  ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = C.white; ctx.fillRect(x - w / 2 + 14, base - h + 14, 22, h - 28 > 0 ? h - 28 : 0); ctx.restore();
  ctx.globalAlpha = a; ctx.font = '900 46px Inter'; ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, base + 40); ctx.globalAlpha = 1;
}
/** simple flags (rect, flat) */
export function flagUS(x, y, w, h) {
  ctx.save(); ctx.translate(x, y);
  for (let i = 0; i < 13; i++) { ctx.fillStyle = i % 2 ? C.white : C.itRed; ctx.fillRect(0, i * h / 13, w, h / 13 + 0.5); }
  ctx.fillStyle = '#2B3F8C'; ctx.fillRect(0, 0, w * 0.42, h * 7 / 13);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) star(w * 0.06 + c * w * 0.075, h * 0.07 + r * h * 0.12, w * 0.022, C.white);
  ctx.restore();
}
export function flagCN(x, y, w, h) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#DE2910'; ctx.fillRect(0, 0, w, h);
  star(w * 0.17, h * 0.27, h * 0.16, '#FFDE00');
  [[0.33, 0.1], [0.4, 0.2], [0.4, 0.35], [0.33, 0.45]].forEach(([a, b]) => star(w * a, h * b, h * 0.055, '#FFDE00', 0.4));
  ctx.restore();
}
/** parchment scroll / list. lines = [[text, revealed 0..1, color]] */
export function scroll(x, y, w, h, title, lines, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = '#FFF1C9'; ctx.fillRect(-w / 2, -h / 2, w, h);
  for (const yy of [-h / 2, h / 2]) { rr(-w / 2 - 30, yy - 28, w + 60, 56, 28); ctx.fillStyle = '#E8C77A'; ctx.fill(); }
  ctx.font = '900 64px Inter'; ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(title, 0, -h / 2 + 90);
  ctx.textAlign = 'left'; ctx.font = '900 56px Inter';
  lines.forEach(([tx, k, col], i) => { if (k <= 0) return; ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.fillStyle = col || C.ink; ctx.fillText(tx, -w / 2 + 50 + (1 - eob(clamp(k))) * -60, -h / 2 + 200 + i * 100); ctx.restore(); });
  ctx.restore();
}
/** wrapped gift box */
export function gift(x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-80, -60, 160, 130, 10); ctx.fillStyle = C.red; ctx.fill(); rr(-90, -80, 180, 40, 8); ctx.fillStyle = '#E64553'; ctx.fill();
  ctx.fillStyle = C.yellow; ctx.fillRect(-14, -80, 28, 150);
  ell(-30, -96, 32, 18, C.yellow, 0.4); ell(30, -96, 32, 18, C.yellow, -0.4);
  ctx.restore();
}
/** government building (dome) */
export function capitol(x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = C.stoneDark; ctx.fillRect(-360, -40, 720, 40); ctx.fillStyle = C.stone; ctx.fillRect(-330, -300, 660, 260);
  for (let i = 0; i < 7; i++) { ctx.fillStyle = '#DCD2BA'; ctx.fillRect(-300 + i * 96, -280, 40, 230); }
  ctx.fillStyle = C.stone; ctx.fillRect(-180, -380, 360, 80); ctx.beginPath(); ctx.arc(0, -380, 170, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = C.stoneDark; ctx.beginPath(); ctx.arc(0, -380, 130, Math.PI, TAU); ctx.fill(); rr(-16, -600, 32, 70, 8); ctx.fillStyle = C.stone; ctx.fill();
  ctx.restore();
}

// ═════════════ SHORT #3 PROPS: 7 AI models ═════════════
/** listicle tracker: n dots, current i (1-based) highlighted */
export function tracker(i, n = 7, y = 110) {
  for (let k = 1; k <= n; k++) {
    const x = 540 + (k - (n + 1) / 2) * 92, cur = k === i, done = k < i;
    circle(x + 4, y + 5, cur ? 36 : 28, C.ink); circle(x, y, cur ? 36 : 28, cur ? C.yellow : done ? C.green : C.white);
    ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, cur ? 36 : 28, 0, TAU); ctx.stroke();
    ctx.font = `900 ${cur ? 40 : 30}px Inter`; ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(k), x, y + 2);
  }
}
/** PRO / CON badge */
export function badge(kind, x, y, sc = 1) {
  if (sc <= 0) return;
  const pro = kind === 'pro';
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(pro ? -0.04 : 0.04);
  rr(-170 + 10, -62 + 12, 340, 124, 62); ctx.fillStyle = C.ink; ctx.fill();
  rr(-170, -62, 340, 124, 62); ctx.fillStyle = pro ? C.green : C.red; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
  circle(-100, 0, 40, C.white);
  ctx.strokeStyle = pro ? C.green : C.red; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath();
  if (pro) { ctx.moveTo(-120, 0); ctx.lineTo(-104, 18); ctx.lineTo(-78, -16); } else { ctx.moveTo(-116, -16); ctx.lineTo(-84, 16); ctx.moveTo(-84, -16); ctx.lineTo(-116, 16); }
  ctx.stroke();
  ctx.font = '900 70px Inter'; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pro ? 'PRO' : 'CON', 40, 4);
  ctx.restore();
}
/** document page with lines; long = taller */
export function doc(x, y, s = 1, rot = 0, h = 300, col = C.blue) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-110, -h / 2, 220, h, 14); ctx.fillStyle = C.white; ctx.fill();
  ctx.fillStyle = col; ctx.fillRect(-110, -h / 2, 220, 40);
  ctx.fillStyle = '#C9CFDA'; for (let yy = -h / 2 + 70; yy < h / 2 - 20; yy += 34) ctx.fillRect(-80, yy, 160 - ((yy * 7) % 50), 12);
  ctx.restore();
}
/** magnifier */
export function magnifier(x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line([[60, 60], [150, 150]], C.greyDark, 40); circle(0, 0, 100, C.greyDark); circle(0, 0, 76, '#DDF0FF'); ell(-28, -30, 26, 14, C.white, -0.6);
  ctx.restore();
}
/** code window */
export function codeWin(x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-260, -200, 520, 400, 24); ctx.fillStyle = '#1E2230'; ctx.fill(); rr(-260, -200, 520, 56, [24, 24, 0, 0]); ctx.fillStyle = '#2E3446'; ctx.fill();
  [C.red, C.yellow, C.green].forEach((c, i) => circle(-220 + i * 40, -172, 12, c));
  const cols = [C.purpleLight, C.sky2, C.goldLight, C.green, C.orange], rows = Math.floor(clamp(t) * 8);
  for (let r = 0; r < rows; r++) { let xx = -220 + (r % 3) * 30; for (let k = 0; k < 3; k++) { const w = 40 + ((r * 7 + k * 13) % 90); ctx.fillStyle = cols[(r + k) % 5]; ctx.fillRect(xx, -120 + r * 38, w, 18); xx += w + 16; } }
  ctx.restore();
}
/** framed picture (landscape); slashed with a no-sign or paused */
export function picture(x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-200, -150, 400, 300, 12); ctx.fillStyle = C.wood; ctx.fill(); rr(-176, -126, 352, 252, 6); ctx.fillStyle = C.sky2; ctx.fill();
  ctx.save(); rr(-176, -126, 352, 252, 6); ctx.clip(); circle(100, -50, 40, C.yellow);
  ctx.beginPath(); ctx.moveTo(-180, 130); ctx.lineTo(-60, -10); ctx.lineTo(40, 90); ctx.lineTo(110, 30); ctx.lineTo(190, 130); ctx.closePath(); ctx.fillStyle = C.green; ctx.fill(); ctx.restore();
  ctx.restore();
}
/** price tag with text */
export function priceTag(text, x, y, s = 1, rot = -0.15, col = C.yellow) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-200, -80); ctx.lineTo(150, -80); ctx.lineTo(230, 0); ctx.lineTo(150, 80); ctx.lineTo(-200, 80); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  circle(150, 0, 18, C.white);
  ctx.font = '900 70px Inter'; ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, -30, 4);
  ctx.restore();
}
/** social feed card */
export function post(x, y, w, s = 1, tint = '#E8ECF3') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-w / 2, -60, w, 120, 20); ctx.fillStyle = C.white; ctx.fill();
  circle(-w / 2 + 50, -10, 30, tint); ctx.fillStyle = '#C9CFDA'; ctx.fillRect(-w / 2 + 100, -30, w * 0.5, 14); ctx.fillRect(-w / 2 + 100, 0, w * 0.35, 12); ctx.fillRect(-w / 2 + 100, 24, w * 0.42, 12);
  ctx.restore();
}
/** lightning bolt */
export function bolt(x, y, s = 1, col = C.yellow) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath();
  ctx.moveTo(30, -200); ctx.lineTo(-110, 30); ctx.lineTo(-10, 30); ctx.lineTo(-50, 200); ctx.lineTo(110, -40); ctx.lineTo(10, -40); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
/** comment bubble icon with dots */
export function commentIcon(x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-150, -100, 300, 180, 40); ctx.fillStyle = C.white; ctx.fill(); ctx.beginPath(); ctx.moveTo(-60, 78); ctx.lineTo(-110, 140); ctx.lineTo(-10, 78); ctx.fill();
  for (let i = -1; i <= 1; i++) circle(i * 70, -10, 20, C.blue);
  ctx.restore();
}

// ═════════════ SHORT #3: the two hosts (PRO and CON) ═════════════
/** half-body host girl. origin = desk-top centre. o: { kind:'pro'|'con', mouth 0..1, blink 0..1, arms:[l,r] (rad from down, + = outward/up),
 *  fore:[l,r] elbow bend, look -1..1, brow 0..1 (raised/skeptical), cross: arms crossed, smile } */
export function host(x, y, s = 1, o = {}) {
  const pro = o.kind !== 'con', skin = pro ? '#F2C4A0' : '#E3B08E', hair = pro ? '#C0562A' : '#22202A', hairHi = pro ? '#E07A3E' : '#3C3848';
  const shirt = pro ? C.green : C.red, shirtD = pro ? C.greenDark : C.redDark;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const HY = -365;
  // back hair
  if (pro) { ell(0, HY - 10, 165, 170, hair); ell(-140, HY + 120, 60, 120, hair); ell(140, HY + 120, 60, 120, hair); circle(0, HY - 165, 60, hair); }
  else { rr(-150, HY - 150, 300, 300, [140, 140, 30, 30]); ctx.fillStyle = hair; ctx.fill(); }
  // torso
  ctx.beginPath(); ctx.moveTo(-170, 10); ctx.lineTo(-155, -190); ctx.quadraticCurveTo(-150, -235, -95, -240); ctx.lineTo(95, -240); ctx.quadraticCurveTo(150, -235, 155, -190); ctx.lineTo(170, 10); ctx.closePath();
  ctx.fillStyle = shirt; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-40, -240); ctx.lineTo(0, -195); ctx.lineTo(40, -240); ctx.closePath(); ctx.fillStyle = skin; ctx.fill();
  ctx.font = '900 66px Inter'; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.label ?? (pro ? 'PRO' : 'CON'), 0, -150);
  // neck + head
  rr(-34, HY + 60, 68, 90, 20); ctx.fillStyle = skin; ctx.fill();
  ell(-118, HY + 10, 22, 30, skin); ell(118, HY + 10, 22, 30, skin);
  ell(0, HY, 120, 128, skin);
  ell(-118, HY + 40, 9, 9, pro ? C.yellow : C.cyan); ell(118, HY + 40, 9, 9, pro ? C.yellow : C.cyan); // earrings
  // eyes
  const ey = HY + 5, lk = (o.look || 0) * 9, bl = 1 - clamp(o.blink || 0);
  for (const sd of [-1, 1]) {
    const ex = sd * 46;
    ell(ex, ey, 25, 30 * bl + 1, C.white);
    if (bl > 0.2) { ell(ex + lk, ey + 4, 15, 18 * bl, pro ? '#5A3A22' : '#2E4A7A'); circle(ex + lk, ey + 4, 8 * bl, C.ink); circle(ex + lk + 5, ey - 3, 4, C.white); }
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(ex, ey, 25, 30 * bl + 1, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();   // lid line
    for (let k = 0; k < 3; k++) { const a = Math.PI * (1.62 + k * 0.13) + (sd < 0 ? -0.0 : 0); const ax = ex + sd * Math.cos(Math.PI * (1.25 - k * 0.12)) * -26, ay = ey - 26 * bl + k * 4; line([[ax, ay], [ax + sd * 14, ay - 12]], C.ink, 5); }
    // brows
    const br = (o.brow || 0) * (sd > 0 ? 1 : 0.3), by = ey - 52 - br * 18;
    line([[ex - 26, by + (pro ? 4 : sd * 6)], [ex + 26, by + (pro ? 4 : -sd * 6) - br * 6]], hair, 10);
  }
  // cheeks, nose, mouth
  ell(-72, HY + 55, 22, 12, 'rgba(232,96,120,0.45)'); ell(72, HY + 55, 22, 12, 'rgba(232,96,120,0.45)');
  line([[0, HY + 30], [-6, HY + 48], [4, HY + 50]], C.skinShade, 5);
  const m = clamp(o.mouth || 0), my = HY + 82;
  if (m > 0.08) { ell(0, my + 6 * m, 28 + 6 * m, 8 + 26 * m, C.mouth); ell(0, my + 18 * m, 16, 8 * m, C.pink); ctx.lineWidth = 5; ctx.strokeStyle = '#D9506A'; ctx.beginPath(); ctx.ellipse(0, my + 6 * m, 28 + 6 * m, 8 + 26 * m, 0, 0, TAU); ctx.stroke(); }
  else { ctx.strokeStyle = '#D9506A'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); const sm = o.smile ?? (pro ? 1 : 0.2); if (sm > 0.5) ctx.arc(0, my - 18, 30, 0.2 * Math.PI, 0.8 * Math.PI); else { ctx.moveTo(-24, my + 2); ctx.quadraticCurveTo(0, my - 4 + sm * 10, 26, my - 6); } ctx.stroke(); }
  // front hair
  if (pro) { ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(-125, HY - 10); ctx.quadraticCurveTo(-110, HY - 150, 10, HY - 135); ctx.quadraticCurveTo(-40, HY - 80, -125, HY - 10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(125, HY - 20); ctx.quadraticCurveTo(110, HY - 140, -10, HY - 135); ctx.quadraticCurveTo(60, HY - 100, 125, HY - 20); ctx.fill();
    rr(-120, HY - 128, 240, 26, 13); ctx.fillStyle = C.yellow; ctx.fill(); ell(-60, HY - 145, 30, 12, hairHi, -0.3); }
  else { ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(-128, HY - 30); ctx.quadraticCurveTo(-120, HY - 140, 0, HY - 140); ctx.quadraticCurveTo(120, HY - 140, 128, HY - 30); ctx.lineTo(128, HY - 50); ctx.lineTo(-128, HY - 50); ctx.closePath(); ctx.fill();
    ctx.fillRect(-128, HY - 70, 256, 26); ell(50, HY - 120, 36, 10, hairHi, 0.2);
    // cat-eye glasses
    ctx.lineWidth = 9; ctx.strokeStyle = C.ink;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.roundRect(sd * 46 - 40, ey - 36, 80, 70, 22); ctx.stroke(); line([[sd * 86, ey - 30], [sd * 104, ey - 44]], C.ink, 9); }
    line([[-6, ey - 8], [6, ey - 8]], C.ink, 8); }
  // arms
  const arm = (sd, a, f) => {
    const sx = sd * 140, sy = -205, L1 = 120, L2 = 110;
    const ex = sx + sd * Math.sin(a) * L1, ey2 = sy + Math.cos(a) * L1;
    const a2 = a + f, hx = ex + sd * Math.sin(a2) * L2, hy = ey2 + Math.cos(a2) * L2;
    line([[sx, sy], [ex, ey2], [hx, hy]], shirtD, 46); line([[sx, sy], [ex, ey2]], shirt, 46);
    circle(hx, hy, 28, skin);
  };
  if (o.cross) { // crossed arms in front of chest
    rr(-150, -95, 300, 70, 35); ctx.fillStyle = shirtD; ctx.fill(); rr(-150, -78, 300, 62, 31); ctx.fillStyle = shirt; ctx.fill();
    circle(-128, -55, 26, skin); circle(128, -72, 26, skin);
  } else { const A = o.arms || [0.15, 0.15], F = o.fore || [0.2, 0.2]; arm(-1, A[0], F[0]); arm(1, A[1], F[1]); }
  ctx.restore();
}
/** podium in front of a host. origin = desk-top centre */
export function podium(x, y, kind, s = 1, glow = 0) {
  const pro = kind === 'pro';
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-200, 0); ctx.lineTo(200, 0); ctx.lineTo(170, 230); ctx.lineTo(-170, 230); ctx.closePath(); ctx.fillStyle = pro ? C.greenDark : C.redDark; ctx.fill();
  rr(-215, -22, 430, 40, 12); ctx.fillStyle = C.wood; ctx.fill();
  rr(-130, 50, 260, 110, 18); ctx.fillStyle = glow ? C.yellow : C.white; ctx.fill();
  ctx.font = '900 50px Inter'; ctx.fillStyle = pro ? C.greenDark : C.redDark; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pro ? 'TEAM PRO' : 'TEAM CON', 0, 108);
  ctx.restore();
}
export function flagFR(x, y, w, h) { const c = ['#1F3FA8', '#FFFFFF', '#E1262D']; c.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(x - w / 2 + i * w / 3, y - h / 2, w / 3 + 1, h); }); }
