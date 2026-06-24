import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import { Rating, type Grade } from "ts-fsrs";
import { applyGrade, cardColumns, reviveCard } from "../lib/fsrs.ts";
import {
  ClientDb,
  snapshotProgress,
  applyProgressSnapshot,
  overlayReplaces,
  copyTable,
  stampVersion,
  readVersion,
  type ProgressSnapshot,
} from "../lib/clientDb.ts";

// Guards the incremental-persistence path against losing or mangling the user's
// irreplaceable FSRS progress. The app now persists only the three progress
// tables (an "overlay") on every grade and re-exports the whole 12.7 MB DB only
// on seed/upgrade/flush; on load the overlay is folded back over the checkpoint.
// These tests prove that fold-back reproduces the authoritative in-memory state
// (== what a full export serializes) EXACTLY — every fsrs field, due date,
// review_log row and setting — across replace, the content-upgrade merge,
// deletions, the IndexedDB structured-clone round-trip, the full-export round-
// trip, the stale-overlay guard, and the statement-cache/export interaction.
// Run against the REAL seed so it's representative.
const DB = "data/app.db";
const PROGRESS_TABLES = ["card_state", "review_log", "settings"] as const;
const ORDER: Record<string, string> = { card_state: "card_type, card_id", review_log: "id", settings: "key" };

// Mirrors app/review/actions.ts gradeCard EXACTLY (ts-fsrs + the same UPDATE and
// INSERT), but against a caller-supplied ClientDb so the shim — including the new
// read-statement cache — is exercised on the real write path.
function grade(db: ClientDb, cardType: string, cardId: number, g: Grade, elapsedMs: number, now: Date): void {
  const row = db
    .prepare("SELECT fsrs_card, introduced_at FROM card_state WHERE card_type = ? AND card_id = ?")
    .get(cardType, cardId) as { fsrs_card: string; introduced_at: string | null } | undefined;
  assert.ok(row, `card_state row exists for ${cardType}/${cardId}`);
  const { card } = applyGrade(reviveCard(row!.fsrs_card), g, now);
  const cols = cardColumns(card);
  const introducedAt = row!.introduced_at ?? now.toISOString();
  db.transaction(() => {
    db.prepare(
      `UPDATE card_state SET fsrs_card=?, fsrs_stability=?, fsrs_difficulty=?, fsrs_reps=?, fsrs_lapses=?,
        due=?, state=?, last_review=?, introduced_at=? WHERE card_type=? AND card_id=?`,
    ).run(
      cols.fsrs_card, cols.fsrs_stability, cols.fsrs_difficulty, cols.fsrs_reps, cols.fsrs_lapses,
      card.due.toISOString(), cols.state, cols.last_review, introducedAt, cardType, cardId,
    );
    db.prepare(
      "INSERT INTO review_log (card_type, card_id, grade, reviewed_at, elapsed_ms, stability, difficulty, state) VALUES (?,?,?,?,?,?,?,?)",
    ).run(cardType, cardId, g, now.toISOString(), Math.round(elapsedMs) || null, card.stability, card.difficulty, card.state);
  })();
}

function dump(db: SqlJsDatabase, table: string, orderBy: string): { columns: string[]; values: unknown[][] } {
  const r = db.exec(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
  return r.length ? { columns: r[0].columns, values: r[0].values as unknown[][] } : { columns: [], values: [] };
}
function assertProgressIdentical(actual: SqlJsDatabase, expected: SqlJsDatabase, msg: string): void {
  for (const t of PROGRESS_TABLES) {
    assert.deepEqual(dump(actual, t, ORDER[t]), dump(expected, t, ORDER[t]), `${msg}: ${t} must be byte-identical`);
  }
}
const reps = (db: SqlJsDatabase, id: number): number =>
  db.exec("SELECT fsrs_reps FROM card_state WHERE card_type='word' AND card_id=?", [id])[0].values[0][0] as number;

// Drive a representative study session (all four ratings + a re-review) onto a
// fresh ClientDb opened from `bytes`, with a deterministic clock. graded.raw is
// then the "full-export baseline": exactly what the old whole-DB persist wrote.
function playSession(SQL: Awaited<ReturnType<typeof initSqlJs>>, bytes: Uint8Array): { db: ClientDb; ids: number[] } {
  const db = new ClientDb(new SQL.Database(bytes));
  const ids = (db.prepare("SELECT card_id FROM card_state WHERE card_type='word' ORDER BY card_id LIMIT 5").all() as { card_id: number }[]).map((r) => r.card_id);
  assert.equal(ids.length, 5, "need 5 word cards to grade");
  const ratings: Grade[] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy, Rating.Good];
  const t0 = Date.parse("2026-06-24T09:00:00.000Z");
  ids.forEach((id, i) => grade(db, "word", id, ratings[i], 1500 + i * 250, new Date(t0 + i * 60_000)));
  grade(db, "word", ids[0], Rating.Good, 1800, new Date(t0 + 10 * 60_000)); // re-review → 2 reps, 2nd log row
  db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('new_per_day', ?)").run("7");
  db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('theme', ?)").run("indigo");
  db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('anthropic_api_key', ?)").run("sk-ant-ROUNDTRIP");
  return { db, ids };
}

