import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import initSqlJs from "sql.js";
import { copyTable, stampVersion, readVersion } from "../lib/clientDb.ts";

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
