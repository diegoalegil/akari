import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFurigana } from "../lib/furigana.ts";

// The Anki-ruby parser turns validated Kaishi furigana into <ruby> tokens. A bug
// here would mis-place or leak readings on every render surface, so pin the edge
// cases that actually occur in the deck.

test("multi-kanji groups each keep their own reading", () => {
  assert.deepEqual(parseFurigana("日本[にほん]語[ご]"), [
    { base: "日本", rt: "にほん" },
    { base: "語", rt: "ご" },
  ]);
});

test("okurigana after a kanji stays as plain text", () => {
  assert.deepEqual(parseFurigana("大[おお]きい"), [
    { base: "大", rt: "おお" },
    { text: "きい" },
  ]);
});

test("a kanji + kana mix (sentence) splits ruby from plain runs", () => {
  assert.deepEqual(parseFurigana("私[わたし]はアンです。"), [
    { base: "私", rt: "わたし" },
    { text: "はアンです。" },
  ]);
});

test("pure-kana words carry no ruby", () => {
  assert.deepEqual(parseFurigana("あなた"), [{ text: "あなた" }]);
});

test("digit bases get a reading (no bracket leak)", () => {
  assert.deepEqual(parseFurigana("3[さん]"), [{ base: "3", rt: "さん" }]);
});

test("stray <b> bold is ignored", () => {
  assert.deepEqual(parseFurigana("<b>好[す]き</b>"), [
    { base: "好", rt: "す" },
    { text: "き" },
  ]);
});

test("empty / null input yields no tokens", () => {
  assert.deepEqual(parseFurigana(""), []);
  assert.deepEqual(parseFurigana(null), []);
  assert.deepEqual(parseFurigana(undefined), []);
});

test("the shared regex resets between calls (no lastIndex bleed)", () => {
  // Two calls in a row must both find the ruby — a stale lastIndex would skip it.
  assert.equal(parseFurigana("水[みず]").length, 1);
  assert.equal(parseFurigana("水[みず]").length, 1);
});