test("incremental overlay reproduces the full-export baseline byte-for-byte", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  const seed = readFileSync(DB);
  const { db: graded, ids } = playSession(SQL, seed);

  // INCREMENTAL = a clean seed + the progress overlay folded back on (replace).
  const snap = snapshotProgress(graded.raw);
  const rebuilt = new SQL.Database(seed);
  applyProgressSnapshot(rebuilt, snap, "replace");

  // Every progress field equals the authoritative graded state (== a full export).
  assertProgressIdentical(rebuilt, graded.raw, "overlay replace");

  // Explicit FSRS-field spot check on a graded card (per the brief).
  const cs = (sel: SqlJsDatabase) =>
    sel.exec(
      "SELECT fsrs_card, fsrs_stability, fsrs_difficulty, fsrs_reps, fsrs_lapses, due, state, last_review, introduced_at FROM card_state WHERE card_type='word' AND card_id=?",
      [ids[0]],
    )[0].values[0];
  assert.deepEqual(cs(rebuilt), cs(graded.raw), "re-reviewed card's FSRS state preserved");
  assert.equal(reps(rebuilt, ids[0]), 2, "the re-reviewed card really advanced to 2 reps");
  assert.equal(rebuilt.exec("SELECT count(*) FROM review_log")[0].values[0][0], 6, "5 first-reviews + 1 re-review = 6 log rows");
  assert.equal(
    rebuilt.exec("SELECT value FROM settings WHERE key='anthropic_api_key'")[0].values[0][0],
    "sk-ant-ROUNDTRIP",
    "API key preserved through the overlay",
  );
  // Content tables are NOT carried by the overlay — they come from the seed and
  // stay fully intact (the overlay only ever touches the three progress tables).
  assert.ok((rebuilt.exec("SELECT count(*) FROM words WHERE furigana IS NOT NULL")[0].values[0][0] as number) > 1000, "seed content intact");

  graded.raw.close();
  rebuilt.close();
});

test("a full export round-trips the same progress (the baseline path + cache clear)", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  const seed = readFileSync(DB);
  const { db: graded } = playSession(SQL, seed);
  const before = PROGRESS_TABLES.map((t) => dump(graded.raw, t, ORDER[t]));

  const bytes = graded.export(); // ClientDb.export(): drops the (now-stale) statement cache
  graded.raw.close();
  const reopened = new SQL.Database(bytes);
  PROGRESS_TABLES.forEach((t, i) => assert.deepEqual(dump(reopened, t, ORDER[t]), before[i], `${t} survives a full export`));
  reopened.close();
});

