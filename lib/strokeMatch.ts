// Deterministic handwriting matcher for the kanji writing drill.
//
// HARD RULE #1 stays intact: there is NO model here. We compare the strokes the
// user draws against the *validated* KanjiVG reference strokes purely with
// geometry — resample each stroke to a fixed number of points, normalize the
// whole glyph into a unit box (so size/position don't matter), and measure the
// average point-to-point distance stroke-by-stroke in drawing order. Order and
// direction are enforced because the comparison is ordered and start→end.

export type Pt = { x: number; y: number };

/** Resample a polyline to exactly n points evenly spaced by arc length. */
export function resample(pts: Pt[], n = 24): Pt[] {
  if (pts.length === 0) return Array.from({ length: n }, () => ({ x: 0, y: 0 }));
  if (pts.length === 1) return Array.from({ length: n }, () => ({ ...pts[0] }));
  const cum: number[] = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    cum.push(total);
  }
  if (total === 0) return Array.from({ length: n }, () => ({ ...pts[0] }));
  const out: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const target = (total * k) / (n - 1);
    let i = 1;
    while (i < cum.length - 1 && cum[i] < target) i++;
    const span = cum[i] - cum[i - 1] || 1;
    const t = (target - cum[i - 1]) / span;
    out.push({ x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t });
  }
  return out;
}

/** Normalize all strokes into a shared unit box (uniform scale, keeps aspect). */
export function normalizeStrokes(strokes: Pt[][]): Pt[][] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of strokes) for (const p of s) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (!isFinite(minX)) return strokes;
  const w = maxX - minX, h = maxY - minY;
  const scale = Math.max(w, h) || 1;
  const offX = minX - (scale - w) / 2; // center the shorter axis
  const offY = minY - (scale - h) / 2;
  return strokes.map((s) => s.map((p) => ({ x: (p.x - offX) / scale, y: (p.y - offY) / scale })));
}

/** Mean per-point distance between two equally-resampled strokes. */
function strokeDistance(a: Pt[], b: Pt[]): number {
  const n = Math.min(a.length, b.length);
  if (!n) return Infinity;
  let d = 0;
  for (let i = 0; i < n; i++) d += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y);
  return d / n;
}

export type MatchResult = {
  ok: boolean; // right stroke count AND every stroke within tolerance
  countMatch: boolean; // drew the right number of strokes
  perStroke: boolean[]; // which user strokes landed (index = user stroke order)
  score: number; // 0..1 fraction of reference strokes matched in order
  expected: number; // reference stroke count
};

const N = 24; // resample resolution
const PASS = 0.13; // normalized per-stroke tolerance — strict: shape, order & direction must be right

/** Compare the user's raw strokes against the reference's raw strokes. */
export function matchKanji(userRaw: Pt[][], refRaw: Pt[][]): MatchResult {
  const user = normalizeStrokes(userRaw).map((s) => resample(s, N));
  const ref = normalizeStrokes(refRaw).map((s) => resample(s, N));
  const perStroke: boolean[] = [];
  let matched = 0;
  for (let i = 0; i < user.length; i++) {
    const r = ref[i];
    const good = !!r && strokeDistance(user[i], r) <= PASS;
    perStroke.push(good);
    if (good) matched++;
  }
  const countMatch = user.length === ref.length;
  const score = ref.length ? matched / ref.length : 0;
  return { ok: countMatch && perStroke.every(Boolean), countMatch, perStroke, score, expected: ref.length };
}
