// Akari's UI sound palette — synthesized live with the Web Audio API (no asset
// files, no licensing, tiny). The flavor is intentionally Japanese: koto-like
// plucks on a pentatonic scale, a rin (singing-bowl) bell, and a wooden "tok"
// for brush strokes. Everything is short, soft and refined — feedback, never
// noise. Honors the "Sonidos" setting and the browser autoplay policy (the
// AudioContext is created lazily inside the first user gesture).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22; // global ceiling — stays gentle
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Pentatonic palette (major pentatonic in C) — reads instantly as East-Asian.
const N = {
  D4: 293.66, A3: 220.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
  C6: 1046.5,
};

/** A plucked, koto-ish note: fast attack, exponential decay, gentle low-pass. */
function pluck(freq: number, t: number, peak = 0.5, decay = 0.45, type: OscillatorType = "triangle") {
  const c = ac();
  if (!c || !master) return;
  const m = master;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = Math.min(freq * 4, 7000);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.006 + decay);
  o.connect(lp);
  lp.connect(g);
  g.connect(m);
  o.start(t);
  o.stop(t + decay + 0.05);
}

/** A rin-bell shimmer: a sine fundamental plus an inharmonic metallic partial. */
function bell(freq: number, t: number, peak = 0.35, decay = 1.1) {
  const c = ac();
  if (!c || !master) return;
  const m = master;
  ([[freq, 1], [freq * 2.76, 0.35]] as const).forEach(([f, mul]) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak * mul, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g);
    g.connect(m);
    o.start(t);
    o.stop(t + decay + 0.1);
  });
}

/** A short filtered noise burst — a wooden clack (brush stroke / fude). */
function woodTok(t: number, peak = 0.45) {
  const c = ac();
  if (!c || !master) return;
  const m = master;
  const dur = 0.06;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1300;
  bp.Q.value = 1.8;
  const g = c.createGain();
  g.gain.value = peak;
  src.connect(bp);
  bp.connect(g);
  g.connect(m);
  src.start(t);
}

/** A soft airy swish — the card turning over. */
function swish(t: number, peak = 0.22) {
  const c = ac();
  if (!c || !master) return;
  const m = master;
  const dur = 0.17;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(500, t);
  hp.frequency.exponentialRampToValueAtTime(3200, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(hp);
  hp.connect(g);
  g.connect(m);
  src.start(t);
}

export type SoundName =
  | "tap" | "reveal" | "flip" | "good" | "hard" | "easy" | "again"
  | "correct" | "wrong" | "stroke" | "complete" | "start";

/** Schedule the voices for a named sound on a live context. */
function schedule(name: SoundName, c: AudioContext) {
  const t = c.currentTime + 0.001;
  switch (name) {
    case "tap": pluck(N.A5, t, 0.16, 0.08, "sine"); break;
    case "reveal": pluck(N.E5, t, 0.28, 0.32); break;
    case "flip": swish(t); break;
    case "hard": pluck(N.D5, t, 0.38, 0.4); break;
    case "good": pluck(N.E5, t, 0.42, 0.38); pluck(N.A5, t + 0.09, 0.38, 0.42); break;
    case "easy": pluck(N.E5, t, 0.38, 0.32); pluck(N.G5, t + 0.08, 0.38, 0.32); pluck(N.C6, t + 0.16, 0.44, 0.5); break;
    case "again": pluck(N.A3, t, 0.4, 0.5, "sine"); break; // gentle low note, never harsh
    case "stroke": woodTok(t, 0.4); break;
    case "correct": bell(N.A5, t, 0.32, 1.0); pluck(N.E5, t, 0.3, 0.4); break;
    case "wrong": woodTok(t, 0.5); pluck(N.D4, t + 0.02, 0.3, 0.3, "sine"); break;
    case "complete": [N.C5, N.E5, N.G5, N.A5, N.C6].forEach((f, i) => pluck(f, t + i * 0.12, 0.4, 0.5)); bell(N.C6, t + 0.62, 0.28, 1.4); break;
    case "start": pluck(N.G5, t, 0.34, 0.3); pluck(N.C6, t + 0.1, 0.4, 0.4); break;
  }
}

/** Play a named UI sound (no-op if sound is off or audio is unavailable). */
export function playSound(name: SoundName) {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  // When a sound is triggered without a fresh user gesture (the "complete" jingle
  // fires from a timer; iOS also auto-suspends the context on background), the
  // context can be suspended — scheduling a note at currentTime would land it in the
  // past and drop it. Wait for the clock to actually start in that case. The common
  // running path stays fully synchronous, so gesture-driven audio is unchanged.
  if (c.state === "suspended") {
    void c.resume().then(() => schedule(name, c)).catch(() => {});
    return;
  }
  schedule(name, c);
}
