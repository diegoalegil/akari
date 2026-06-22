import "server-only";
import { getDb } from "./db";

// Read helpers for server components. The SRS queue logic here is intentionally
// simple for Phase 2 (the full grading loop lands in Phase 4): new cards have
// introduced_at = NULL and are introduced up to new_per_day; reviews are
// introduced cards whose due has passed.

export type DashboardData = {
  seeded: boolean;
  newPerDay: number;
  totals: { words: number; kanji: number; kana: number };
  dueNow: number;
  newRemaining: number;
  reviewsToday: number;
  streak: number;
};

function seeded(db: ReturnType<typeof getDb>): boolean {
  const row = db
    .prepare("SELECT count(*) c FROM sqlite_master WHERE type='table' AND name='words'")
    .get() as { c: number };
  return row.c > 0;
}

export function getIngestMeta(): Record<string, string> {
  const db = getDb();
  if (!seeded(db)) return {};
  const rows = db.prepare("SELECT key, value FROM ingest_meta").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function getSetting(key: string, fallback: string): string {
  const db = getDb();
  if (!seeded(db)) return fallback;
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? fallback;
}

const count = (db: ReturnType<typeof getDb>, sql: string): number =>
  (db.prepare(sql).get() as { c: number }).c;

/** Consecutive days (ending today or yesterday) with at least one review. */
function computeStreak(db: ReturnType<typeof getDb>): number {
  const days = (
    db
      .prepare("SELECT DISTINCT date(reviewed_at, 'localtime') d FROM review_log ORDER BY d DESC")
      .all() as { d: string }[]
  ).map((r) => r.d);
  if (days.length === 0) return 0;

  const today = (db.prepare("SELECT date('now','localtime') d").get() as { d: string }).d;
  const dayMs = 86_400_000;
  const toUTC = (s: string) => Date.parse(s + "T00:00:00Z");
  // Allow the streak to "hold" if the user simply hasn't reviewed yet today.
  let cursor = toUTC(today);
  if (days[0] !== today) cursor -= dayMs; // anchor to yesterday
  let streak = 0;
  for (const d of days) {
    if (toUTC(d) === cursor) {
      streak++;
      cursor -= dayMs;
    } else if (toUTC(d) < cursor) {
      break;
    }
  }
  return streak;
}

export function getDashboard(): DashboardData {
  const db = getDb();
  if (!seeded(db)) {
    return { seeded: false, newPerDay: 10, totals: { words: 0, kanji: 0, kana: 0 }, dueNow: 0, newRemaining: 0, reviewsToday: 0, streak: 0 };
  }
  const newPerDay = Number(getSetting("new_per_day", "10"));
  const introducedToday = count(
    db,
    "SELECT count(*) c FROM card_state WHERE introduced_at IS NOT NULL AND date(introduced_at,'localtime') = date('now','localtime')",
  );
  const notIntroduced = count(db, "SELECT count(*) c FROM card_state WHERE introduced_at IS NULL");

  return {
    seeded: true,
    newPerDay,
    totals: {
      words: count(db, "SELECT count(*) c FROM words"),
      kanji: count(db, "SELECT count(*) c FROM kanji"),
      kana: count(db, "SELECT count(*) c FROM kana"),
    },
    dueNow: count(
      db,
      "SELECT count(*) c FROM card_state WHERE introduced_at IS NOT NULL AND due IS NOT NULL AND datetime(due) <= datetime('now')",
    ),
    newRemaining: Math.max(0, Math.min(newPerDay - introducedToday, notIntroduced)),
    reviewsToday: count(db, "SELECT count(*) c FROM review_log WHERE date(reviewed_at,'localtime') = date('now','localtime')"),
    streak: computeStreak(db),
  };
}
