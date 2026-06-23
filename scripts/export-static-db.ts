// Produce the static-PWA assets into public/: the seeded database (gzipped) and
// the sql.js WASM binary. Run after `npm run seed`, before a static build.
import Database from "better-sqlite3";
import { gzipSync } from "node:zlib";
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DB_PATH = path.join(ROOT, "data", "app.db");

// Defense-in-depth: the shipped seed is PUBLIC, so scrub any secret that may
// have been stored locally (the in-app Anthropic key) before gzipping it.
if (existsSync(DB_PATH)) {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM settings WHERE key='anthropic_api_key'").run();
  db.close();
}

const dbBytes = readFileSync(DB_PATH);
const gz = gzipSync(dbBytes, { level: 9 });
writeFileSync(path.join(ROOT, "public", "akari.db.gz"), gz);
copyFileSync(
  path.join(ROOT, "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
  path.join(ROOT, "public", "sql-wasm.wasm"),
);
console.log(`Static PWA assets → public/  (akari.db.gz ${(gz.length / 1048576).toFixed(1)}MB, sql-wasm.wasm)`);
