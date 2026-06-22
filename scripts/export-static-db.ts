// Produce the static-PWA assets into public/: the seeded database (gzipped) and
// the sql.js WASM binary. Run after `npm run seed`, before a static build.
import { gzipSync } from "node:zlib";
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const dbBytes = readFileSync(path.join(ROOT, "data", "app.db"));
const gz = gzipSync(dbBytes, { level: 9 });
writeFileSync(path.join(ROOT, "public", "akari.db.gz"), gz);
copyFileSync(
  path.join(ROOT, "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
  path.join(ROOT, "public", "sql-wasm.wasm"),
);
console.log(`Static PWA assets → public/  (akari.db.gz ${(gz.length / 1048576).toFixed(1)}MB, sql-wasm.wasm)`);
