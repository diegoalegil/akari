import { test } from "node:test";
import assert from "node:assert/strict";
import { splitMorae, pitchPattern, pitchName } from "../lib/pitch.ts";

// The pitch contour is built from a validated drop-position integer. Mora
// segmentation and the high/low pattern must be exact or the overline lands on
// the wrong syllable.

test("splitMorae folds small kana into the previous mora", () => {
  assert.deepEqual(splitMorae("きょう"), ["きょ", "う"]); // 2 morae, not 3
  assert.deepEqual(splitMorae("りょうり"), ["りょ", "う", "り"]);
});

test("splitMorae keeps っ and ー as their own morae", () => {
  assert.deepEqual(splitMorae("がっこう"), ["が", "っ", "こ", "う"]); // 4 morae
  assert.deepEqual(splitMorae("にほんご"), ["に", "ほ", "ん", "ご"]);
});

test("pitchPattern: heiban (0) is low then all high", () => {
  // にほんご [0]: に low, ほんご high
  assert.deepEqual(pitchPattern(4, 0), [false, true, true, true]);
});

test("pitchPattern: atamadaka (1) is high then all low", () => {
  // かれ [1]: か high, れ low
  assert.deepEqual(pitchPattern(2, 1), [true, false]);
});

test("pitchPattern: nakadaka drops after the accented mora", () => {
  // せんせい [3]: low-high-high-low
  assert.deepEqual(pitchPattern(4, 3), [false, true, true, false]);
});

test("pitchPattern: odaka (= mora count) is high to the end", () => {
  // すき [2]: す low, き high (the drop is on the following particle)
  assert.deepEqual(pitchPattern(2, 2), [false, true]);
});

test("pitchName classifies the four accent types", () => {
  assert.match(pitchName(0, 3), /heiban/);
  assert.match(pitchName(1, 3), /atamadaka/);
  assert.match(pitchName(3, 3), /odaka/);
  assert.match(pitchName(2, 4), /nakadaka/);
});
