import { getDb } from "./db";
import { seeded } from "./queries";
import { splitMorae } from "./pitch";

// A pick-the-contour round: a real word, its katakana reading, and a few candidate
// accent (drop) positions to choose between — the correct one plus plausible
// distractors. Built entirely from validated pitch_accent data; nothing generated.
export type PitchDrillItem = {
  expression: string;
  reading: string; // pitch_reading (katakana the contour aligns to)
  meaning: string;
  accent: number; // correct drop position (0 heiban … n)
  options: number[]; // shuffled candidate accents, including the correct one
  audio: string | null;
};

type Row = Record<string, unknown>;
const shuffle = <T,>(a: T[]): T[] => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map(([, v]) => v);

/** A short drill of common pitched words. For each, offer the correct accent plus
 *  up to two other valid drop positions (0…moraCount) as distractors. */
export function getPitchDrillQueue(limit = 16): PitchDrillItem[] {
  const db = getDb();
  if (!seeded(db)) return [];
  // Pull a pool of the most common pitched words, then sample for variety.
  const pool = db
    .prepare(
      `SELECT expression, pitch_reading reading, pitch_accent accent, meaning_es, meaning_en, audio_path
       FROM words WHERE pitch_accent IS NOT NULL AND pitch_reading IS NOT NULL AND audio_path IS NOT NULL
       ORDER BY kaishi_order ASC LIMIT ?`,
    )
    .all(limit * 6) as Row[];

  return shuffle(pool)
    .slice(0, limit)
    .map((r) => {
      const reading = r.reading as string;
      const accent = r.accent as number;
      const m = splitMorae(reading).length;
      const distractors = shuffle(Array.from({ length: m + 1 }, (_, i) => i).filter((a) => a !== accent)).slice(0, 2);
      return {
        expression: r.expression as string,
        reading,
        meaning: ((r.meaning_es as string) ?? (r.meaning_en as string)) as string,
        accent,
        options: shuffle([accent, ...distractors]),
        audio: (r.audio_path as string) ?? null,
      };
    });
}
