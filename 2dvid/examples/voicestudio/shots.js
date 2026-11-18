// THIS FREE APP JUST REPLACED PAID AI VOICE TOOLS. Short #4: free AI tool reveal (VoiceStudio), comic style.
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, TAU, circle, ell, line, rr } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as M from './core/comic.js';

const ENV = await (await fetch('data/env.json', { cache: 'no-store' })).json();
const env = (t) => { const f = t * 30, i = Math.floor(f); return lerp(ENV[i] || 0, ENV[i + 1] || 0, f - i); };
const PINK = '#993F61', PINKL = '#C8668C';

// ── local props ──
function mic(x, y, s = 1, t = 0, talk = 0, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  rr(-20, 150, 40, 140, 12); ctx.fillStyle = C.greyDark; ctx.fill(); rr(-110, 280, 220, 40, 20); ctx.fill();
  ctx.lineWidth = 22; ctx.strokeStyle = C.greyDark; ctx.beginPath(); ctx.arc(0, 40, 150, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
  rr(-110, -220, 220, 340, 110); ctx.fillStyle = PINK; ctx.fill();
  ctx.save(); rr(-110, -220, 220, 340, 110); ctx.clip(); ctx.fillStyle = PINKL; for (let i = -4; i <= 4; i++) ctx.fillRect(i * 40 - 6, -230, 12, 200); ctx.restore();
  rr(-110, -40, 220, 40, 8); ctx.fillStyle = '#6E2A45'; ctx.fill();
  // face
  for (const sd of [-1, 1]) { ell(sd * 42, 50, 20, 24, C.white); circle(sd * 42 + (o.look || 0) * 5, 54, 10, C.ink); circle(sd * 42 + 4, 48, 4, C.white); }
  const m = clamp(talk); if (m > 0.1) ell(0, 96, 22, 6 + 16 * m, C.ink); else { ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(0, 82, 22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  ctx.restore();
}
function wave(x, y, w, amp, t, col = PINK, n = 26, seed = 0) {
  for (let i = 0; i < n; i++) {
    const xx = x - w / 2 + (i + 0.5) * w / n, h = amp * (0.25 + 0.75 * Math.abs(Math.sin(i * 0.9 + seed + t * 9) * Math.cos(i * 0.37 + t * 4 + seed)));
    rr(xx - w / n * 0.3, y - h / 2, w / n * 0.6, h, w / n * 0.3); ctx.fillStyle = col; ctx.fill();
  }
}
function arrow(x0, y0, x1, y1, p, col = C.ink) {
  if (p <= 0) return; const x = lerp(x0, x1, p), y = lerp(y0, y1, p), a = Math.atan2(y1 - y0, x1 - x0);
  line([[x0, y0], [x, y]], col, 18); ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-20, -30); ctx.lineTo(-20, 30); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
function appScreen(w, h, t) { ctx.fillStyle = '#1E1B22'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = PINK; ctx.fillRect(0, 0, w, h * 0.14); ctx.font = `900 ${h * 0.08}px Inter`; ctx.fillStyle = C.white; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('VoiceStudio', w * 0.05, h * 0.07); wave(w / 2, h * 0.58, w * 0.85, h * 0.5, t, PINKL); }

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const pop = (lt, a, d = 0.25) => (lt < a ? 0 : eob(seg(lt, a, a + d)));
  const W_ = (w, i) => Wd(w, i) - cut(i);
  const talk = (t) => clamp(env(t) * 1.3);
  const shot = (i, note, bg, fn, o = {}) => {
    add({ id: `S${String(i).padStart(2, '0')}`, at: cut(i), cam: o.cam || [540, 800], zoom: o.zoom ?? 0.06, note,
      draw(lt, d, t) { bg(lt, t); fn(lt, t); if (o.src) M.source(o.src, pop(lt, 0.3, 0.3), 170); } });
    cue(cut(i), o.sfx || (i % 2 ? 'whoosh' : 'zip'), { gain: 0.45 });
  };
  const burst = (a, b) => (lt) => M.sunburst(540, 780, a, b, lt * 0.25);
  const paper = () => M.paper();
  const SRC = 'github.com/debpalash/VoiceStudio';

  // 0 · hook: free app clones, dubs, narrates
  shot(0, 'mic mascot + FREE + three ability badges', burst('#FFE3EE', '#FFC9DD'), (lt, t) => {
    M.inked(() => mic(540, 690, 1.15, t, talk(t), { rot: Math.sin(t * 3) * 0.05 }), 7, 0.25);
    M.sfx('FREE!', 820, 420, 150, pop(lt, W_('free', 0) - 0.1), 0.15, C.yellow, C.red);
    [['CLONE', 220, 'voices'], ['DUB', 540, 'videos'], ['NARRATE', 860, 'audiobooks']].forEach(([lab, x, w]) => M.box(lab, x, 1190, 54, pop(lt, W_(w, 0) - 0.15), PINK, C.white, -0.02));
  });
  cue(Wd('free', 0), 'pop', { gain: 0.6 });
  // 1 · runs on your own computer
  shot(1, 'laptop running the app + lock', paper, (lt, t) => {
    M.inked(() => M.laptop(540, 950, 2.0, (w, h) => appScreen(w, h, t)), 7, 0.25);
    M.inked(() => M.lock(860, 520, 0.9 * pop(lt, W_('own', 1) - 0.1), 0), 6, 0.2);
    M.box('YOUR COMPUTER', 420, 360, 60, pop(lt, W_('computer', 1) - 0.1), C.yellow, C.ink);
  });
  // 2 · it's called VoiceStudio
  shot(2, 'logo reveal', burst(C.yellow, C.goldLight), (lt, t) => {
    M.focusLines(540, 760, 260, 0.5);
    M.inked(() => mic(540, 680, 0.85 * pop(lt, 0.05, 0.35), t, talk(t)), 6, 0.25);
    M.bigInk('VoiceStudio', 540, 1110, 150, PINKL, -0.05, pop(lt, W_('voicestudio', 2) - 0.15, 0.3));
  }, { src: SRC, sfx: 'slam' });
  // 3 · 112K stars in ~7 months
  shot(3, 'star counter + 7 months', burst('#FFF2C2', '#FFE58A'), (lt, t) => {
    const k = seg(lt, W_('one', 3), W_('thousand', 3) + 0.5);
    M.inked(() => M.star(540, 640, 230 * pop(lt, 0.05, 0.35), C.yellow, Math.sin(t * 2) * 0.08), 7, 0.25);
    M.bigInk(M.countText(112000, eo(k), '', ''), 540, 950, 170, C.white, -0.04, pop(lt, W_('one', 3) - 0.1));
    M.box('GITHUB STARS', 540, 1090, 54, pop(lt, W_('github', 3) - 0.1), C.ink, C.white);
    M.sfx('7 MONTHS', 830, 340, 140, pop(lt, W_('seven', 3) - 0.1), 0.12, C.white, PINK, 46);
  }, { src: 'GitHub, 17 Nov 2026' });
  cue(L(3) + W_('seven', 3), 'pop', { gain: 0.5 });
  // 4 · clone a voice from a recording
  shot(4, 'recording waveform -> cloned waveform', paper, (lt, t) => {
    M.inked(() => { rr(80, 520, 380, 280, 40); ctx.fillStyle = C.white; ctx.fill(); wave(270, 660, 300, 180, t, C.blue, 16, 1); }, 6, 0.2);
    M.box('YOUR RECORDING', 270, 870, 40, pop(lt, W_('recording', 4) - 0.1), C.blue, C.white);
    arrow(480, 660, 600, 660, seg(lt, 0.4, 0.9));
    const k = pop(lt, 0.8, 0.3);
    if (k > 0) M.inked(() => { ctx.save(); ctx.translate(810, 660); ctx.scale(k, k); rr(-190, -140, 380, 280, 40); ctx.fillStyle = C.white; ctx.fill(); wave(0, 0, 300, 180, t + 0.3, PINK, 16, 1); ctx.restore(); }, 6, 0.2);
    M.box('CLONED', 810, 870, 40, pop(lt, 0.9), PINK, C.white);
    M.inked(() => mic(540, 1130, 0.55, t, talk(t)), 5, 0.2);
  }, { src: SRC });
  // 5 · describe a voice in words
  shot(5, 'typed description bubble -> new voice', burst('#E6F0FF', '#CFE0FF'), (lt, t) => {
    const txt = '"A warm, deep\nstoryteller voice"', n = Math.floor(seg(lt, 0.2, 1.4) * txt.length);
    M.bubble(540, 520, 820, 330, 420, 760, pop(lt, 0.05, 0.3), false, () => { ctx.font = '900 62px Inter'; ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; txt.slice(0, n).split('\n').forEach((s, i) => ctx.fillText(s, 0, (i - 0.5) * 80)); });
    M.inked(() => mic(540, 1000, 0.75, t, talk(t)), 6, 0.2);
    M.sfx('POOF!', 840, 900, 120, pop(lt, W_('builds', 5) - 0.1), -0.1, C.yellow, PINK);
  }, { src: SRC });
  // 6 · dub videos into other languages
  shot(6, 'monitor with video + language bubbles', paper, (lt, t) => {
    M.inked(() => M.monitor(540, 700, 0.95, (w, h) => { ctx.fillStyle = '#2A3550'; ctx.fillRect(0, 0, w, h); ctx.beginPath(); ctx.moveTo(w / 2 - 60, h / 2 - 80); ctx.lineTo(w / 2 + 90, h / 2); ctx.lineTo(w / 2 - 60, h / 2 + 80); ctx.closePath(); ctx.fillStyle = C.white; ctx.fill(); ctx.fillStyle = PINK; ctx.fillRect(40, h - 60, (w - 80) * seg(lt, 0, 3.5), 18); }), 6, 0.2);
    [['Hola!', 200, 330, 'languages'], ['Bonjour!', 860, 360, 'languages'], ['مرحبا!', 220, 1150, 'timed'], ['Ciao!', 860, 1150, 'timed']].forEach(([s, x, y, w], k) => M.bubble(x, y, 300, 150, x < 540 ? 330 : 750, y < 700 ? 480 : 900, pop(lt, W_(w, 6) - 0.2 + k * 0.12), false, s));
  }, { src: SRC });
  // 7 · dictate, transcribe, narrate audiobooks
  shot(7, 'mic -> doc -> audiobook', burst('#E9FBEF', '#C9F0D6'), (lt, t) => {
    const it = [['dictate', 200, () => mic(0, 0, 0.6, t, talk(t)), 'DICTATE'], ['transcribe', 540, () => M.doc(0, 0, 1.1, 0.04, 360, C.green), 'TRANSCRIBE'], ['audiobooks', 870, () => M.book(0, 0, 0.55, -0.05, 'AUDIO\nBOOK'), 'NARRATE']];
    for (const [w, x, fn, lab] of it) { const k = pop(lt, W_(w, 7) - 0.15); if (k <= 0) continue; ctx.save(); ctx.translate(x, 740); ctx.scale(k, k); M.inked(fn, 6, 0.2); ctx.restore(); M.box(lab, x, 1040, 44, k, C.green, C.white); }
  }, { src: SRC });
  // 8 · 646 languages
  shot(8, 'spinning globe + 646', burst(C.yellow, C.goldLight), (lt, t) => {
    M.inked(() => M.globe(540, 640, 270, t * 0.08), 7, 0.25);
    M.bigInk('646', 540, 1050, 260, C.white, -0.05, pop(lt, W_('six', 8) - 0.1, 0.3));
  }, { src: SRC, sfx: 'slam' });
  // 9 · no account, no subscription, your hardware
  shot(9, 'crossed-out card + NO ACCOUNT stamps', paper, (lt, t) => {
    M.inked(() => M.card(540, 600, 1.0, -0.06), 6, 0.2);
    M.noSign(540, 600, 260, pop(lt, W_('subscription', 9) - 0.15, 0.25));
    M.stamp('NO ACCOUNT', 540, 330, 70, pop(lt, W_('account', 9) - 0.1, 0.2), -0.1, C.red);
    M.inked(() => M.laptop(540, 1170, 1.0, (w, h) => appScreen(w, h, t)), 5, 0.2);
    M.check(820, 1000, 0.8, seg(lt, W_('hardware', 9) - 0.2, W_('hardware', 9) + 0.3));
  }, { src: 'VoiceStudio README: "needs no account"' });
  cue(L(9) + W_('subscription', 9), 'thud', { gain: 0.6 });
  // 10 · Mac, Windows, Linux, phones
  shot(10, 'four devices pop in', burst('#F0E8FF', '#DCCFFF'), (lt, t) => {
    const it = [['mac', 280, 560, () => M.laptop(0, 80, 1.0, (w, h) => appScreen(w, h, t)), 'MAC'], ['windows', 800, 560, () => M.monitor(0, -40, 0.42, (w, h) => appScreen(w, h, t)), 'WINDOWS'], ['linux', 280, 1000, () => M.laptop(0, 80, 1.0, (w, h) => appScreen(w, h, t + 1)), 'LINUX'], ['phones', 800, 1000, () => M.phone(0, 0, 0.42, 0, (w, h) => appScreen(w, h, t)), 'PHONES']];
    for (const [w, x, y, fn, lab] of it) { const k = pop(lt, W_(w, 10) - 0.15); if (k <= 0) continue; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); M.inked(fn, 5, 0.2); ctx.restore(); M.box(lab, x, y + 190, 44, k, C.purple, C.white); }
  }, { src: SRC });
  // 11 · permission rule
  shot(11, 'shield + ONLY WITH PERMISSION', paper, (lt, t) => {
    M.inked(() => M.shield(540, 720, 1.4 * pop(lt, 0.05, 0.35), 0, '', 0), 7, 0.25);
    M.check(540, 700, 1.3, seg(lt, W_('permission', 11) - 0.3, W_('permission', 11) + 0.3));
    M.box('ONE RULE', 540, 330, 66, pop(lt, W_('rule', 11) - 0.1), C.yellow, C.ink);
    M.stamp('ONLY WITH PERMISSION', 540, 1130, 54, pop(lt, W_('permission', 11), 0.2), -0.06, C.green);
  }, { src: 'VoiceStudio: cloning with consent' });
  // 12 · save + comment next tool
  shot(12, 'presenter + bookmark + comment', burst('#FFE3EE', '#FFC9DD'), (lt, t) => {
    const g = Math.sin(t * 4);
    M.inked(() => M.host(540, 1260, 1.15, { kind: 'pro', label: 'AI', mouth: talk(t), arms: [0.3, 2.3 + 0.3 * g], fore: [0.6, 0.5], look: 0.2 * Math.sin(t) }), 7, 0.25);
    const kb = pop(lt, W_('save', 12) - 0.1);
    if (kb > 0) M.inked(() => { ctx.save(); ctx.translate(250, 420); ctx.scale(kb, kb); ctx.beginPath(); ctx.moveTo(-90, -130); ctx.lineTo(90, -130); ctx.lineTo(90, 140); ctx.lineTo(0, 70); ctx.lineTo(-90, 140); ctx.closePath(); ctx.fillStyle = C.yellow; ctx.fill(); ctx.font = '900 46px Inter'; ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText('SAVE', 0, -20); ctx.restore(); }, 6, 0.2);
    M.inked(() => M.commentIcon(820, 420, 0.95 * pop(lt, W_('comment', 12) - 0.2)), 6, 0.2);
    M.box('NEXT TOOL?', 820, 600, 46, pop(lt, W_('next', 12) - 0.2), PINK, C.white);
  });
  cue(L(12) + W_('comment', 12), 'pop', { gain: 0.6 });
  return { shots: S, cues: CUES };
}
