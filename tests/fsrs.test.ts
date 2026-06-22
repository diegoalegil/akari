import { test } from "node:test";
import assert from "node:assert/strict";
import { applyGrade, emptyCard, Rating, reviveCard, serializeCard, State } from "../lib/fsrs.ts";

test("new card starts in New state with no reps", () => {
  const card = emptyCard(new Date("2026-06-01T00:00:00Z"));
  assert.equal(card.state, State.New);
  assert.equal(card.reps, 0);
});

test("Good ratings grow stability and schedule due in the future", () => {
  let card = emptyCard(new Date("2026-06-01T00:00:00Z"));
  let now = new Date("2026-06-01T00:00:00Z");
  let prevStability = 0;
  for (let i = 0; i < 3; i++) {
    const { card: next } = applyGrade(card, Rating.Good, now);
    assert.ok(next.due.getTime() > now.getTime(), "due is in the future");
    assert.ok(next.stability >= prevStability, "stability is non-decreasing");
    prevStability = next.stability;
    card = next;
    now = next.due; // review exactly when due
  }
  assert.ok(card.reps >= 3, "reps accumulate");
});

test("Again lapses a graduated card into Relearning", () => {
  let card = emptyCard(new Date("2026-06-01T00:00:00Z"));
  let now = new Date("2026-06-01T00:00:00Z");
  for (let i = 0; i < 3; i++) {
    card = applyGrade(card, Rating.Easy, now).card;
    now = card.due;
  }
  const lapsesBefore = card.lapses;
  const { card: lapsed } = applyGrade(card, Rating.Again, now);
  assert.equal(lapsed.state, State.Relearning, "Again on a learned card relearns it");
  assert.ok(lapsed.lapses >= lapsesBefore + 1, "lapse is counted");
});

test("serialize/revive round-trips the card with live Date fields", () => {
  const card = applyGrade(emptyCard(new Date("2026-06-01T00:00:00Z")), Rating.Good, new Date("2026-06-01T00:00:00Z")).card;
  const revived = reviveCard(serializeCard(card));
  assert.ok(revived.due instanceof Date, "due revived as Date");
  assert.equal(revived.stability, card.stability);
  assert.equal(revived.state, card.state);
});
