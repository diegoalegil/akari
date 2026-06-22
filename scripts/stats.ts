// Print seeded-database stats — the Phase 1 verification report.
import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import { DB_PATH, isMain } from "./lib/util.ts";

const n = (db: Database.Database, sql: string, ...p: unknown[]) =>
  (db.prepare(sql).get(...p) as { c: number }).c;

export function printStats(): void {
  if (!existsSync(DB_PATH)) {
    console.error("No database yet — run `npm run seed` first.");
    process.exit(1);
  }
  const db = new Database(DB_PATH, { readonly: true });

  const words = n(db, "SELECT count(*) c FROM words");
  const jmdict = n(db, "SELECT count(*) c FROM words WHERE meaning_source='jmdict'");
  const wAudio = n(db, "SELECT count(*) c FROM words WHERE audio_path IS NOT NULL");
  const kanji = n(db, "SELECT count(*) c FROM kanji");
  const kanjiSvg = n(db, "SELECT count(*) c FROM kanji WHERE kanjivg_svg IS NOT NULL");
  const kanjiInWords = n(db, "SELECT count(DISTINCT kanji_id) c FROM word_kanji");
  const sentences = n(db, "SELECT count(*) c FROM sentences");
  const tatoeba = n(db, "SELECT count(*) c FROM sentences WHERE source='tatoeba'");
  const wWithSent = n(db, "SELECT count(*) c FROM (SELECT DISTINCT word_id FROM word_sentences)");
  const sAudio = n(db, "SELECT count(*) c FROM sentence_audio");
  const cards = n(db, "SELECT count(*) c FROM card_state");

  const meta = Object.fromEntries(
    (db.prepare("SELECT key,value FROM ingest_meta").all() as { key: string; value: string }[]).map((r) => [r.key, r.value]),
  );

  const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) + "%" : "—");
  const row = (label: string, value: string | number, note = "") =>
    console.log(`  ${label.padEnd(26)} ${String(value).padStart(8)}  ${note}`);

  console.log("\n灯 Akari — seeded database\n" + "─".repeat(52));
  row("kana", n(db, "SELECT count(*) c FROM kana"), "hiragana + katakana");
  row("words", words, `(target ~1500)`);
  row("  ↳ JMdict-matched", jmdict, pct(jmdict, words) + " by exact pair");
  row("  ↳ Kaishi fallback", words - jmdict, pct(words - jmdict, words));
  row("  ↳ with native audio", wAudio, pct(wAudio, words));
  row("kanji", kanji, "(target ~2000+)");
  row("  ↳ with stroke SVG", kanjiSvg, pct(kanjiSvg, kanji));
  row("  ↳ appearing in vocab", kanjiInWords);
  row("sentences", sentences, `${tatoeba} Tatoeba + ${sentences - tatoeba} Kaishi`);
  row("  ↳ words with ≥1 sentence", wWithSent, pct(wWithSent, words));
  row("  ↳ avg per word", (n(db, "SELECT count(*) c FROM word_sentences") / words).toFixed(2));
  row("sentence audio clips", sAudio);
  row("card_state (FSRS)", cards, "kana + words + kanji");
  console.log("─".repeat(52));
  console.log("  datasets:");
  console.log(`    JMdict    ${meta.jmdict_version ?? "?"}`);
  console.log(`    KANJIDIC2 ${meta.kanjidic_version ?? "?"}`);
  console.log(`    KanjiVG   ${meta.kanjivg_version ?? "?"}`);
  console.log(`    Kaishi    ${meta.kaishi_version ?? "?"}`);
  console.log(`    seeded    ${meta.seeded_at ?? "?"}`);

  console.log("\n  spot-check — first 8 words (order · expr · reading · source · meaning):");
  for (const w of db.prepare(
    "SELECT kaishi_order o, expression e, reading r, meaning_source s, meaning_en m FROM words ORDER BY kaishi_order LIMIT 8",
  ).all() as any[]) {
    console.log(`    ${String(w.o).padStart(3)} · ${w.e}  ${w.r}  [${w.s}]  ${w.m.slice(0, 44)}`);
  }

  console.log("\n  spot-check — 3 kanji (literal · strokes · jlpt · svg? · meanings):");
  for (const k of db.prepare(
    "SELECT literal l, stroke_count sc, jlpt j, (kanjivg_svg IS NOT NULL) hassvg, meanings m FROM kanji WHERE id IN (SELECT kanji_id FROM word_kanji LIMIT 3)",
  ).all() as any[]) {
    console.log(`    ${k.l}  strokes=${k.sc}  jlpt=${k.j ?? "—"}  svg=${k.hassvg ? "yes" : "no"}  ${(JSON.parse(k.m) as string[]).slice(0, 3).join(", ")}`);
  }
  console.log("");
  db.close();
}

if (isMain(import.meta.url)) printStats();
