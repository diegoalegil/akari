import "server-only";
import { getDb } from "./db";
import { getSetting } from "./queries";
import { previewIntervals } from "./fsrs";

// Builds the daily word queue (due reviews + new cards up to the daily limit)
// with everything the client needs to render each card and the next-interval
// preview for the four grade buttons. Kanji/kana have their own surfaces.

export type ReviewSentence = { jp: string; en: string | null; audio: string | null };

export type ReviewCard = {
  cardType: "word";
  cardId: number;
  isNew: boolean;
  expression: string;
  reading: string;
  meaning: string;
  audio: string | null;
  sentences: ReviewSentence[];
  kanji: { literal: string; meanings: string[] }[];
  intervals: { again: string; hard: string; good: string; easy: string };
};

type Row = Record<string, unknown>;

function buildCard(db: ReturnType<typeof getDb>, id: number, isNew: boolean, now: Date): ReviewCard {
  const w = db.prepare("SELECT expression, reading, meaning_en, audio_path FROM words WHERE id = ?").get(id) as Row;
  const sentences = (
    db
      .prepare(
        `SELECT s.jp jp, s.en en,
                (SELECT file_path FROM sentence_audio WHERE sentence_id = s.id LIMIT 1) audio
         FROM word_sentences ws JOIN sentences s ON s.id = ws.sentence_id
         WHERE ws.word_id = ? ORDER BY ws.rank ASC LIMIT 2`,
      )
      .all(id) as Row[]
  ).map((r) => ({ jp: r.jp as string, en: (r.en as string) ?? null, audio: (r.audio as string) ?? null }));
  const kanji = (
    db
      .prepare("SELECT k.literal literal, k.meanings meanings FROM word_kanji wk JOIN kanji k ON k.id = wk.kanji_id WHERE wk.word_id = ?")
      .all(id) as Row[]
  ).map((r) => ({ literal: r.literal as string, meanings: (JSON.parse((r.meanings as string) || "[]") as string[]).slice(0, 3) }));
  const cs = db.prepare("SELECT fsrs_card FROM card_state WHERE card_type='word' AND card_id = ?").get(id) as Row;

  return {
    cardType: "word",
    cardId: id,
    isNew,
    expression: w.expression as string,
    reading: w.reading as string,
    meaning: w.meaning_en as string,
    audio: (w.audio_path as string) ?? null,
    sentences,
    kanji,
    intervals: previewIntervals(cs.fsrs_card as string, now),
  };
}

export function getReviewQueue(): ReviewCard[] {
  const db = getDb();
  const newPerDay = Number(getSetting("new_per_day", "10"));
  const introducedToday = (
    db
      .prepare(
        "SELECT count(*) c FROM card_state WHERE card_type='word' AND introduced_at IS NOT NULL AND date(introduced_at,'localtime') = date('now','localtime')",
      )
      .get() as { c: number }
  ).c;
  const newRemaining = Math.max(0, newPerDay - introducedToday);

  const due = db
    .prepare(
      "SELECT card_id id FROM card_state WHERE card_type='word' AND introduced_at IS NOT NULL AND due IS NOT NULL AND datetime(due) <= datetime('now') ORDER BY datetime(due) ASC",
    )
    .all() as { id: number }[];
  const fresh = db
    .prepare(
      `SELECT cs.card_id id FROM card_state cs JOIN words w ON w.id = cs.card_id
       WHERE cs.card_type='word' AND cs.introduced_at IS NULL ORDER BY w.kaishi_order ASC LIMIT ?`,
    )
    .all(newRemaining) as { id: number }[];

  const now = new Date();
  return [
    ...due.map((r) => buildCard(db, r.id, false, now)),
    ...fresh.map((r) => buildCard(db, r.id, true, now)),
  ];
}
