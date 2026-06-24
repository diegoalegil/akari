import { getDb } from "./db";
import { seeded } from "./queries";

// One word to shadow: its native audio plus everything needed to show it while you
// listen and repeat. Every item is guaranteed to have audio. Pure read of validated
// data; nothing generated.
export type ShadowingItem = {
  expression: string;
  reading: string;
  furigana: string | null;
  pitchAccent: number | null;
  pitchReading: string | null;
  meaning: string;
  audio: string;
};

type Row = Record<string, unknown>;

/** A queue for listen-and-repeat shadowing. Words you've already been introduced to
 *  come first (so you drill the pronunciation of what you're actually learning),
 *  then common words fill the rest. */
export function getShadowingQueue(limit = 20): ShadowingItem[] {
  const db = getDb();
  if (!seeded(db)) return [];
  return (
    db
      .prepare(
        `SELECT w.expression, w.reading, w.furigana, w.pitch_accent, w.pitch_reading,
                COALESCE(w.meaning_es, w.meaning_en) meaning, w.audio_path
         FROM words w
         LEFT JOIN card_state cs ON cs.card_type = 'word' AND cs.card_id = w.id
         WHERE w.audio_path IS NOT NULL AND w.furigana IS NOT NULL
         ORDER BY (cs.introduced_at IS NULL), w.kaishi_order ASC
         LIMIT ?`,
      )
      .all(limit) as Row[]
  ).map((w) => ({
    expression: w.expression as string,
    reading: w.reading as string,
    furigana: (w.furigana as string) ?? null,
    pitchAccent: (w.pitch_accent as number) ?? null,
    pitchReading: (w.pitch_reading as string) ?? null,
    meaning: w.meaning as string,
    audio: w.audio_path as string,
  }));
}
