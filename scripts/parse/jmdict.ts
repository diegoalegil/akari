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
  frequency: number | null; // lower = more frequent (from nfXX), null if absent
  common: boolean;
};

export type JmdictIndex = {
  match(expression: string, reading: string): JmEntry | null;
  size: number;
};

/** Assemble a concise English gloss from up to 4 senses. */
function buildMeaning(w: RawWord): string {
  const senses = w.sense.slice(0, 4).map((s) =>
    s.gloss
      .filter((g) => g.lang === "eng" || !g.lang)
      .map((g) => g.text)
      .join(", "),
  );
  return senses.filter(Boolean).join("; ");
}

/** Smallest nfXX rank across a set of forms (the JMdict frequency signal). */
function freqOf(forms: Form[]): number | null {
  let best: number | null = null;
  for (const f of forms) {
    for (const t of f.tags ?? []) {
      const m = /^nf(\d+)$/.exec(t);
      if (m) {
        const n = Number(m[1]);
        if (best === null || n < best) best = n;
      }
    }
  }
  return best;
}

export async function parseJmdict(jsonPath: string): Promise<JmdictIndex> {
  const data = await readJsonFile<RawJmdict>(jsonPath);
  const SEP = "";
  const pairIndex = new Map<string, JmEntry>();
  const kanaIndex = new Map<string, JmEntry>();

  for (const w of data.words) {
    const meaning = buildMeaning(w);
    if (!meaning) continue;
    const common = w.kanji.some((k) => k.common) || w.kana.some((k) => k.common);
    const entry: JmEntry = { id: w.id, meaning, frequency: freqOf([...w.kanji, ...w.kana]), common };

    if (w.kanji.length === 0) {
      // Pure kana word: index by reading. Prefer a common entry on collision.
      for (const k of w.kana) {
        const prev = kanaIndex.get(k.text);
        if (!prev || (entry.common && !prev.common)) kanaIndex.set(k.text, entry);
      }
      continue;
    }

    for (const kana of w.kana) {
      const applies = kana.appliesToKanji && !kana.appliesToKanji.includes("*")
        ? kana.appliesToKanji
        : w.kanji.map((k) => k.text);
      for (const kanjiText of applies) {
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