test("replace preserves review_log AUTOINCREMENT so the next grade can't collide", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  const seed = readFileSync(DB);
  const { db: graded } = playSession(SQL, seed); // leaves 6 review_log rows (ids 1..6)
  const snap = snapshotProgress(graded.raw);

  const rebuilt = new SQL.Database(seed); // a clean seed (empty review_log, sequence at 0)
  applyProgressSnapshot(rebuilt, snap, "replace"); // DELETE + re-INSERT explicit ids 1..6
  const maxId = rebuilt.exec("SELECT max(id) FROM review_log")[0].values[0][0] as number;

  // A subsequent grade INSERTs without an explicit id; AUTOINCREMENT must hand
  // out maxId+1, not reuse an id — else the user's next review row collides.
  rebuilt.run("INSERT INTO review_log (card_type,card_id,grade,reviewed_at,elapsed_ms,stability,difficulty,state) VALUES ('word',2,4,'t',200,1.5,2.5,2)");
  const dupes = rebuilt.exec("SELECT id FROM review_log GROUP BY id HAVING count(*) > 1");
  assert.equal(dupes.length, 0, "no duplicate review_log ids after a post-restore insert");
  assert.equal(rebuilt.exec("SELECT id FROM review_log WHERE card_id=2 AND reviewed_at='t'")[0].values[0][0], maxId + 1, "AUTOINCREMENT continued past the restored rows");
  assert.equal(rebuilt.exec("PRAGMA integrity_check")[0].values[0][0], "ok", "DB intact");

  graded.raw.close();
  rebuilt.close();
});

test("overlay survives the IndexedDB structured-clone envelope", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  const seed = readFileSync(DB);
  const { db: graded } = playSession(SQL, seed);

  // IndexedDB stores a structured clone; structuredClone models that round-trip
  // for the plain {gen, contentVersion, tables} envelope exactly.
  const cloned = structuredClone({ gen: 1, ...snapshotProgress(graded.raw) }) as ProgressSnapshot;
  const rebuilt = new SQL.Database(seed);
  applyProgressSnapshot(rebuilt, cloned, "replace");

  assertProgressIdentical(rebuilt, graded.raw, "overlay after structured clone");
  graded.raw.close();
  rebuilt.close();
});

test("replace mode honours deletions (cleared API key, reset history)", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  const seed = readFileSync(DB);
  const { db: graded } = playSession(SQL, seed);

  // The user then clears their API key and resets progress (the two DELETE paths
  // in app/settings/actions.ts). A row-delta couldn't express these; a full-table
  // snapshot can.
  graded.prepare("DELETE FROM settings WHERE key='anthropic_api_key'").run();
  graded.prepare("DELETE FROM review_log").run();

  const snap = snapshotProgress(graded.raw);
  const rebuilt = new SQL.Database(seed); // a clean seed that had NEITHER deletion applied
  applyProgressSnapshot(rebuilt, snap, "replace");

  assertProgressIdentical(rebuilt, graded.raw, "deletions");
  assert.equal(rebuilt.exec("SELECT count(*) FROM settings WHERE key='anthropic_api_key'")[0].values[0][0], 0, "API key deletion applied");
  assert.equal(rebuilt.exec("SELECT count(*) FROM review_log")[0].values[0][0], 0, "review_log cleared");
  // content_version (a setting) must NOT have been collaterally wiped by replace.
  assert.equal(readVersion(rebuilt), readVersion(graded.raw), "content_version setting preserved through replace");

  graded.raw.close();
  rebuilt.close();
});

test("content upgrade merges a FRESHER overlay onto the new seed (no graded card lost)", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  const seed = readFileSync(DB);
  const { db: graded, ids } = playSession(SQL, seed);
  const firstId = ids[0];

  // The cached checkpoint (`sqlite` blob) holds the progress as of HERE — 2 reps.
  const baseSnap = snapshotProgress(graded.raw);
  assert.equal(reps(graded.raw, firstId), 2, "checkpoint holds 2 reps for the first card");

  // The user then grades once MORE. Only the overlay (a generation ahead of the
  // checkpoint) captures this — the exact "graded, then a content upgrade
  // dropped" scenario the audit flagged as risky.
  grade(graded, "word", firstId, Rating.Easy, 1200, new Date(Date.parse("2026-06-24T12:00:00.000Z")));
  const overlaySnap = snapshotProgress(graded.raw);
  assert.equal(reps(graded.raw, firstId), 3, "overlay holds the extra re-review (3 reps)");

  // Upgrade: reconstruct the STALE cached base (2 reps), then a new seed ←
  // copyTable from that base, THEN the fresher overlay merged on top (this is
  // clientDb's upgradeToSeed logic).
  const oldBase = new SQL.Database(seed);
  applyProgressSnapshot(oldBase, baseSnap, "replace");
  const newSeed = new SQL.Database(seed);
  assert.ok((newSeed.exec("PRAGMA table_info(words)")[0].values as unknown[][]).some((c) => c[1] === "furigana"), "seed carries new content");
  for (const t of PROGRESS_TABLES) copyTable(oldBase, newSeed, t); // carries base progress (2 reps)
  applyProgressSnapshot(newSeed, overlaySnap, "merge"); // overlay wins → 3 reps
  stampVersion(newSeed, 3);

  assert.equal(reps(newSeed, firstId), 3, "the overlay's extra review survived the SEED_VERSION bump (not just the staler base)");
  assert.equal(newSeed.exec("SELECT value FROM settings WHERE key='anthropic_api_key'")[0].values[0][0], "sk-ant-ROUNDTRIP", "API key carried across upgrade");
  assert.ok((newSeed.exec("SELECT count(*) FROM review_log")[0].values[0][0] as number) >= 6, "review history carried across upgrade");
  assert.ok((newSeed.exec("SELECT count(*) FROM words WHERE furigana IS NOT NULL")[0].values[0][0] as number) > 1000, "new content intact after upgrade");
  assert.equal(readVersion(newSeed), 3, "version stamped");

  graded.raw.close();
  oldBase.close();
  newSeed.close();
});

