// PRO vs CON: 7 AI MODELS. Short #3: a talk-show debate between two hosts, comic style.
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, TAU, circle, line, rr } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as M from './core/comic.js';

const ENV = await (await fetch('data/env.json', { cache: 'no-store' })).json();
const env = (t) => { const f = t * 30, i = Math.floor(f); return lerp(ENV[i] || 0, ENV[i + 1] || 0, f - i); };

const WHO = () => T.lines.map((l) => l.who);
const speaker = (t) => { for (const l of T.lines) if (t >= l.start - 0.05 && t <= l.end + 0.05) return l.who; return null; };
const lastSpeaker = (t) => { let w = 'pro'; for (const l of T.lines) if (l.start <= t) w = l.who; return w; };

const DY = 1235, PX = 280, CX = 800, HS = 0.9;

function background(t, who) {
  ctx.fillStyle = '#DDF2E1'; ctx.fillRect(-200, -200, W + 400, H + 400);
  ctx.save(); ctx.beginPath(); ctx.moveTo(610, -200); ctx.lineTo(W + 200, -200); ctx.lineTo(W + 200, H + 200); ctx.lineTo(470, H + 200); ctx.closePath(); ctx.clip();
  ctx.fillStyle = '#FBE1DF'; ctx.fillRect(-200, -200, W + 400, H + 400);
  if (who === 'con') M.sunburst(CX, 950, '#FBE1DF', '#F6C9C4', t * 0.25);
  M.halftone(980, 1700, 380, '#F2B8B2', 30, 10, 0.8);
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.moveTo(-200, -200); ctx.lineTo(610, -200); ctx.lineTo(470, H + 200); ctx.lineTo(-200, H + 200); ctx.closePath(); ctx.clip();
  if (who === 'pro') M.sunburst(PX, 950, '#DDF2E1', '#C3E8CB', t * 0.25);
  M.halftone(100, 1700, 380, '#B6DFBF', 30, 10, 0.8);
  ctx.restore();
  line([[610, -200], [470, H + 200]], C.ink, 12);
}

/** both hosts + podiums. the active one bounces and lip-syncs, the other reacts */
function stage(t, react = {}) {
  const sp = speaker(t), act = sp || lastSpeaker(t);
  const m = sp ? clamp(env(t) * 1.25) : 0;
  for (const kind of ['pro', 'con']) {
    const me = kind === act, talking = sp === kind, x = kind === 'pro' ? PX : CX;
    const bob = talking ? -Math.abs(Math.sin(t * 7.5)) * 14 : Math.sin(t * 2 + (kind === 'pro' ? 0 : 2)) * 4;
    const blink = ((t + (kind === 'pro' ? 0 : 1.3)) % 3.4) < 0.12 ? 1 : 0;
    const g = Math.sin(t * 4.2 + (kind === 'pro' ? 0 : 1));
    let o = { kind, mouth: talking ? m : 0, blink, look: kind === 'pro' ? 0.6 : -0.6 };
    if (talking) {
      o.arms = kind === 'pro' ? [0.3 + 0.1 * g, 2.2 + 0.35 * g] : [2.0 + 0.3 * g, 0.4];
      o.fore = kind === 'pro' ? [0.6, 0.5] : [0.6, 0.9];
      o.look = 0.4 * Math.sin(t * 1.3);
      o.brow = kind === 'con' ? 0.5 : 0;
    } else if (kind === 'con') { o.cross = true; o.brow = 1; o.smile = 0.2; o.look = -0.8; }
    else { o.arms = [0.2, 0.2]; o.fore = [0.4, 0.4]; o.smile = 1; }
    Object.assign(o, react[kind] || {});
    const s = HS * (me ? 1.04 : 0.98);
    M.inked(() => M.host(x, DY + bob, s, o), 6, 0.22);
    M.inked(() => M.podium(x, DY + 30, kind, 0.95, talking ? 1 : 0), 6, 0.25);
  }
  M.sfx('VS', 540, 1000, 78, 1 + 0.05 * Math.sin(t * 6), -0.1, C.yellow, C.red);
}

