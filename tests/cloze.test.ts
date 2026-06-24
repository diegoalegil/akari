import { test } from "node:test";
import assert from "node:assert/strict";
import { clozeFurigana, type ClozeToken } from "../lib/cloze.ts";

const surface = (toks: ClozeToken[]) => toks.map((t) => ("blank" in t ? "▢" : "base" in t ? t.base : t.text)).join("");
const blanks = (toks: ClozeToken[]) => toks.filter((t) => "blank" in t).length;

test("blanks a kana-only headword in a plain sentence", () => {
  const { tokens, ok } = clozeFurigana(null, "あなたはだれですか。", "あなた");
  assert.equal(ok, true);
  assert.equal(blanks(tokens), 1);
  assert.equal(surface(tokens), "▢はだれですか。");
});

test("blanks a kanji headword across its ruby + okurigana, keeping other ruby intact", () => {
  // 好き = 好[す] (ruby) + き (kana); the blank must remove both as ONE gap.
  const { tokens, ok } = clozeFurigana("私[わたし]は好[す]きです。", "私は好きです。", "好き");
  assert.equal(ok, true);
  assert.equal(blanks(tokens), 1);
  assert.equal(surface(tokens), "私は▢です。");
  const ruby = tokens.find((t) => "base" in t && t.base === "私");
  assert.ok(ruby && "rt" in ruby && ruby.rt === "わたし", "the 私 ruby + its reading survive");
});

test("splits a plain-kana token when the word sits mid-token", () => {
  const { tokens, ok } = clozeFurigana(null, "これはいいね。", "いい");
  assert.equal(ok, true);
  assert.equal(surface(tokens), "これは▢ね。");
});

test("ok=false when the sentence doesn't contain the word", () => {
  const { ok } = clozeFurigana("私[わたし]は元気[げんき]です。", "私は元気です。", "好き");
  assert.equal(ok, false);
});

test("falls back (ok=false) on empty input", () => {
  assert.equal(clozeFurigana(null, "", "私").ok, false);
  assert.equal(clozeFurigana(null, "私は学生です。", "").ok, false);
});
