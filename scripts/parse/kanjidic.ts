// Parse kanjidic2 (English) from jmdict-simplified JSON into a literal -> data map.
import { readJsonFile } from "../lib/util.ts";

type Reading = { type: string; value: string };
type Meaning = { lang: string; value: string };
type Group = { readings: Reading[]; meanings: Meaning[] };
type RawChar = {
  literal: string;
  misc?: { grade?: number | null; strokeCounts?: number[]; jlptLevel?: number | null; frequency?: number | null };
  readingMeaning?: { groups?: Group[] } | null;
};
// Some releases use `characters`, older ones `character` — accept both.
type RawKanjidic = { characters?: RawChar[]; character?: RawChar[] };

export type KanjiData = {
  literal: string;
  jlpt: number | null;
  strokeCount: number | null;
  grade: number | null;
  frequency: number | null;
  meanings: string[];
  on: string[];
  kun: string[];
};

export async function parseKanjidic(jsonPath: string): Promise<Map<string, KanjiData>> {
  const data = await readJsonFile<RawKanjidic>(jsonPath);
  const chars = data.characters ?? data.character ?? [];
  const map = new Map<string, KanjiData>();

  for (const c of chars) {
    const meanings: string[] = [];
    const on: string[] = [];
    const kun: string[] = [];
    for (const g of c.readingMeaning?.groups ?? []) {
      for (const m of g.meanings ?? []) if (m.lang === "en" || !m.lang) meanings.push(m.value);
      for (const r of g.readings ?? []) {
        if (r.type === "ja_on") on.push(r.value);
        else if (r.type === "ja_kun") kun.push(r.value);
      }
    }
    map.set(c.literal, {
      literal: c.literal,
      jlpt: c.misc?.jlptLevel ?? null,
      strokeCount: c.misc?.strokeCounts?.[0] ?? null,
      grade: c.misc?.grade ?? null,
      frequency: c.misc?.frequency ?? null,
      meanings,
      on,
      kun,
    });
  }
  return map;
}
