import { test } from "node:test";
import assert from "node:assert/strict";
import { romajiToKana, isRomaji } from "../lib/romaji.ts";

// Romaji → hiragana widens search for Latin-keyboard beginners. Pin the cases
// that matter: basic syllables, yōon, small-tsu doubling, ん before consonants.

test("basic syllables", () => {
  assert.equal(romajiToKana("mizu"), "みず");
  assert.equal(romajiToKana("tabemono"), "たべもの");
  assert.equal(romajiToKana("sushi"), "すし");
});

test("yōon (kya/sho/chu...)", () => {
  assert.equal(romajiToKana("kyou"), "きょう");
  assert.equal(romajiToKana("ryouri"), "りょうり");
  assert.equal(romajiToKana("ocha"), "おちゃ");
});

test("small tsu from a doubled consonant", () => {
  assert.equal(romajiToKana("gakkou"), "がっこう");
  assert.equal(romajiToKana("kitte"), "きって");
});

test("Hepburn tch geminate → っ + ち (not a stray Latin t)", () => {
  assert.equal(romajiToKana("matcha"), "まっちゃ");
  assert.equal(romajiToKana("itchi"), "いっち");
  // a lone "tsu" / "tachi" must stay unaffected by the new rule
  assert.equal(romajiToKana("natsu"), "なつ");
  assert.equal(romajiToKana("tachi"), "たち");
});

test("ん before a consonant and at the end", () => {
  assert.equal(romajiToKana("nihongo"), "にほんご");
  assert.equal(romajiToKana("shinbun"), "しんぶん");
  assert.equal(romajiToKana("hon"), "ほん");
  assert.equal(romajiToKana("onna"), "おんな");
});

test("kunrei variants map to the same kana", () => {
  assert.equal(romajiToKana("si"), "し");
  assert.equal(romajiToKana("tu"), "つ");
  assert.equal(romajiToKana("hu"), "ふ");
});

test("isRomaji detects Latin queries only", () => {
  assert.equal(isRomaji("mizu"), true);
  assert.equal(isRomaji("水"), false);
  assert.equal(isRomaji("みず"), false);
  assert.equal(isRomaji("agua"), true);
});