/** the top "screen" panel the hosts argue about */
function screen(fn, lt, opt = {}) {
  const k = eob(seg(lt, 0, 0.3));
  ctx.save(); ctx.translate(540, 410); ctx.scale(lerp(0.85, 1, k), lerp(0.85, 1, k)); ctx.translate(-540, -410);
  M.inked(() => { rr(70, 150, 940, 500, 26); ctx.fillStyle = opt.bg || C.paper; ctx.fill(); }, 8, 0.25);
  ctx.save(); ctx.beginPath(); ctx.roundRect(70, 150, 940, 500, 26); ctx.clip();
  M.halftone(940, 600, 260, opt.dot || C.paperDot, 26, 8, 0.9);
  fn();
  ctx.restore(); ctx.restore();
}
function banner(text, col, lt) {
  const k = eob(seg(lt, 0.05, 0.35));
  M.box(text, 540, 655, 54, k, col, C.white, -0.02);
}

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const pop = (lt, a, d = 0.25) => (lt < a ? 0 : eob(seg(lt, a, a + d)));
  const W_ = (w, i) => Wd(w, i) - cut(i);

  const MODELS = [
    ['#1 CHATGPT', '#10A37F'], ['#2 GEMINI', C.blue], ['#3 CLAUDE', '#D97757'], ['#4 LLAMA', '#0866FF'],
    ['#5 DEEPSEEK', '#4D6BFE'], ['#6 GROK', C.ink], ['#7 MISTRAL', C.orange],
  ];
  // one shot per line; `top` draws inside the screen panel (local time lt, line index i)
  const shot = (i, note, top, extra = {}) => {
    const who = T.lines[i].who, mi = i >= 2 && i <= 15 ? Math.floor((i - 2) / 2) : -1;
    add({ id: `S${String(i).padStart(2, '0')}`, at: cut(i), cam: [540, 900], zoom: 0.05, note,
      draw(lt, d, t) {
        background(t, who);
        if (mi >= 0) M.tracker(mi + 1, 7, 88);
        screen(() => top(lt, t), lt, extra);
        if (mi >= 0) banner(MODELS[mi][0], MODELS[mi][1], lt);
        else if (extra.banner) banner(extra.banner, extra.bcol || C.purple, lt);
        stage(t, extra.react ? extra.react(lt) : {});
        if (extra.after) extra.after(lt, t);
      } });
    cue(cut(i), i % 2 ? 'whoosh' : 'zip', { gain: 0.45 });
  };
  const src = (txt, lt) => M.source(txt, pop(lt, 0.4, 0.3), 200);
  const CY = 430;

  // 0 · PRO: seven reasons to love them
  shot(0, 'big 7 + hearts, PRO opens', (lt) => {
    M.sunburst(540, CY, C.yellow, C.goldLight, lt * 0.3);
    M.bigInk('7', 400, CY, 300, C.white, -0.06, pop(lt, 0.1, 0.35));
    M.box('AI MODELS', 680, CY - 50, 64, pop(lt, 0.5), C.purple, C.white, 0.03);
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + lt * 0.8; heart(540 + Math.cos(a) * 380, CY + Math.sin(a) * 170, 0.55 * pop(lt, W_('love', 0) - 0.1 + k * 0.05)); }
  }, { banner: 'PRO vs CON', bcol: C.purple });
  // 1 · CON: seven reasons to worry. Let's fight!
  shot(1, 'FIGHT! burst, CON joins', (lt) => {
    M.focusLines(540, CY, 160, 0.6);
    const f = W_('fight', 1);
    if (lt < f) M.bigInk('WORRY', 540, CY, 150, C.red, -0.04, pop(lt, W_('worry', 1) - 0.1));
    else M.sfx('FIGHT!', 540 + Math.sin(lt * 50) * 6 * (1 - seg(lt, f, f + 0.5)), CY, 230, pop(lt, f, 0.3), -0.1, C.yellow, C.red);
  }, { banner: 'PRO vs CON', bcol: C.purple, bg: '#FFE3E0' });
  cue(L(1) + Wd('fight', 1) - L(1), 'slam', { gain: 0.6 });

  // 2 · ChatGPT: 800M weekly
  shot(2, 'ChatGPT chip + 800M weekly counter', (lt) => {
    M.inked(() => M.chip(270, CY + 40, 0.75, { mood: 'happy', col: ['#10A37F', '#0B7A5F', '#5FD3B3'], arms: [0.6, 2.4] }), 5, 0.2);
    const k = seg(lt, W_('eight', 2), W_('eight', 2) + 1.0);
    M.bigInk(M.countText(800, eo(k), '', 'M'), 690, CY - 30, 150, C.yellow, -0.04, pop(lt, W_('eight', 2) - 0.1));
    M.box('EVERY WEEK', 690, CY + 110, 52, pop(lt, W_('week', 2)), C.green, C.white);
    src('OpenAI DevDay, Oct 2025', lt);
  });
  // 3 · costs money + makes things up
  shot(3, '$20/mo price tag, MAKES THINGS UP stamp', (lt) => {
    M.inked(() => M.priceTag('$20/MO', 330, CY - 20, 0.85 * pop(lt, W_('costs', 3) - 0.1), -0.12), 5, 0.2);
    M.stamp('MAKES THINGS UP', 650, CY + 90, 52, pop(lt, W_('make', 3), 0.2), 0.12);
    src('OpenAI pricing; "ChatGPT can make mistakes"', lt);
  }, { bg: '#FFE3E0' });
  cue(L(3) + W_('make', 3), 'thud', { gain: 0.6 });

  // 4 · Gemini in Gmail, Docs, Search
  shot(4, 'Gmail / Docs / Search icons pop', (lt) => {
    { const k = 1 - seg(lt, W_('gmail', 4) - 0.3, W_('gmail', 4)); if (k > 0) { ctx.save(); ctx.globalAlpha = k; M.inked(() => gem(540, CY, 150 * pop(lt, W_('gemini', 4) - 0.1), lt), 6, 0.2); ctx.restore(); } }
    const it = [['gmail', 260, () => M.envelope(0, 0, 1.0, -0.06, false), 'GMAIL'], ['docs', 540, () => M.doc(0, 0, 0.8, 0.04, 260, C.blue), 'DOCS'], ['search', 820, () => M.magnifier(-10, -10, 0.8), 'SEARCH']];
    for (const [w, x, fn, lab] of it) { const k = pop(lt, W_(w, 4) - 0.1); if (k <= 0) continue;
      ctx.save(); ctx.translate(x, CY - 30); ctx.scale(k, k); M.inked(fn, 5, 0.2); ctx.restore();
      M.box(lab, x, CY + 140, 40, k, C.blue, C.white); }
    src('Google Workspace with Gemini', lt);
  });
  // 5 · image tool paused
  shot(5, 'picture + PAUSED stamp', (lt) => {
    M.inked(() => M.picture(400, CY, 0.95, -0.05), 5, 0.2);
    M.bigInk('2024', 800, CY - 90, 100, C.white, -0.05, pop(lt, 0.3));
    M.stamp('PAUSED', 520, CY + 40, 90, pop(lt, W_('paused', 5), 0.2), -0.18);
    src('Google blog, Feb 2024', lt);
  }, { bg: '#FFE3E0' });
  cue(L(5) + W_('paused', 5), 'slam', { gain: 0.55 });

  // 6 · Claude: coders + huge documents
  shot(6, 'code window + tall document', (lt, t) => {
    M.inked(() => M.codeWin(370, CY, 0.72, seg(lt, 0.4, 2.5)), 5, 0.2);
    const k = pop(lt, W_('huge', 6) - 0.1);
    if (k > 0) { ctx.save(); ctx.translate(800, CY); ctx.scale(k, k); M.inked(() => M.doc(0, 0, 0.9, 0.05, 380, '#D97757'), 5, 0.2); ctx.restore(); M.box('200K TOKENS', 800, CY + 120, 40, k, '#D97757', C.white); }
    src('Anthropic model docs', lt);
  });
  // 7 · Claude can't make images
  shot(7, 'picture with NO sign', (lt) => {
    M.inked(() => M.picture(540, CY, 0.95, 0.03), 5, 0.2);
    const k = pop(lt, W_("can't", 7) - 0.05, 0.25);
    if (k > 0) { ctx.save(); ctx.translate(540, CY); ctx.scale(k, k); M.noSign(0, 0, 190); ctx.restore(); }
    src('Anthropic: no image generation', lt);
  }, { bg: '#FFE3E0' });
  cue(L(7) + W_("can't", 7), 'thud', { gain: 0.55 });

  // 8 · Llama: free to download
  shot(8, 'laptop download + FREE tag', (lt) => {
    const p = seg(lt, W_('download', 8), W_('download', 8) + 1.2);
    M.inked(() => M.laptop(380, CY + 120, 1.0, (w, h) => { ctx.fillStyle = '#0866FF'; ctx.fillRect(30, h - 50, (w - 60) * p, 22); ctx.strokeStyle = C.white; ctx.lineWidth = 4; ctx.strokeRect(30, h - 50, w - 60, 22);
      line([[w / 2, 30], [w / 2, 100]], C.white, 16); ctx.beginPath(); ctx.moveTo(w / 2 - 34, 80); ctx.lineTo(w / 2 + 34, 80); ctx.lineTo(w / 2, 124); ctx.closePath(); ctx.fillStyle = C.white; ctx.fill(); }), 5, 0.2);
    M.inked(() => M.priceTag('FREE', 790, CY - 30, 0.85 * pop(lt, W_('free', 8) - 0.1), 0.12, C.green), 5, 0.2);
    src('Meta: Llama open weights', lt);
  });
  // 9 · license limits, not truly open source
  shot(9, 'license scroll + NOT OPEN SOURCE stamp', (lt) => {
    const rows = [['- user limits', seg(lt, W_('limits', 9) - 0.2, W_('limits', 9) + 0.2)], ['- usage rules', seg(lt, W_('limits', 9), W_('limits', 9) + 0.4)]];
    M.inked(() => M.scroll(400, CY, 520, 380, 'LICENSE', rows, 0.85, -0.03), 5, 0.2);
    M.stamp('NOT OPEN SOURCE', 640, CY + 120, 50, pop(lt, W_('open', 9) - 0.05, 0.2), -0.12);
    src('Open Source Initiative', lt);
  }, { bg: '#FFE3E0' });
  cue(L(9) + W_('open', 9), 'slam', { gain: 0.5 });

  // 10 · DeepSeek: a fraction of the reported cost
  shot(10, 'small $5.6M tag vs big money bags', (lt) => {
    const kb = pop(lt, W_('rivaled', 10) - 0.1);
    for (let k = 0; k < 3; k++) { const s = 0.62 * kb; if (s > 0) M.inked(() => M.moneyBag(640 + k * 110, CY + 10 - (k % 2) * 40, s, 0.1 * (k - 1)), 5, 0.2); }
    M.box('TYPICAL BIG LAB', 750, CY + 120, 34, kb, C.white, C.ink);
    M.inked(() => M.priceTag('$5.6M', 290, CY, 0.7 * pop(lt, W_('fraction', 10) - 0.1), -0.1, C.yellow), 5, 0.2);
    M.box('REPORTED FINAL RUN', 290, CY + 130, 32, pop(lt, W_('reported', 10)), '#4D6BFE', C.white);
    src('DeepSeek-V3 report, Dec 2024', lt);
  });
  // 11 · dodges topics, banned on official devices
  shot(11, 'phone dodges + BANNED stamp', (lt) => {
    M.inked(() => M.phone(330, CY + 20, 0.48, -0.06, (w, h) => { ctx.fillStyle = '#EEF1F7'; ctx.fillRect(0, 0, w, h);
      rr(30, 140, w - 60, 150, 24); ctx.fillStyle = '#4D6BFE'; ctx.fill(); ctx.font = '900 46px Inter'; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText("Let's talk", w / 2, 205); ctx.fillText('about…', w / 2, 260);
      rr(30, 330, w - 60, 150, 24); ctx.fillStyle = C.white; ctx.fill(); ctx.fillStyle = C.ink; ctx.fillText('something', w / 2, 395); ctx.fillText('else 🙂', w / 2, 450); }), 5, 0.2);
    M.box('AUSTRALIA · TAIWAN\nSOUTH KOREA', 720, CY - 60, 40, pop(lt, W_('governments', 11) - 0.1), C.white, C.ink, 0.02);
    M.stamp('BANNED', 720, CY + 110, 80, pop(lt, W_('banned', 11), 0.2), -0.15);
    src('Govt-device bans, early 2025', lt);
  }, { bg: '#FFE3E0' });
  cue(L(11) + W_('banned', 11), 'slam', { gain: 0.55 });

  // 12 · Grok reads live X posts
  shot(12, 'live feed scrolling into Grok', (lt) => {
    ctx.save(); ctx.beginPath(); ctx.rect(150, 240, 470, 380); ctx.clip();
    for (let k = 0; k < 6; k++) { const y = 700 - ((lt * 160 + k * 140) % 840); M.inked(() => M.post(385, y, 420, 1, k % 2 ? '#C9CFDA' : C.sky2), 4); }
    ctx.restore();
    M.box('● LIVE', 385, 250, 40, pop(lt, W_('live', 12) - 0.1), C.red, C.white);
    M.inked(() => M.chip(820, CY + 30, 0.7, { mood: 'wink', col: ['#2B2B33', '#16161B', '#555560'], arms: [2.2, 0.5] }), 5, 0.2);
    M.bigInk('X', 820, CY - 150, 90, C.white, 0, pop(lt, W_('X', 12) - 0.1));
    src('xAI: Grok uses real-time X data', lt);
  });
  // 13 · offensive replies 2025
  shot(13, 'siren + OFFENSIVE stamp + apology', (lt, t) => {
    M.siren(540, CY - 140, 1.0, t, seg(lt, W_('offensive', 13) - 0.2, W_('offensive', 13)));
    M.stamp('OFFENSIVE REPLIES', 540, CY + 20, 60, pop(lt, W_('offensive', 13), 0.2), -0.1);
    M.box('JULY 2025 · xAI APOLOGIZED', 540, CY + 160, 38, pop(lt, W_('twenty', 13) - 0.1), C.white, C.ink);
    src('xAI statement, July 2025', lt);
  }, { bg: '#FFE3E0' });
  cue(L(13) + W_('offensive', 13), 'alarm', { gain: 0.3, dur: 1.2 });

  // 14 · Mistral: France, fast, open
  shot(14, 'French flag + bolt + OPEN', (lt, t) => {
    M.inked(() => { ctx.save(); ctx.translate(320, CY - 20); ctx.rotate(-0.06 + Math.sin(t * 3) * 0.03); M.flagFR(0, 0, 330, 220); ctx.restore(); }, 5, 0.2);
    M.inked(() => M.bolt(760, CY - 40, 0.75 * pop(lt, W_('fast', 14) - 0.1), C.yellow), 5, 0.2);
    M.box('OPEN MODELS', 540, CY + 160, 48, pop(lt, W_('open', 14) - 0.1), C.orange, C.white);
    src('Mistral AI: Apache 2.0 models', lt);
  });
  // 15 · way less money than US giants
  shot(15, 'funding bars: tiny Mistral vs giant US labs', (lt) => {
    const g = eo(seg(lt, W_('giants', 15) - 0.4, W_('giants', 15) + 0.4)), m = eo(seg(lt, 0.2, 0.7));
    const base = CY + 160;
    M.inked(() => M.bar(300, base, 150, 60 * m, C.orange, 0, ''), 5);
    M.inked(() => M.bar(560, base, 150, 280 * g, C.blue, 0, ''), 5);
    M.inked(() => M.bar(780, base, 150, 240 * g, C.blue, 0, ''), 5);
    M.box('MISTRAL', 300, base - 110, 34, m, C.orange, C.white); M.box('US GIANTS', 670, base - 300, 40, g, C.blue, C.white);
    src('Funding reports, 2025', lt);
  }, { bg: '#FFE3E0' });

  // 16 · PRO: so who wins?
  shot(16, 'medal + WHO WINS?', (lt, t) => {
    M.sunburst(540, CY, C.yellow, C.goldLight, lt * 0.4);
    M.inked(() => M.medal(330, CY + 150, 0.55 * pop(lt, 0.1), Math.sin(t * 3) * 0.1), 5, 0.2);
    M.bigInk('WHO WINS?', 690, CY, 110, C.white, -0.05, pop(lt, W_('wins', 16) - 0.1));
  }, { banner: 'YOUR VERDICT', bcol: C.purple });
  // 17 · CON: you decide, comments
  shot(17, 'comment icon: PRO or CON?', (lt) => {
    M.inked(() => M.commentIcon(330, CY, 1.0 * pop(lt, W_('comments', 17) - 0.3)), 6, 0.2);
    M.badge('pro', 760, CY - 80, 0.8 * pop(lt, 0.2)); M.badge('con', 760, CY + 80, 0.8 * pop(lt, 0.4));
  }, { banner: 'COMMENT BELOW', bcol: C.purple,
    react: (lt) => ({ pro: { arms: [0.3, 2.6], fore: [0.5, 0.3], smile: 1 }, con: { cross: false, arms: [2.6, 0.3], fore: [0.3, 0.5], smile: 1 } }) });
  cue(L(17) + W_('comments', 17), 'pop', { gain: 0.6 });

  return { shots: S, cues: CUES };
}

function heart(x, y, s) {
  if (s <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 40); ctx.bezierCurveTo(-90, -20, -50, -90, 0, -45); ctx.bezierCurveTo(50, -90, 90, -20, 0, 40); ctx.closePath();
  ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore();
}

function gem(x, y, r, t) {
  if (r <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2) * 0.1); ctx.beginPath();
  ctx.moveTo(0, -r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.quadraticCurveTo(0, 0, 0, r); ctx.quadraticCurveTo(0, 0, -r, 0); ctx.quadraticCurveTo(0, 0, 0, -r); ctx.closePath();
  const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#4F8DF5'); g.addColorStop(1, '#A77BF3'); ctx.fillStyle = g; ctx.fill(); ctx.restore();
}
