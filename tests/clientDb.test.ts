import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import initSqlJs from "sql.js";
import { ClientDb } from "../lib/clientDb.ts";

// Validates the better-sqlite3-compatible shim over sql.js against the REAL
// seeded database — same queries the app runs, exercised in Node so it's
// deterministic (the browser-only glue, fetch/DecompressionStream/IndexedDB,
// is verified separately in-app).
const DB = "data/app.db";

test("client DB shim reads & writes the real database", { skip: !existsSync(DB) && "run npm run seed first" }, async () => {
  const SQL = await initSqlJs();
  const db = new ClientDb(new SQL.Database(readFileSync(DB)));

  // reads: scalar, grouped, parameterized
  const words = (db.prepare("SELECT count(*) c FROM words").get() as { c: number }).c;
  assert.ok(words > 1000, `expected >1000 words, got ${words}`);

  const byType = db.prepare("SELECT card_type, count(*) c FROM card_state GROUP BY card_type").all() as { card_type: string; c: number }[];
  const map = Object.fromEntries(byType.map((r) => [r.card_type, r.c]));
  assert.ok(map.kana > 0 && map.word > 0 && map.kanji > 0, `card types: ${JSON.stringify(map)}`);

  const kanji = db.prepare("SELECT literal, kanjivg_svg FROM kanji WHERE id = ?").get(5) as { literal: string; kanjivg_svg: string } | undefined;
  assert.ok(kanji && typeof kanji.literal === "string", "parameterized get returned a row");

  // a real app query (dashboard date logic) must not throw
  const due = db.prepare(
    "SELECT count(*) c FROM card_state WHERE card_type='word' AND introduced_at IS NOT NULL AND due IS NOT NULL AND datetime(due) <= datetime('now')",
  ).get() as { c: number };
  assert.equal(typeof due.c, "number");

  // writes: run + transaction, then read back
  const tx = db.transaction(() => {
    db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('shim_test', ?)").run("ok-123");
  });
  tx();
  const v = (db.prepare("SELECT value v FROM settings WHERE key='shim_test'").get() as { v: string }).v;
  assert.equal(v, "ok-123");

  // export() must produce a valid, reloadable database (the IndexedDB round-trip)
  const bytes = db.export();
  assert.ok(bytes.length > 1_000_000, "exported DB looks too small");
  const reopened = new ClientDb(new SQL.Database(bytes));
  const v2 = (reopened.prepare("SELECT value v FROM settings WHERE key='shim_test'").get() as { v: string }).v;
  assert.equal(v2, "ok-123", "write survived an export/reopen (persistence path)");
});
