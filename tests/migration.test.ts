import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import initSqlJs from "sql.js";
import { copyTable, stampVersion, readVersion, buildCardIdRemap, remapProgressSnapshot, snapshotProgress, applyProgressSnapshot } from "../lib/clientDb.ts";

// The content-version upgrade must carry the user's PROGRESS (SRS state, review
// history, settings incl. the API key) into the new seed without loss, while the
// new content (e.g. the furigana column) stays intact. This exercises the exact
// copyTable/stampVersion helpers loadClientDb() uses on an upgrade.
const DB = "data/app.db";

test("content upgrade preserves progress and keeps new content", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  const bytes = readFileSync(DB);

  // OLD cached DB: same shape, but stamp distinctive user progress + no version.
  const oldDb = new SQL.Database(bytes);
  const firstWord = oldDb.exec("SELECT card_id FROM card_state WHERE card_type='word' LIMIT 1")[0].values[0][0] as number;
  oldDb.run("UPDATE card_state SET introduced_at='2026-06-20T10:00:00.000Z', state=2, fsrs_reps=4 WHERE card_type='word' AND card_id=?", [firstWord]);
  oldDb.run("INSERT INTO review_log (card_type, card_id, grade, reviewed_at, elapsed_ms, stability, difficulty, state) VALUES ('word', ?, 3, '2026-06-20T10:00:00.000Z', 1500, 9.9, 5.1, 2)", [firstWord]);
  oldDb.run("INSERT OR REPLACE INTO settings (key,value) VALUES ('anthropic_api_key', 'sk-ant-TESTKEY')");
  oldDb.run("INSERT OR REPLACE INTO settings (key,value) VALUES ('new_per_day', '7')");
  assert.equal(readVersion(oldDb), 0, "old DB has no content version");

  // NEW seed DB: the shipped content (with furigana), fresh progress.
  const newDb = new SQL.Database(bytes);
  const furiganaCol = (newDb.exec("PRAGMA table_info(words)")[0].values as unknown[][]).some((c) => c[1] === "furigana");
  assert.ok(furiganaCol, "seed must carry the new furigana column");

  // Upgrade: carry progress over, stamp the version.
  for (const t of ["card_state", "review_log", "settings"]) copyTable(oldDb, newDb, t);
  stampVersion(newDb, 2);

  // SRS progress carried over.
  const cs = newDb.exec("SELECT introduced_at, state, fsrs_reps FROM card_state WHERE card_type='word' AND card_id=?", [firstWord])[0].values[0];
  assert.equal(cs[0], "2026-06-20T10:00:00.000Z", "introduced_at preserved");
  assert.equal(cs[1], 2, "FSRS state preserved");
  assert.equal(cs[2], 4, "reps preserved");

  // Review history carried over.
  const logs = newDb.exec("SELECT count(*) FROM review_log")[0].values[0][0] as number;
  assert.ok(logs >= 1, "review_log row preserved");

  // Settings incl. the API key carried over.
  const key = newDb.exec("SELECT value FROM settings WHERE key='anthropic_api_key'")[0].values[0][0];
  assert.equal(key, "sk-ant-TESTKEY", "API key preserved");
  assert.equal(newDb.exec("SELECT value FROM settings WHERE key='new_per_day'")[0].values[0][0], "7", "preference preserved");

  // New content intact + version stamped.
  const furiCount = newDb.exec("SELECT count(*) FROM words WHERE furigana IS NOT NULL")[0].values[0][0] as number;
  assert.ok(furiCount > 1000, `furigana content intact (${furiCount})`);
  assert.equal(readVersion(newDb), 2, "content version stamped");

  oldDb.close();
  newDb.close();
});

// Kanji ids are assigned in discovery order, so a content rebuild that changes the
// word set can SHIFT them. Carrying progress by raw card_id would then silently
// re-attach a card to the wrong kanji. The upgrade must carry progress by NATURAL
// KEY (literal/expression/char) instead. This is the case the test above can't see,
// because it reuses identical bytes (no id drift).
const MINI = `
  CREATE TABLE words (id INTEGER PRIMARY KEY, expression TEXT, reading TEXT);
  CREATE TABLE kanji (id INTEGER PRIMARY KEY, literal TEXT);
  CREATE TABLE kana  (id INTEGER PRIMARY KEY, char TEXT);
  CREATE TABLE card_state (card_type TEXT, card_id INTEGER, fsrs_reps INTEGER, state INTEGER, PRIMARY KEY (card_type, card_id));
  CREATE TABLE review_log (id INTEGER PRIMARY KEY AUTOINCREMENT, card_type TEXT, card_id INTEGER, grade INTEGER);
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT);
`;

