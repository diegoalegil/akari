import { test } from "node:test";
import assert from "node:assert/strict";
import { resample, normalizeStrokes, matchKanji, type Pt } from "../lib/strokeMatch.ts";

const line = (a: Pt, b: Pt, n = 8): Pt[] =>
  Array.from({ length: n }, (_, i) => ({ x: a.x + ((b.x - a.x) * i) / (n - 1), y: a.y + ((b.y - a.y) * i) / (n - 1) }));

// A tiny 2-stroke "glyph": a top horizontal + a vertical through the middle.
const REF: Pt[][] = [line({ x: 0, y: 0 }, { x: 10, y: 0 }), line({ x: 5, y: -5 }, { x: 5, y: 5 })];

test("resample returns exactly n points with endpoints preserved", () => {
  const r = resample(line({ x: 0, y: 0 }, { x: 9, y: 0 }, 3), 10);
  assert.equal(r.length, 10);
  assert.ok(Math.hypot(r[0].x - 0, r[0].y) < 1e-6);
  assert.ok(Math.hypot(r[9].x - 9, r[9].y) < 1e-6);
});

test("normalizeStrokes maps into the unit box", () => {
  const norm = normalizeStrokes(REF).flat();
  for (const p of norm) {
    assert.ok(p.x >= -1e-6 && p.x <= 1 + 1e-6);
    assert.ok(p.y >= -1e-6 && p.y <= 1 + 1e-6);
  }
});

test("identical strokes score a perfect match", () => {
  const m = matchKanji(REF.map((s) => s.slice()), REF);
  assert.equal(m.ok, true);
  assert.equal(m.countMatch, true);
  assert.equal(m.score, 1);
  assert.deepEqual(m.perStroke, [true, true]);
});

test("a slightly wobbly trace still passes (forgiving)", () => {
  const wobbly = REF.map((s) => s.map((p, i) => ({ x: p.x + (i % 2 ? 0.3 : -0.3), y: p.y + 0.2 })));
  assert.equal(matchKanji(wobbly, REF).ok, true);
});

test("a reversed stroke fails (direction matters)", () => {
  const user = [REF[0].slice().reverse(), REF[1].slice()];
  const m = matchKanji(user, REF);
  assert.equal(m.perStroke[0], false);
  assert.equal(m.ok, false);
});

test("wrong stroke count is not ok", () => {
  const m = matchKanji([REF[0].slice()], REF); // only 1 of 2 strokes
  assert.equal(m.countMatch, false);
  assert.equal(m.ok, false);
  assert.equal(m.expected, 2);
});

test("a wrong shape fails", () => {
  const user = [line({ x: 0, y: 0 }, { x: 0, y: 10 }), REF[1].slice()]; // first stroke vertical, not horizontal
  assert.equal(matchKanji(user, REF).ok, false);
});
