import { getDb } from "./db";
import { safeParseArray } from "./json";

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
  kanjiInVocab: number;
  recentKanji: { literal: string; reading: string }[];
  // Other study surfaces, so the dashboard can be the single "today" hub.
  kanji: { due: number; newAvail: number };
  kana: { due: number; newAvail: number };
};

function cleanReading(r: string): string {
  return r.split(".")[0].replace(/[-.]/g, "");
}

export function seeded(db: ReturnType<typeof getDb> = getDb()): boolean {
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

export type AppSettings = {
  newPerDay: number;
  theme: string; // dark | indigo
  cardAnim: string; // turn | flip
  autoplay: boolean;
  reducedMotion: boolean;
  sound: boolean; // UI sound effects
  furigana: boolean; // show reading ruby over kanji
  pitch: boolean; // show the pitch-accent contour over readings
  listen: boolean; // listening mode: hear the word first instead of seeing it
  hasApiKey: boolean; // whether Explícame is configured (env OR in-app key) — never the key itself
};

export function getSettings(): AppSettings {
  return {
    newPerDay: Number(getSetting("new_per_day", "10")),
    theme: getSetting("theme", "dark"),
    cardAnim: getSetting("card_anim", "turn"),
    autoplay: getSetting("autoplay", "1") === "1",
    reducedMotion: getSetting("reduced_motion", "0") === "1",
    sound: getSetting("sound", "1") === "1",
    furigana: getSetting("furigana", "1") === "1",
    pitch: getSetting("pitch", "1") === "1",
    listen: getSetting("review_listen", "0") === "1",
    hasApiKey: !!process.env.ANTHROPIC_API_KEY || getSetting("anthropic_api_key", "").trim().length > 0,
  };
}

const count = (db: ReturnType<typeof getDb>, sql: string): number =>
  (db.prepare(sql).get() as { c: number }).c;

/** Consecutive days (ending today or yesterday) with at least one review. */
export function computeStreak(db: ReturnType<typeof getDb>): number {
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

export function getStreak(): number {
  const db = getDb();
  return seeded(db) ? computeStreak(db) : 0;
}

export function getDashboard(): DashboardData {
  const db = getDb();
  if (!seeded(db)) {
    return { seeded: false, newPerDay: 10, totals: { words: 0, kanji: 0, kana: 0 }, dueNow: 0, newRemaining: 0, reviewsToday: 0, streak: 0, kanjiInVocab: 0, recentKanji: [], kanji: { due: 0, newAvail: 0 }, kana: { due: 0, newAvail: 0 } };
  }
  const newPerDay = Number(getSetting("new_per_day", "10"));
  const recentKanji = (
    db
      .prepare(
        `SELECT literal, kun_readings, on_readings FROM kanji WHERE id IN (SELECT kanji_id FROM word_kanji)
         ORDER BY (frequency IS NULL), frequency ASC LIMIT 6`,
      )
      .all() as { literal: string; kun_readings: string; on_readings: string }[]
  ).map((k) => {
    const kun = safeParseArray(k.kun_readings);
    const on = safeParseArray(k.on_readings);
    return { literal: k.literal, reading: cleanReading(kun[0] || on[0] || "") };
  });
  // Word-scoped to match getReviewQueue / the "Empezar sesión" CTA (words only).
  const introducedToday = count(
    db,
    "SELECT count(*) c FROM card_state WHERE card_type='word' AND introduced_at IS NOT NULL AND date(introduced_at,'localtime') = date('now','localtime')",
  );
  const notIntroduced = count(db, "SELECT count(*) c FROM card_state WHERE card_type='word' AND introduced_at IS NULL");

  // Kanji (handwriting) surface — due reviews + new still available today.
  const kanjiDue = count(
    db,
    "SELECT count(*) c FROM card_state WHERE card_type='kanji' AND introduced_at IS NOT NULL AND due IS NOT NULL AND datetime(due) <= datetime('now')",
  );
  const kanjiIntroToday = count(
    db,
    "SELECT count(*) c FROM card_state WHERE card_type='kanji' AND introduced_at IS NOT NULL AND date(introduced_at,'localtime') = date('now','localtime')",
  );
  const kanjiNotIntro = count(db, "SELECT count(*) c FROM card_state WHERE card_type='kanji' AND introduced_at IS NULL");

  // Kana surface — due reviews; new room is per-script-capped, so sum both.
  const kanaDue = count(
    db,
    "SELECT count(*) c FROM card_state WHERE card_type='kana' AND introduced_at IS NOT NULL AND due IS NOT NULL AND datetime(due) <= datetime('now')",
  );
  let kanaNew = 0;
  for (const t of ["hiragana", "katakana"]) {
    const introToday = (
      db
        .prepare(
          `SELECT count(*) c FROM card_state cs JOIN kana k ON k.id = cs.card_id
           WHERE cs.card_type='kana' AND k.type = ? AND cs.introduced_at IS NOT NULL
             AND date(cs.introduced_at,'localtime') = date('now','localtime')`,
        )
        .get(t) as { c: number }
    ).c;
    const notIntro = (
      db
        .prepare(
          `SELECT count(*) c FROM card_state cs JOIN kana k ON k.id = cs.card_id
           WHERE cs.card_type='kana' AND k.type = ? AND cs.introduced_at IS NULL`,
        )
        .get(t) as { c: number }
    ).c;
    kanaNew += Math.max(0, Math.min(20 - introToday, notIntro));
  }

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
      "SELECT count(*) c FROM card_state WHERE card_type='word' AND introduced_at IS NOT NULL AND due IS NOT NULL AND datetime(due) <= datetime('now')",
    ),
    newRemaining: Math.max(0, Math.min(newPerDay - introducedToday, notIntroduced)),
    reviewsToday: count(db, "SELECT count(*) c FROM review_log WHERE date(reviewed_at,'localtime') = date('now','localtime')"),
    streak: computeStreak(db),
    kanjiInVocab: count(db, "SELECT count(DISTINCT kanji_id) c FROM word_kanji"),
    recentKanji,
    kanji: { due: kanjiDue, newAvail: Math.max(0, Math.min(newPerDay - kanjiIntroToday, kanjiNotIntro)) },
    kana: { due: kanaDue, newAvail: kanaNew },
  };
}