test("upgrade re-attaches progress by natural key when kanji ids drift", async () => {
  const SQL = await initSqlJs();

  // OLD seed: 好=1, 私=2, 火=3.  user has graded 好, 私, 火, a word and a kana.
  const oldDb = new SQL.Database();
  oldDb.run(MINI);
  oldDb.run("INSERT INTO kanji (id,literal) VALUES (1,'好'),(2,'私'),(3,'火')");
  oldDb.run("INSERT INTO words (id,expression,reading) VALUES (1,'食べる','たべる')");
  oldDb.run("INSERT INTO kana (id,char) VALUES (1,'あ')");
  oldDb.run("INSERT INTO card_state VALUES ('kanji',1,5,2),('kanji',2,3,2),('kanji',3,9,2),('word',1,4,2),('kana',1,2,2)");
  oldDb.run("INSERT INTO review_log (card_type,card_id,grade) VALUES ('kanji',1,3),('kanji',3,4)");
  oldDb.run("INSERT INTO settings VALUES ('new_per_day','7')");

  // NEW seed: ids reshuffled — 私=1, 好=2, new 水=3; 火 is GONE. Ships fresh card_state.
  const newDb = new SQL.Database();
  newDb.run(MINI);
  newDb.run("INSERT INTO kanji (id,literal) VALUES (1,'私'),(2,'好'),(3,'水')");
  newDb.run("INSERT INTO words (id,expression,reading) VALUES (1,'食べる','たべる')");
  newDb.run("INSERT INTO kana (id,char) VALUES (1,'あ')");
  newDb.run("INSERT INTO card_state VALUES ('kanji',1,0,0),('kanji',2,0,0),('kanji',3,0,0),('word',1,0,0),('kana',1,0,0)");

  const remap = buildCardIdRemap(oldDb, newDb);
  assert.equal(remap.kanji.get(1), 2, "好 moved id 1 → 2");
  assert.equal(remap.kanji.get(2), 1, "私 moved id 2 → 1");
  assert.equal(remap.kanji.get(3), undefined, "火 vanished — unmapped");
  assert.equal(remap.word.get(1), 1, "word id stable");
  assert.equal(remap.kana.get(1), 1, "kana id stable");

  applyProgressSnapshot(newDb, remapProgressSnapshot(snapshotProgress(oldDb), remap), "merge");

  const reps = (type: string, id: number) =>
    newDb.exec("SELECT fsrs_reps FROM card_state WHERE card_type=? AND card_id=?", [type, id])[0].values[0][0];
  assert.equal(reps("kanji", 2), 5, "好's progress followed the literal to its new id (not stayed on 1=私)");
  assert.equal(reps("kanji", 1), 3, "私's progress followed to its new id");
  assert.equal(reps("kanji", 3), 0, "genuinely-new 水 stays fresh");
  assert.equal(reps("word", 1), 4, "word progress preserved");
  assert.equal(reps("kana", 1), 2, "kana progress preserved");

  // 火's progress was dropped, not left as an orphan pointing at a missing id.
  assert.equal(
    newDb.exec("SELECT count(*) FROM card_state WHERE card_type='kanji' AND card_id NOT IN (SELECT id FROM kanji)")[0].values[0][0],
    0, "no orphan card_state rows",
  );
  assert.equal(newDb.exec("SELECT count(*) FROM review_log WHERE card_type='kanji' AND card_id=2")[0].values[0][0], 1, "好's log remapped to id 2");
  assert.equal(
    newDb.exec("SELECT count(*) FROM review_log WHERE card_type='kanji' AND card_id NOT IN (SELECT id FROM kanji)")[0].values[0][0],
    0, "no orphan review_log rows",
  );
  assert.equal(newDb.exec("SELECT value FROM settings WHERE key='new_per_day'")[0].values[0][0], "7", "settings preserved");

  oldDb.close();
  newDb.close();
});
