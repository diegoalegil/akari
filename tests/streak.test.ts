import { test } from "node:test";
import assert from "node:assert/strict";
import initSqlJs from "sql.js";
import { ClientDb } from "../lib/clientDb.ts";
import { computeStreak } from "../lib/queries.ts";

// computeStreak is the costliest dashboard query, so it bounds its scan to the last
// STREAK_WINDOW_DAYS (400) and only re-widens to all history if the streak saturates
// that window. This locks in that the optimization keeps the streak EXACTLY: the
// bounded path and the unbounded re-widen path must both match the true streak,
// including the >400-day case that must never be capped.

// A timestamp at local noon `daysAgo` days back — far from midnight, so it buckets
// cleanly to that local date under date(reviewed_at,'localtime').
function localNoonISO(daysAgo: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function streakOf(db: ClientDb, daysAgoList: number[]): number {
  db.prepare("DELETE FROM review_log").run();
  const ins = db.prepare("INSERT INTO review_log (card_type, card_id, grade, reviewed_at) VALUES ('word', 1, 3, ?)");
  for (const n of daysAgoList) ins.run(localNoonISO(n));
  return computeStreak(db as unknown as Parameters<typeof computeStreak>[0]);
}

test("computeStreak: bounded window + re-widen keep the streak exact", async () => {
  const SQL = await initSqlJs();
  const raw = new SQL.Database();
  raw.run(
    `CREATE TABLE review_log (id INTEGER PRIMARY KEY AUTOINCREMENT, card_type TEXT NOT NULL, card_id INTEGER NOT NULL,
       grade INTEGER NOT NULL, reviewed_at TEXT NOT NULL, elapsed_ms INTEGER, stability REAL, difficulty REAL, state INTEGER);
     CREATE INDEX idx_reviewlog_revat ON review_log(reviewed_at);`,
  );
  const db = new ClientDb(raw);

  assert.equal(streakOf(db, []), 0, "no reviews → 0");
  assert.equal(streakOf(db, [0]), 1, "today only → 1");
  assert.equal(streakOf(db, [0, 0, 1, 2]), 3, "dupes on a day count once → 3");
  assert.equal(streakOf(db, [0, 1, 3]), 2, "a gap breaks the run → 2");
  assert.equal(streakOf(db, [1, 2]), 2, "no review yet today holds to yesterday → 2");
  assert.equal(streakOf(db, [2, 3]), 0, "last review 2 days ago → broken → 0");

  // A long but sub-window streak: stays on the bounded path, must not under-count.
  assert.equal(streakOf(db, Array.from({ length: 350 }, (_, i) => i)), 350, "350-day streak (bounded path)");

  // Saturates the 400-day window → must re-widen to all history, never capped at 400.
  assert.equal(streakOf(db, Array.from({ length: 410 }, (_, i) => i)), 410, "410-day streak (re-widen path, uncapped)");

  raw.close();
});