test("merge onto a NEWER seed keeps cards the overlay never knew about", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  const seed = readFileSync(DB);
  const { db: graded } = playSession(SQL, seed);
  const snap = snapshotProgress(graded.raw);

  // New seed gains an extra (hypothetical) future card the overlay never saw.
  const newSeed = new SQL.Database(seed);
  const maxId = newSeed.exec("SELECT max(card_id) FROM card_state WHERE card_type='word'")[0].values[0][0] as number;
  const ghostId = maxId + 1;
  newSeed.run("INSERT INTO card_state (card_type, card_id, fsrs_card, fsrs_reps, fsrs_lapses, state) VALUES ('word', ?, '{}', 0, 0, 0)", [ghostId]);

  applyProgressSnapshot(newSeed, snap, "merge"); // merge must not delete the new card
  const ghost = newSeed.exec("SELECT card_id FROM card_state WHERE card_type='word' AND card_id=?", [ghostId]);
  assert.ok(ghost.length && ghost[0].values.length, "a card present only in the newer seed survives a merge");
  graded.raw.close();
  newSeed.close();
});

test("overlayReplaces guards against a stale overlay regressing progress", () => {
  const tablesStub = { card_state: { columns: [], values: [] }, review_log: { columns: [], values: [] }, settings: { columns: [], values: [] } };
  const mk = (gen: number, contentVersion: number) => ({ gen, contentVersion, tables: tablesStub });
  assert.equal(overlayReplaces(5, mk(6, 3), 3), true, "newer overlay applies");
  assert.equal(overlayReplaces(5, mk(5, 3), 3), true, "equal-gen overlay applies");
  assert.equal(overlayReplaces(5, mk(4, 3), 3), false, "stale overlay (base a gen ahead) is ignored");
  assert.equal(overlayReplaces(5, mk(9, 2), 3), false, "version mismatch defers to the merge path");
  assert.equal(overlayReplaces(0, null, 3), false, "absent overlay never applies");
});

test("export() invalidates the statement cache (no stale-statement crash)", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  // Regression guard: sql.js export() finalizes every prepared statement and
  // reopens the connection. A cached statement reused afterwards would touch
  // freed memory and corrupt the DB — exactly what flushClientDb() (every tab
  // hide) would trigger before the next grade. ClientDb.export() must drop it.
  const db = new ClientDb(new SQL.Database(readFileSync(DB)));
  const sql = "SELECT card_id c FROM card_state WHERE card_type='word' ORDER BY card_id LIMIT 1";
  const first = (db.prepare(sql).get() as { c: number }).c; // populates the cache

  db.export(); // frees + reopens; must clear the cache

  const second = (db.prepare(sql).get() as { c: number }).c; // reuse same SQL → re-prepare, not crash
  assert.equal(second, first, "cached SQL re-prepares correctly after export");
  db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('post_export','ok')").run();
  assert.equal(db.raw.exec("PRAGMA integrity_check")[0].values[0][0], "ok", "DB intact after a post-export write");
  assert.equal((db.prepare("SELECT value v FROM settings WHERE key='post_export'").get() as { v: string }).v, "ok");
  db.raw.close();
});

