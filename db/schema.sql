-- Akari — SQLite schema.
-- Applied once by `npm run seed` before ingestion. All content tables are
-- filled ONLY from validated open datasets (JMdict, KANJIDIC2, KanjiVG,
-- Tatoeba, Kaishi 1.5k) — never from an LLM.

PRAGMA foreign_keys = ON;

-- ── Reference: kana ──────────────────────────────────────────────────────────
-- Deterministic gojūon table (hiragana + katakana). Static reference data,
-- not generated content. romaji = standard Hepburn.
CREATE TABLE IF NOT EXISTS kana (
  id        INTEGER PRIMARY KEY,
  char      TEXT NOT NULL,
  romaji    TEXT NOT NULL,
  type      TEXT NOT NULL CHECK (type IN ('hiragana', 'katakana')),
  row       INTEGER,                 -- gojūon row index (a/ka/sa/…)
  col       INTEGER,                 -- column within the row (a/i/u/e/o)
  group_tag TEXT NOT NULL CHECK (group_tag IN ('gojuon', 'dakuten', 'handakuten', 'combo'))
);

-- ── Vocabulary (Kaishi 1.5k order, enriched from JMdict) ──────────────────────
CREATE TABLE IF NOT EXISTS words (
  id             INTEGER PRIMARY KEY,
  kaishi_order   INTEGER,            -- study sequence from the Kaishi deck
  expression     TEXT NOT NULL,      -- canonical surface form (from Kaishi)
  reading        TEXT NOT NULL,      -- canonical reading (from Kaishi)
  furigana       TEXT,               -- Kaishi Word Furigana ruby, e.g. "好[す]き" (validated; filled by augment-kaishi)
  meaning_en     TEXT NOT NULL,      -- gloss from the JMdict entry matched by (expr+reading)
  meaning_es     TEXT,               -- EN→ES translation (build-time, cached in db/translations.es.json)
  meaning_source TEXT NOT NULL CHECK (meaning_source IN ('jmdict', 'kaishi')),
  frequency      INTEGER,            -- lower = more frequent (from JMdict nfXX / Kaishi)
  jlpt           INTEGER,            -- best-effort; may be NULL at word level
  audio_path     TEXT                -- native word-pronunciation audio (from Kaishi)
);

-- ── Kanji (KANJIDIC2 + KanjiVG stroke-order SVG) ──────────────────────────────
CREATE TABLE IF NOT EXISTS kanji (
  id           INTEGER PRIMARY KEY,
  literal      TEXT NOT NULL UNIQUE,
  jlpt         INTEGER,              -- KANJIDIC2 old 1–4 scale
  grade        INTEGER,              -- school grade (1–6 jōyō, 8 secondary, 9/10 jinmeiyō)
  frequency    INTEGER,              -- newspaper frequency rank (1 = most frequent)
  stroke_count INTEGER,
  meanings     TEXT,                 -- JSON array of English meanings
  meanings_es  TEXT,                 -- JSON array of Spanish meanings (parallel to meanings)
  on_readings  TEXT,                 -- JSON array (katakana)
  kun_readings TEXT,                 -- JSON array (hiragana)
  kanjivg_svg  TEXT                  -- raw SVG markup with kvg:* stroke metadata
);

CREATE TABLE IF NOT EXISTS word_kanji (
  word_id  INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  kanji_id INTEGER NOT NULL REFERENCES kanji(id) ON DELETE CASCADE,
  PRIMARY KEY (word_id, kanji_id)
);

-- ── Example sentences (Tatoeba primary, Kaishi bundled fallback) ──────────────
CREATE TABLE IF NOT EXISTS sentences (
  id       INTEGER PRIMARY KEY,
  jp       TEXT NOT NULL,
  en       TEXT,
  es       TEXT,                     -- EN→ES translation (build-time, cached)
  furigana TEXT,                     -- canonical Kaishi Sentence Furigana ruby (validated; Kaishi sentences only)
  source   TEXT NOT NULL CHECK (source IN ('tatoeba', 'kaishi'))
);

CREATE TABLE IF NOT EXISTS sentence_audio (
  sentence_id INTEGER NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,         -- path under /public/audio/...
  license     TEXT,                  -- required for CC-BY attribution
  attribution TEXT,
  PRIMARY KEY (sentence_id, file_path)
);

CREATE TABLE IF NOT EXISTS word_sentences (
  word_id     INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  sentence_id INTEGER NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  rank        INTEGER NOT NULL DEFAULT 0,  -- relevance ordering, 0 = best
  PRIMARY KEY (word_id, sentence_id)
);

-- ── SRS state & history (fed by ts-fsrs) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  card_type   TEXT NOT NULL CHECK (card_type IN ('kana', 'word', 'kanji')),
  card_id     INTEGER NOT NULL,
  grade       INTEGER NOT NULL,      -- ts-fsrs Rating: 1=Again 2=Hard 3=Good 4=Easy
  reviewed_at TEXT NOT NULL,         -- ISO 8601
  elapsed_ms  INTEGER,               -- time spent answering
  stability   REAL,                  -- FSRS snapshot after this review
  difficulty  REAL,
  state       INTEGER                -- ts-fsrs State after review
);

-- One row per learnable item; the live FSRS state the scheduler reads/writes.
-- fsrs_card holds the canonical ts-fsrs Card JSON (source of truth handed back
-- to the scheduler); the other columns are denormalized for fast queue queries.
CREATE TABLE IF NOT EXISTS card_state (
  card_type       TEXT NOT NULL CHECK (card_type IN ('kana', 'word', 'kanji')),
  card_id         INTEGER NOT NULL,
  fsrs_card       TEXT NOT NULL,     -- ts-fsrs Card serialized as JSON
  fsrs_stability  REAL,
  fsrs_difficulty REAL,
  fsrs_reps       INTEGER NOT NULL DEFAULT 0,
  fsrs_lapses     INTEGER NOT NULL DEFAULT 0,
  due             TEXT,              -- ISO 8601; NULL until introduced
  state           INTEGER NOT NULL DEFAULT 0,  -- 0=New 1=Learning 2=Review 3=Relearning
  last_review     TEXT,
  introduced_at   TEXT,             -- NULL until first shown (enforces new/day limit)
  PRIMARY KEY (card_type, card_id)
);

-- ── Metadata & settings ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingest_meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_words_order      ON words(kaishi_order);
CREATE INDEX IF NOT EXISTS idx_cardstate_due    ON card_state(due);
CREATE INDEX IF NOT EXISTS idx_cardstate_intro  ON card_state(introduced_at);
CREATE INDEX IF NOT EXISTS idx_reviewlog_card   ON review_log(card_type, card_id);
CREATE INDEX IF NOT EXISTS idx_wordsent_word    ON word_sentences(word_id);
CREATE INDEX IF NOT EXISTS idx_wordkanji_kanji  ON word_kanji(kanji_id);
