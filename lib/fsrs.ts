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

export type Intervals = { again: string; hard: string; good: string; easy: string };

/** Compact human interval, e.g. "10m", "1d", "3mes". */
function fmtInterval(now: Date, due: Date): string {
  const min = Math.max(1, Math.round((due.getTime() - now.getTime()) / 60000));
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.round(hr / 24);
  if (d < 31) return `${d}d`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}mes`;
  return `${(d / 365).toFixed(1)}a`;
}

/** The next-interval each grade would schedule, for the grade buttons. */
export function previewIntervals(fsrsCardJson: string, now: Date): Intervals {
  try {
    const p = scheduler.repeat(reviveCard(fsrsCardJson), now);
    return {
      again: fmtInterval(now, p[Rating.Again].card.due),
      hard: fmtInterval(now, p[Rating.Hard].card.due),
      good: fmtInterval(now, p[Rating.Good].card.due),
      easy: fmtInterval(now, p[Rating.Easy].card.due),
    };
  } catch {
    return { again: "", hard: "", good: "", easy: "" };
  }
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