test("applyProgressSnapshot ROLLS BACK a bad snapshot without half-applying (no progress wiped)", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  const seed = readFileSync(DB);
  const { db: graded } = playSession(SQL, seed);
  // In "replace" mode the DELETEs run before the INSERTs, so an INSERT that
  // throws partway MUST roll back — otherwise the target is left WIPED, the exact
  // irreplaceable-progress loss this path exists to prevent. Corrupt the snapshot
  // with a settings row referencing a column the table lacks.
  const bad = structuredClone({ gen: 1, ...snapshotProgress(graded.raw) }) as ProgressSnapshot;
  bad.tables.settings.columns = [...bad.tables.settings.columns, "nonexistent_col"];
  bad.tables.settings.values = bad.tables.settings.values.map((r) => [...r, "x"]);

  const target = new SQL.Database(seed);
  applyProgressSnapshot(target, snapshotProgress(graded.raw), "replace"); // known-good baseline
  const before = PROGRESS_TABLES.map((t) => dump(target, t, ORDER[t]));
  assert.throws(() => applyProgressSnapshot(target, bad, "replace"), /no column|nonexistent_col/i, "a malformed snapshot throws");
  PROGRESS_TABLES.forEach((t, i) =>
    assert.deepEqual(dump(target, t, ORDER[t]), before[i], `${t} is byte-identical after the rolled-back failure (not wiped)`),
  );
  assert.equal(target.exec("PRAGMA integrity_check")[0].values[0][0], "ok", "DB intact after rollback");
  graded.raw.close();
  target.close();
});

test("replace empties a populated target table when the snapshot's table is empty", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  const seed = readFileSync(DB);
  // The DELETE-before-empty-check order means an EMPTY snapshot table must still
  // clear a POPULATED target (a reset). The seed ships review_log empty, so the
  // existing deletions test can't prove this — populate the target explicitly.
  const target = new SQL.Database(seed);
  target.run("INSERT INTO review_log (card_type,card_id,grade,reviewed_at,elapsed_ms,stability,difficulty,state) VALUES ('word',1,3,'t',100,1.5,2.5,1)");
  assert.equal(target.exec("SELECT count(*) FROM review_log")[0].values[0][0], 1, "target starts with a review_log row");
  const emptySnap = snapshotProgress(new SQL.Database(seed)); // review_log empty in the seed
  assert.equal(emptySnap.tables.review_log.values.length, 0, "snapshot's review_log is empty");
  applyProgressSnapshot(target, emptySnap, "replace");
  assert.equal(target.exec("SELECT count(*) FROM review_log")[0].values[0][0], 0, "replace cleared the populated target despite an empty snapshot");
  target.close();
});

test("read-statement cache: reset+bind correctness and no stuck cursor across a write", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  const db = new ClientDb(new SQL.Database(readFileSync(DB)));
  const [idA, idB] = (db.prepare("SELECT card_id FROM card_state WHERE card_type='word' ORDER BY card_id LIMIT 2").all() as { card_id: number }[]).map((r) => r.card_id);

  // Same cached SQL string, different params → must rebind, not return stale rows.
  const a = db.prepare("SELECT card_id c FROM card_state WHERE card_type=? AND card_id=?").get("word", idA) as { c: number };
  const b = db.prepare("SELECT card_id c FROM card_state WHERE card_type=? AND card_id=?").get("word", idB) as { c: number };
  assert.equal(a.c, idA);
  assert.equal(b.c, idB);

  // A get() that stops at the first row leaves an OPEN cursor in naïve sql.js;
  // the cache must reset it so the very next write transaction can COMMIT.
  const sql = "SELECT card_id c FROM card_state WHERE card_type='word' ORDER BY card_id LIMIT 1";
  const before = db.prepare(sql).get() as { c: number };
  grade(db, "word", idA, Rating.Good, 1000, new Date(Date.parse("2026-06-24T09:00:00.000Z"))); // must not throw "statements in progress"
  const after = db.prepare(sql).get() as { c: number };
  assert.deepEqual(before, after, "cached statement still correct after an interleaved write");

  db.raw.close();
});
