// Parse jmdict-simplified (English) into lookup indexes keyed for
// HOMOGRAPH-SAFE matching: an exact (expression + reading) pair, plus a
// kana-only index. This is the core of hard-rule #1 — we never guess which
// sense a word has; we match the exact surface+reading and take that entry's
// gloss, or fall back to the curated Kaishi gloss (logged) if there is no match.
import { readJsonFile } from "../lib/util.ts";

type Gloss = { lang: string; text: string };
type Sense = { partOfSpeech?: string[]; appliesToKanji?: string[]; appliesToKana?: string[]; gloss: Gloss[] };
type Form = { text: string; common: boolean; tags: string[]; appliesToKanji?: string[] };
type RawWord = { id: string; kanji: Form[]; kana: Form[]; sense: Sense[] };
type RawJmdict = { words: RawWord[] };

export type JmEntry = {
  id: string;
  meaning: string;
  common: boolean;
};

export type JmdictIndex = {
  match(expression: string, reading: string): JmEntry | null;
  size: number;
};

const SEP = "\t"; // never appears in a Japanese expression/reading

/** Does a sense apply to this specific (kanji,kana) surface form? */
function senseApplies(s: Sense, kanjiText: string | null, kanaText: string): boolean {
  const okKanji =
    !kanjiText || !s.appliesToKanji || s.appliesToKanji.length === 0 || s.appliesToKanji.includes("*") || s.appliesToKanji.includes(kanjiText);
  const okKana = !s.appliesToKana || s.appliesToKana.length === 0 || s.appliesToKana.includes("*") || s.appliesToKana.includes(kanaText);
  return okKanji && okKana;
}

/** Concise English gloss from the senses that apply to THIS surface form
 *  (restriction-aware so multi-form entries don't bleed unrelated senses). */
function buildMeaning(w: RawWord, kanjiText: string | null, kanaText: string): string {
  const applicable = w.sense.filter((s) => senseApplies(s, kanjiText, kanaText));
  const senses = (applicable.length ? applicable : w.sense).slice(0, 4).map((s) =>
    s.gloss
      .filter((g) => g.lang === "eng" || !g.lang)
      .map((g) => g.text)
      .join(", "),
  );
  return senses.filter(Boolean).join("; ");
}

export async function parseJmdict(jsonPath: string): Promise<JmdictIndex> {
  const data = await readJsonFile<RawJmdict>(jsonPath);
  const pairIndex = new Map<string, JmEntry>();
  const kanaIndex = new Map<string, JmEntry>();

  for (const w of data.words) {
    const common = w.kanji.some((k) => k.common) || w.kana.some((k) => k.common);

    if (w.kanji.length === 0) {
      // Pure kana word: index by reading. Prefer a common entry on collision.
      for (const k of w.kana) {
        const meaning = buildMeaning(w, null, k.text);
        if (!meaning) continue;
        const entry: JmEntry = { id: w.id, meaning, common };
        const prev = kanaIndex.get(k.text);
        if (!prev || (entry.common && !prev.common)) kanaIndex.set(k.text, entry);
      }
      continue;
    }

    for (const kana of w.kana) {
      const applies = kana.appliesToKanji && !kana.appliesToKanji.includes("*") ? kana.appliesToKanji : w.kanji.map((k) => k.text);
      for (const kanjiText of applies) {
        const meaning = buildMeaning(w, kanjiText, kana.text);
        if (!meaning) continue;
        const entry: JmEntry = { id: w.id, meaning, common };
        const key = kanjiText + SEP + kana.text;
        const prev = pairIndex.get(key);
        if (!prev || (entry.common && !prev.common)) pairIndex.set(key, entry);
      }
    }
  }

  return {
    size: pairIndex.size + kanaIndex.size,
    match(expression, reading) {
      // Exact (surface + reading) pair — the only homograph-safe match.
      const pair = pairIndex.get(expression + SEP + reading);
      if (pair) return pair;
      // Pure-kana word (expression IS the reading): safe to match by reading.
      if (expression === reading) return kanaIndex.get(reading) ?? null;
      // Anything else: no confident match -> caller falls back to Kaishi gloss.
      return null;
    },
  };
}
