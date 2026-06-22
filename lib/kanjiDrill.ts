import "server-only";
import { getDb } from "./db";
import { seeded } from "./queries";
import { previewIntervals, type Intervals } from "./fsrs";
import { extractStrokes } from "./kanji";

export type KanjiWriteItem = {
  id: number;
  literal: string;
  meaning: string; // Spanish (EN fallback)
  reading: string; // a representative reading (kun preferred, else on)
  strokes: string[]; // ordered KanjiVG path d-strings = the reference to match
  isNew: boolean;
  intervals: Intervals;
};

type Row = Record<string, unknown>;

function cleanReading(r: string): string {
  return r.split(".")[0].replace(/[-.]/g, "");
}

const COLS = `k.id id, k.literal literal, COALESCE(k.meanings_es,k.meanings) meanings,
  k.on_readings on_r, k.kun_readings kun_r, k.kanjivg_svg svg, cs.fsrs_card fc`;

/** Writing-drill queue: due kanji reviews + new kanji up to the daily limit. */
export function getKanjiWriteQueue(limitNew = 10): KanjiWriteItem[] {
  const db = getDb();
  if (!seeded(db)) return [];
  const introducedToday = (
    db
      .prepare(
        `SELECT count(*) c FROM card_state WHERE card_type='kanji' AND introduced_at IS NOT NULL
           AND date(introduced_at,'localtime') = date('now','localtime')`,
      )
      .get() as { c: number }
  ).c;
  const freshLimit = Math.max(0, limitNew - introducedToday);

  const due = db
    .prepare(
      `SELECT ${COLS} FROM card_state cs JOIN kanji k ON k.id = cs.card_id
       WHERE cs.card_type='kanji' AND cs.introduced_at IS NOT NULL
         AND cs.due IS NOT NULL AND datetime(cs.due) <= datetime('now')
       ORDER BY datetime(cs.due) ASC`,
    )
    .all() as Row[];
  const fresh = db
    .prepare(
      `SELECT ${COLS} FROM card_state cs JOIN kanji k ON k.id = cs.card_id
       WHERE cs.card_type='kanji' AND cs.introduced_at IS NULL
       ORDER BY (k.frequency IS NULL), k.frequency ASC, k.stroke_count ASC, k.id LIMIT ?`,
    )
    .all(freshLimit) as Row[];

  const now = new Date();
  return [...due.map((r) => ({ r, isNew: false })), ...fresh.map((r) => ({ r, isNew: true }))]
    .map(({ r, isNew }) => {
      const kun = JSON.parse((r.kun_r as string) || "[]") as string[];
      const on = JSON.parse((r.on_r as string) || "[]") as string[];
      const meanings = JSON.parse((r.meanings as string) || "[]") as string[];
      const strokes = extractStrokes(r.svg as string);
      return {
        id: r.id as number,
        literal: r.literal as string,
        meaning: meanings[0] ?? "",
        reading: cleanReading(kun[0] || on[0] || ""),
        strokes,
        isNew,
        intervals: previewIntervals(r.fc as string, now),
      };
    })
    .filter((it) => it.strokes.length > 0); // only drawable kanji
}

/** Counts for entry-point badges (due now + new still available today). */
export function kanjiWriteCounts(limitNew = 10): { due: number; newAvail: number; total: number } {
  const db = getDb();
  if (!seeded(db)) return { due: 0, newAvail: 0, total: 0 };
  const one = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
  const due = one(
    `SELECT count(*) c FROM card_state WHERE card_type='kanji' AND introduced_at IS NOT NULL
       AND due IS NOT NULL AND datetime(due) <= datetime('now')`,
  );
  const introducedToday = one(
    `SELECT count(*) c FROM card_state WHERE card_type='kanji' AND introduced_at IS NOT NULL
       AND date(introduced_at,'localtime') = date('now','localtime')`,
  );
  const notIntroduced = one("SELECT count(*) c FROM card_state WHERE card_type='kanji' AND introduced_at IS NULL");
  const total = one("SELECT count(*) c FROM card_state WHERE card_type='kanji'");
  return { due, newAvail: Math.max(0, Math.min(limitNew - introducedToday, notIntroduced)), total };
}
