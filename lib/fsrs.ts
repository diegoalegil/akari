// Thin wrapper over ts-fsrs (the FSRS scheduler). Hard rule #3: we never
// hand-roll spaced repetition. Used by both the seed scripts and the server
// actions, so this module stays framework-agnostic (no "server-only").
import { createEmptyCard, fsrs, Rating, State, type Card, type Grade, type RecordLogItem } from "ts-fsrs";

export const scheduler = fsrs();
export { Rating, State };
export type { Card, Grade, RecordLogItem };

export function emptyCard(now?: Date): Card {
  return createEmptyCard(now);
}

export function serializeCard(card: Card): string {
  return JSON.stringify(card);
}

/** Rebuild a ts-fsrs Card from stored JSON, reviving its Date fields. */
export function reviveCard(json: string): Card {
  const c = JSON.parse(json) as Card;
  c.due = new Date(c.due);
  if (c.last_review) c.last_review = new Date(c.last_review);
  return c;
}

/** Apply a grade and return the updated card + review log. */
export function applyGrade(card: Card, rating: Grade, now: Date): RecordLogItem {
  return scheduler.next(card, now, rating);
}

/** Denormalized columns we mirror into card_state for queue queries. */
export function cardColumns(card: Card) {
  return {
    fsrs_card: serializeCard(card),
    fsrs_stability: card.stability,
    fsrs_difficulty: card.difficulty,
    fsrs_reps: card.reps,
    fsrs_lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}
