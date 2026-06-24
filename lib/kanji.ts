import { getDb } from "./db";
import { seeded } from "./queries";
import { safeParseArray } from "./json";

export type KanjiWord = { expression: string; furigana: string | null; reading: string; pitchAccent: number | null; pitchReading: string | null; meaning: string };
export type KanjiDetail = {
  literal: string;
  meanings: string[];
  on: string[];
  kun: string[];
  jlpt: number | null;
  grade: number | null;
  frequency: number | null;
  strokeCount: number | null;
  strokes: string[]; // ordered SVG path `d` strings (KanjiVG)
  words: KanjiWord[];
  next: string | null;
};

type Row = Record<string, unknown>;

/** Pull ordered stroke path data out of a KanjiVG SVG (document order = order). */
export function extractStrokes(svg: string | null | undefined): string[] {
  if (!svg) return [];
  const out: string[] = [];
  const re = /<path[^>]*\bd="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg))) out.push(m[1]);
  return out;
}

export function getKanjiDetail(literal: string): KanjiDetail | null {
  const db = getDb();
  if (!seeded(db)) return null;
  const k = db.prepare("SELECT * FROM kanji WHERE literal = ?").get(literal) as Row | undefined;
  if (!k) return null;

  const words = (
    db
      .prepare(
        `SELECT w.expression expression, w.furigana furigana, w.reading reading,
                w.pitch_accent pitch_accent, w.pitch_reading pitch_reading,
                COALESCE(w.meaning_es, w.meaning_en) meaning
         FROM word_kanji wk JOIN words w ON w.id = wk.word_id
         WHERE wk.kanji_id = ?
         ORDER BY (w.frequency IS NULL), w.frequency ASC, w.kaishi_order ASC LIMIT 12`,
      )
      .all(k.id) as Row[]
  ).map((r) => ({
    expression: r.expression as string,
    furigana: (r.furigana as string) ?? null,
    reading: r.reading as string,
    pitchAccent: (r.pitch_accent as number) ?? null,
    pitchReading: (r.pitch_reading as string) ?? null,
    meaning: r.meaning as string,
  }));

  // Next kanji in the same order as the browse list / home strip (by frequency).
  const next = db
    .prepare(
      `WITH ranked AS (
         SELECT literal, ROW_NUMBER() OVER (ORDER BY (frequency IS NULL), frequency ASC, stroke_count ASC, id) rn
         FROM kanji WHERE id IN (SELECT kanji_id FROM word_kanji)
       )
       SELECT literal FROM ranked WHERE rn = (SELECT rn + 1 FROM ranked WHERE literal = ?)`,
    )
    .get(k.literal) as Row | undefined;

  return {
    literal: k.literal as string,
    meanings: safeParseArray((k.meanings_es as string) || (k.meanings as string)),
    on: safeParseArray(k.on_readings as string),
    kun: safeParseArray(k.kun_readings as string),
    jlpt: (k.jlpt as number) ?? null,
    grade: (k.grade as number) ?? null,
    frequency: (k.frequency as number) ?? null,
    strokeCount: (k.stroke_count as number) ?? null,
    strokes: extractStrokes(k.kanjivg_svg as string),
    words,
    next: (next?.literal as string) ?? null,
  };
}

export type KanjiListItem = { literal: string; meaning: string; jlpt: number | null; strokeCount: number | null };

/** Browse list: kanji that appear in the vocabulary, most frequent first. */
const mapKanjiRow = (r: Row): KanjiListItem => ({
  literal: r.literal as string,
  meaning: safeParseArray(r.meanings as string)[0] ?? "",
  jlpt: (r.jlpt as number) ?? null,
  strokeCount: (r.strokeCount as number) ?? null,
});

export function getKanjiList(limit = 140): KanjiListItem[] {
  const db = getDb();
  if (!seeded(db)) return [];
  return (
    db
      .prepare(
        `SELECT literal, COALESCE(meanings_es, meanings) meanings, jlpt, stroke_count strokeCount
         FROM kanji WHERE id IN (SELECT kanji_id FROM word_kanji)
         ORDER BY (frequency IS NULL), frequency ASC, stroke_count ASC LIMIT ?`,
      )
      .all(limit) as Row[]
  ).map(mapKanjiRow);
}

/** Kanji at a JLPT level (KANJIDIC2's old 4-scale: 4=N5, 3=N4, 2=N3, 1=N2), most
 *  common first. Capped — the upper levels have 700–1200 kanji. */
export function getKanjiByJlpt(jlpt: number, limit = 150): KanjiListItem[] {
  const db = getDb();
  if (!seeded(db)) return [];
  return (
    db
      .prepare(
        `SELECT literal, COALESCE(meanings_es, meanings) meanings, jlpt, stroke_count strokeCount
         FROM kanji WHERE jlpt = ? ORDER BY (frequency IS NULL), frequency ASC, stroke_count ASC LIMIT ?`,
      )
      .all(jlpt, limit) as Row[]
  ).map(mapKanjiRow);
}
