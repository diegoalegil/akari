"use server";
import type { Grade } from "ts-fsrs";
import { getDb } from "@/lib/db";
import { applyGrade, cardColumns, reviveCard } from "@/lib/fsrs";

type CardType = "word" | "kanji" | "kana";

// Grade a card: run ts-fsrs, update card_state (setting introduced_at on first
// review), and append to review_log. This is the ONLY place SRS state mutates.
export async function gradeCard(cardType: CardType, cardId: number, grade: Grade, elapsedMs: number) {
  // Runtime input validation: this is a public unauthenticated server action and
  // TS types are erased at runtime, so callers can pass anything.
  if (cardType !== "word" && cardType !== "kanji" && cardType !== "kana") return { ok: false as const };
  if (grade !== 1 && grade !== 2 && grade !== 3 && grade !== 4) return { ok: false as const };
  if (!Number.isInteger(cardId) || cardId < 0) return { ok: false as const };
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs > 86_400_000) elapsedMs = 0;

  const db = getDb();
  const row = db
    .prepare("SELECT fsrs_card, introduced_at FROM card_state WHERE card_type = ? AND card_id = ?")
    .get(cardType, cardId) as { fsrs_card: string; introduced_at: string | null } | undefined;
  if (!row) return { ok: false as const };

  const now = new Date();
  const { card } = applyGrade(reviveCard(row.fsrs_card), grade, now);
  const cols = cardColumns(card);
  const introducedAt = row.introduced_at ?? now.toISOString();

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE card_state SET fsrs_card=?, fsrs_stability=?, fsrs_difficulty=?, fsrs_reps=?, fsrs_lapses=?,
        due=?, state=?, last_review=?, introduced_at=? WHERE card_type=? AND card_id=?`,
    ).run(
      cols.fsrs_card, cols.fsrs_stability, cols.fsrs_difficulty, cols.fsrs_reps, cols.fsrs_lapses,
      card.due.toISOString(), cols.state, cols.last_review, introducedAt, cardType, cardId,
    );
    db.prepare(
      "INSERT INTO review_log (card_type, card_id, grade, reviewed_at, elapsed_ms, stability, difficulty, state) VALUES (?,?,?,?,?,?,?,?)",
    ).run(cardType, cardId, grade, now.toISOString(), Math.round(elapsedMs) || null, card.stability, card.difficulty, card.state);
  });
  tx();

  return { ok: true as const, due: card.due.toISOString() };
}
