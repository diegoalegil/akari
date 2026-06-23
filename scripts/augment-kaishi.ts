// Targeted migration: copy the validated Word/Sentence Furigana from the Kaishi
// deck into the already-built data/app.db (no full re-seed). Idempotent. The same
// extraction is mirrored in scripts/parse/kaishi.ts + build-db.ts so a fresh
// `npm run seed` reproduces it. HARD RULE intact: furigana is copied verbatim
// from Kaishi's own validated furigana fields — never synthesized.
import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import path from "node:path";
import { cleanJp } from "./lib/util.ts";

const RAW = path.join(process.cwd(), "data", "raw", "kaishi-collection.sqlite");
const APP = path.join(process.cwd(), "data", "app.db");

// Never break the build: the furigana columns exist via schema.sql, so a missing
// Kaishi source just leaves them NULL (plain text) instead of failing the deploy.
if (!existsSync(RAW) || !existsSync(APP)) {
  console.warn(`augment-kaishi: skipped (missing ${existsSync(RAW) ? "data/app.db" : "kaishi-collection.sqlite"})`);
  process.exit(0);
}
const FS = String.fromCharCode(0x1f); // Anki field separator
const HAS_JP = /[぀-ヿ㐀-鿿]/;
const F = { word: 0, reading: 1, wordFurigana: 3, sentence: 5, sentenceFurigana: 7 } as const;

// Anki ruby = `base[reading]`, groups leading-space-delimited, target word in <b>.
// The sentences table dedupes by (source, jp) and one row backs several words that
// bold DIFFERENT tokens, so we store ONE canonical form: no <b>/<br>, delimiter
// spaces collapsed (this converges all shared sentences). Bold is re-derived at
// render time, never stored.
function canonRuby(s: string): string {
  return s
    .replace(/<\/?b>/g, "")
    .replace(/<br\s*\/?>/g, "")
    .replace(/\[sound:[^\]]+\]/g, "")
    .replace(/\s+(?=[一-龯ぁ-んァ-ヶ々]+\[)/g, "") // space before a ruby group
    .replace(/(?<=\])\s+/g, "") // space right after a ruby group
    .replace(/&nbsp;/g, " ")
    .trim();
}

function hasColumn(db: Database.Database, table: string, col: string): boolean {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).some((c) => c.name === col);
}

const raw = new Database(RAW, { readonly: true });
const rows = raw
  .prepare(`select n.flds as flds from notes n join cards c on c.nid = n.id group by n.id order by min(c.due) asc`)
  .all() as { flds: string }[];

const wordFuri = new Map<string, string>(); // expr \x1f reading -> furigana
const sentFuri = new Map<string, string>(); // cleanJp(sentence) -> canonical furigana
for (const r of rows) {
  const f = r.flds.split(FS);
  const expr = (f[F.word] ?? "").trim();
  if (!HAS_JP.test(expr)) continue; // skip welcome / instruction notes
  const reading = cleanJp(f[F.reading] ?? "");
  const wf = canonRuby(f[F.wordFurigana] ?? "");
  if (wf) wordFuri.set(expr + FS + reading, wf);
  const sjp = cleanJp(f[F.sentence] ?? "");
  const sf = canonRuby(f[F.sentenceFurigana] ?? "");
  if (sjp && sf) sentFuri.set(sjp, sf);
}
raw.close();

const app = new Database(APP);
if (!hasColumn(app, "words", "furigana")) app.exec("ALTER TABLE words ADD COLUMN furigana TEXT");
if (!hasColumn(app, "sentences", "furigana")) app.exec("ALTER TABLE sentences ADD COLUMN furigana TEXT");

const updW = app.prepare("UPDATE words SET furigana = ? WHERE expression = ? AND reading = ?");
const updS = app.prepare("UPDATE sentences SET furigana = ? WHERE jp = ? AND source = 'kaishi'");
let wn = 0, sn = 0;
app.transaction(() => {
  for (const [key, fu] of wordFuri) {
    const [expr, reading] = key.split(FS);
    wn += updW.run(fu, expr, reading).changes;
  }
  for (const [jp, fu] of sentFuri) sn += updS.run(fu, jp).changes;
})();

const wTot = (app.prepare("SELECT count(*) c FROM words WHERE furigana IS NOT NULL").get() as { c: number }).c;
const sTot = (app.prepare("SELECT count(*) c FROM sentences WHERE furigana IS NOT NULL AND source='kaishi'").get() as { c: number }).c;
const wAll = (app.prepare("SELECT count(*) c FROM words").get() as { c: number }).c;
app.close();
console.log(`augment-kaishi: words furigana +${wn} (now ${wTot}/${wAll}); kaishi sentences +${sn} (now ${sTot})`);
