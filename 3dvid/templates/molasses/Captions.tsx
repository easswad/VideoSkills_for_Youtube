// On-screen text in the house style of the channel's other shorts:
//  - captions low-middle (~70 % down): 1-3 words, Poppins Black caps, white with a thick black outline and a hard
//    black drop shadow; key words sit in a slanted yellow box with a black border (sticker look), popping in per chunk;
//  - a small white "source" tag with a black border and hard shadow near the top on lines that state a fact.
// All sizes are at 1080x1920; the 1440x2560 final scales them with the frame.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";
import { CHUNKS, TAGS } from "./captions-data";

const { fontFamily } = loadFont("normal", { weights: ["800", "900"], subsets: ["latin"] });

const YELLOW = "#FFD43B";
const INK = "#0d0d0d";
const CAP_Y = 1300; // top of the caption block (68 % down)
const MAX_W = 960;

type Tok = [string, boolean];
type Group = { text: string; key: boolean };

/** merge consecutive tokens of the same kind, so adjacent key words share one yellow box */
const groups = (t: Tok[]): Group[] => {
  const g: Group[] = [];
  for (const [w, k] of t) {
    const last = g[g.length - 1];
    if (last && last.key === k) last.text += " " + w;
    else g.push({ text: w, key: k });
  }
  return g;
};

/** one line if short, otherwise break at the first plain/key boundary (e.g. "SO THE / [COMPANY]") */
const toLines = (g: Group[]): Group[][] => {
  const chars = g.reduce((n, x) => n + x.text.length, 0) + g.length - 1;
  if (g.length < 2 || chars <= 14) return [g];
  return [g.slice(0, 1), g.slice(1)];
};

// Poppins Black caps average ~0.68 em per character
const fitSize = (lines: Group[][]) => {
  const widest = Math.max(...lines.map((l) => l.reduce((n, x) => n + x.text.length * 0.68 + (x.key ? 0.9 : 0), 0) + (l.length - 1) * 0.3));
  return Math.min(104, MAX_W / widest);
};

const Plain: React.FC<{ text: string; size: number }> = ({ text, size }) => (
  <span style={{
    color: "#ffffff", WebkitTextStroke: `${size * 0.11}px ${INK}`, paintOrder: "stroke fill",
    textShadow: `${size * 0.06}px ${size * 0.08}px 0 ${INK}`,
  }}>{text}</span>
);

const Key: React.FC<{ text: string; size: number; pop: number }> = ({ text, size, pop }) => (
  <span style={{
    display: "inline-block", color: INK, background: YELLOW, border: `${size * 0.065}px solid ${INK}`,
    borderRadius: size * 0.14, padding: `0 ${size * 0.2}px`, lineHeight: 1.12,
    boxShadow: `${size * 0.07}px ${size * 0.09}px 0 ${INK}`,
    transform: `skewX(-7deg) rotate(${interpolate(pop, [0, 1], [-5, -2])}deg) scale(${interpolate(pop, [0, 1], [0.6, 1])})`,
  }}>
    <span style={{ display: "inline-block", transform: "skewX(7deg)" }}>{text}</span>
  </span>
);

const Caption: React.FC<{ t: Tok[]; age: number }> = ({ t, age }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: age, fps, config: { damping: 11, stiffness: 260, mass: 0.6 } });
  const keyPop = spring({ frame: age - 2, fps, config: { damping: 9, stiffness: 240, mass: 0.6 } });
  const lines = toLines(groups(t));
  const size = fitSize(lines);
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: CAP_Y, display: "flex", flexDirection: "column", alignItems: "center",
      gap: size * 0.12, fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1.08, wordSpacing: size * 0.06,
      transform: `scale(${interpolate(pop, [0, 1], [0.78, 1])})`, transformOrigin: "50% 30%", opacity: Math.min(1, age / 2 + 0.5),
    }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", gap: size * 0.28, alignItems: "center", whiteSpace: "nowrap" }}>
          {l.map((g, j) => g.key ? <Key key={j} text={g.text} size={size} pop={keyPop} /> : <Plain key={j} text={g.text} size={size} />)}
        </div>
      ))}
    </div>
  );
};

const Tag: React.FC<{ text: string; age: number; left: number }> = ({ text, age, left }) => {
  const { fps } = useVideoConfig();
  const inn = spring({ frame: age, fps, config: { damping: 14, stiffness: 200 } });
  const out = interpolate(left, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const size = Math.min(32, 900 / (text.length * 0.62));
  return (
    <div style={{ position: "absolute", top: 128, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: out }}>
      <div style={{
        fontFamily, fontWeight: 800, fontSize: size, letterSpacing: size * 0.04, color: INK, background: "#ffffff",
        border: `4px solid ${INK}`, borderRadius: 8, padding: "10px 20px", boxShadow: `6px 7px 0 ${INK}`, whiteSpace: "nowrap",
        transform: `translateY(${interpolate(inn, [0, 1], [-40, 0])}px)`, opacity: inn,
      }}>{text}</div>
    </div>
  );
};

export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const c = CHUNKS.find((x) => f >= x.a && f <= x.b);
  const tg = TAGS.find((x) => f >= x.a && f <= x.b);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {tg && <Tag key={tg.a} text={tg.text} age={f - tg.a} left={tg.b - f} />}
      {c && <Caption key={c.a} t={c.t} age={f - c.a} />}
    </AbsoluteFill>
  );
};
