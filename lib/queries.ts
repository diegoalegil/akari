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
  everReviewed: boolean; // false on a brand-new account → show the intro
  streak: number;
  kanjiInVocab: number;
  recentKanji: { literal: string; reading: string }[];
  // Other study surfaces, so the dashboard can be the single "today" hub.
  kanji: { due: number; newAvail: number };
  kana: { due: number; newAvail: number; script: string };
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

export type WordOfDay = {
  expression: string;
  reading: string;
  furigana: string | null;
  pitchAccent: number | null;
  pitchReading: string | null;
  meaning: string;
  audio: string | null;
  sentence: { jp: string; furigana: string | null; es: string | null; audio: string | null } | null;
  status: "new" | "learning" | "known";
};

/** A word to showcase on the dashboard — deterministic by LOCAL date (the same all
 *  day, identical across reloads, cycling through the deck). Pure read of validated
 *  data; nothing generated. */
export function getWordOfDay(): WordOfDay | null {
  const db = getDb();
  if (!seeded(db)) return null;
  const where = "pitch_accent IS NOT NULL AND audio_path IS NOT NULL AND furigana IS NOT NULL";
  const total = (db.prepare(`SELECT count(*) c FROM words WHERE ${where}`).get() as { c: number }).c;
  if (!total) return null;
  const offset = (db.prepare("SELECT CAST(julianday(date('now','localtime')) AS INTEGER) % ? AS o").get(total) as { o: number }).o;
  const w = db
    .prepare(
      `SELECT id, expression, reading, furigana, pitch_accent, pitch_reading, COALESCE(meaning_es, meaning_en) meaning, audio_path
       FROM words WHERE ${where} ORDER BY kaishi_order ASC LIMIT 1 OFFSET ?`,
    )
    .get(offset) as Record<string, unknown> | undefined;
  if (!w) return null;
  const s = db
    .prepare(
      `SELECT s.jp jp, s.furigana furigana, s.es es, s.en en,
              (SELECT file_path FROM sentence_audio WHERE sentence_id = s.id LIMIT 1) audio
       FROM word_sentences ws JOIN sentences s ON s.id = ws.sentence_id WHERE ws.word_id = ? ORDER BY ws.rank ASC LIMIT 1`,
    )
    .get(w.id) as Record<string, unknown> | undefined;
  const cs = db.prepare("SELECT state, introduced_at FROM card_state WHERE card_type='word' AND card_id = ?").get(w.id) as Record<string, unknown> | undefined;
  const status = !cs || cs.introduced_at == null ? "new" : cs.state === 2 ? "known" : "learning";
  return {
    expression: w.expression as string,
    reading: w.reading as string,
    furigana: (w.furigana as string) ?? null,
    pitchAccent: (w.pitch_accent as number) ?? null,
    pitchReading: (w.pitch_reading as string) ?? null,
    meaning: w.meaning as string,
    audio: (w.audio_path as string) ?? null,
    sentence: s ? { jp: s.jp as string, furigana: (s.furigana as string) ?? null, es: ((s.es as string) ?? (s.en as string)) ?? null, audio: (s.audio as string) ?? null } : null,
    status: status as "new" | "learning" | "known",
  };
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
  reviewMode: string; // normal (see word) | listen (hear it) | produce (see meaning)
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
    reviewMode: getSetting("review_mode", "normal"),
    hasApiKey: !!process.env.ANTHROPIC_API_KEY || getSetting("anthropic_api_key", "").trim().length > 0,
  };
}

const count = (db: ReturnType<typeof getDb>, sql: string): number =>
  (db.prepare(sql).get() as { c: number }).c;

// A streak can't be longer than the user's history, and the home dashboard only
// needs the most recent contiguous run — so the DISTINCT-date scan is bounded to
// this many days instead of all of review_log (which grows unbounded: a 2-year
// daily user has ~36k rows, and this scan was by far the costliest dashboard
// query). The window is backed by idx_reviewlog_revat so it's an index range
// seek, not a full scan. Comfortably larger than any plausible streak; if one
// somehow reaches the window edge, computeStreak recomputes unbounded, so the
// result is never capped — only the common case is bounded.
const STREAK_WINDOW_DAYS = 400;

/** Count consecutive days (ending today or yesterday) from a DESC list of the
 *  distinct local review dates. */
function streakFromDays(db: ReturnType<typeof getDb>, days: string[]): number {
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

/** Consecutive days (ending today or yesterday) with at least one review. */
export function computeStreak(db: ReturnType<typeof getDb>): number {
  // `reviewed_at` is a UTC ISO timestamp (Date.toISOString), so a plain string
  // `>=` against a UTC date bounds the rows; the local-date bucketing still runs
  // in SQL exactly as before.
  const windowed = (
    db
      .prepare(
        "SELECT DISTINCT date(reviewed_at, 'localtime') d FROM review_log WHERE reviewed_at >= date('now', ?) ORDER BY d DESC",
      )
      .all(`-${STREAK_WINDOW_DAYS} days`) as { d: string }[]
  ).map((r) => r.d);
  const streak = streakFromDays(db, windowed);
  // A run that reaches back to the window edge may continue beyond it — recompute
  // over all history so the count is never capped. Rare: only a streak of
  // STREAK_WINDOW_DAYS+ ever gets here, where one extra full scan is acceptable.
  if (streak < STREAK_WINDOW_DAYS) return streak;
  const all = (
    db
      .prepare("SELECT DISTINCT date(reviewed_at, 'localtime') d FROM review_log ORDER BY d DESC")
      .all() as { d: string }[]
  ).map((r) => r.d);
  return streakFromDays(db, all);
}

export function getStreak(): number {
  const db = getDb();
  return seeded(db) ? computeStreak(db) : 0;
}

export function getDashboard(): DashboardData {
  const db = getDb();
  if (!seeded(db)) {
    return { seeded: false, newPerDay: 10, totals: { words: 0, kanji: 0, kana: 0 }, dueNow: 0, newRemaining: 0, reviewsToday: 0, everReviewed: false, streak: 0, kanjiInVocab: 0, recentKanji: [], kanji: { due: 0, newAvail: 0 }, kana: { due: 0, newAvail: 0, script: "hiragana" } };
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

  // Kana surface — due reviews + new room (per-script-capped), and the script
  // with the most to do so the hero/chain can deep-link into its drill.
  let kanaDue = 0, kanaNew = 0, kanaScript = "hiragana", kanaBest = -1;
  for (const t of ["hiragana", "katakana"]) {
    const dueT = (
      db
        .prepare(
          `SELECT count(*) c FROM card_state cs JOIN kana k ON k.id = cs.card_id
           WHERE cs.card_type='kana' AND k.type = ? AND cs.introduced_at IS NOT NULL
             AND cs.due IS NOT NULL AND datetime(cs.due) <= datetime('now')`,
        )
        .get(t) as { c: number }
    ).c;
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
    const newT = Math.max(0, Math.min(20 - introToday, notIntro));
    kanaDue += dueT;
    kanaNew += newT;
    if (dueT + newT > kanaBest) {
      kanaBest = dueT + newT;
      kanaScript = t;
    }
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
    everReviewed: count(db, "SELECT count(*) c FROM review_log") > 0,
    streak: computeStreak(db),
    kanjiInVocab: count(db, "SELECT count(DISTINCT kanji_id) c FROM word_kanji"),
    recentKanji,
    kanji: { due: kanjiDue, newAvail: Math.max(0, Math.min(newPerDay - kanjiIntroToday, kanjiNotIntro)) },
    kana: { due: kanaDue, newAvail: kanaNew, script: kanaScript },
  };
}
