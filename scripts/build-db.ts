// Phase 1, step 3 — build data/app.db from cached raw datasets.
//
// All async work (parsing, JMdict matching, English-subset loading, optional
// Tatoeba audio fetch) happens first; the actual inserts run in one synchronous
// better-sqlite3 transaction at the end.
import Database from "better-sqlite3";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Manifest } from "./download.ts";
import { buildKana } from "./data/kana.ts";
import { emptyCard, serializeCard } from "../lib/fsrs.ts";
import { parseJmdict } from "./parse/jmdict.ts";
import { parseKanjidic } from "./parse/kanjidic.ts";
import { parseKanjivg } from "./parse/kanjivg.ts";
import { parseKaishi } from "./parse/kaishi.ts";
import { loadEngSubset, loadTatoeba } from "./parse/tatoeba.ts";
import { DB_PATH, PUBLIC_AUDIO, ROOT, ensureDir, kanjiChars } from "./lib/util.ts";

const MAX_TATOEBA_PER_WORD = 2;
const FETCH_TATOEBA_AUDIO = process.env.SEED_TATOEBA_AUDIO === "1";

type WordRow = {
  id: number; order: number; expression: string; reading: string;
  meaning: string; meaningSource: "jmdict" | "kaishi"; frequency: number | null; audio: string | null;
};
type SentenceRow = { id: number; jp: string; en: string | null; source: "tatoeba" | "kaishi" };

function freshDb(): Database.Database {
  for (const suffix of ["", "-wal", "-shm"]) {
    const p = DB_PATH + suffix;
    if (existsSync(p)) rmSync(p);
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(readFileSync(path.join(ROOT, "db", "schema.sql"), "utf8"));
  return db;
}

export async function buildDb(manifest: Manifest): Promise<Record<string, number>> {
  await ensureDir(path.dirname(DB_PATH));
  const kaishiAudioDir = path.join(PUBLIC_AUDIO, "kaishi");

  // Spanish translations (EN→ES) generated at build time and committed to
  // db/translations.es.json. Optional — absent => meaning_es stays NULL and the
  // UI falls back to English. Readings/Japanese are never translated.
  const trPath = path.join(ROOT, "db", "translations.es.json");
  const esMap: Map<string, string> = existsSync(trPath)
    ? new Map(Object.entries(JSON.parse(readFileSync(trPath, "utf8")) as Record<string, string>))
    : new Map();
  const tr = (en: string | null | undefined): string | null => (en ? esMap.get(en) ?? null : null);
  if (esMap.size) console.log(`  loaded ${esMap.size} ES translations`);

  // ── Parse everything (async) ────────────────────────────────────────────────
  console.log("Parsing Kaishi (.apkg) + extracting native audio…");
  const notes = await parseKaishi(manifest.kaishi.apkgPath, kaishiAudioDir);
  console.log(`  ${notes.length} vocab notes`);

  console.log("Parsing JMdict (112 MB JSON)…");
  const jmdict = await parseJmdict(manifest.jmdict.jsonPath);
  console.log(`  ${jmdict.size} indexed forms`);

  console.log("Parsing KANJIDIC2…");
  const kanjidic = await parseKanjidic(manifest.kanjidic.jsonPath);
  console.log(`  ${kanjidic.size} kanji`);

  console.log("Indexing KanjiVG…");
  const kanjivg = await parseKanjivg(manifest.kanjivg.zipPath, manifest.kanjivg.extractDir);
  console.log(`  ${kanjivg.count} stroke SVGs`);

  // ── Words (Kaishi order, enriched from JMdict by exact pair) ─────────────────
  let jmHits = 0;
  const words: WordRow[] = notes.map((n) => {
    const m = jmdict.match(n.expression, n.reading);
    if (m) jmHits++;
    return {
      id: n.order,
      order: n.order,
      expression: n.expression,
      reading: n.reading,
      meaning: m?.meaning || n.meaning,
      meaningSource: m ? "jmdict" : "kaishi",
      frequency: m?.frequency ?? n.frequency,
      audio: n.wordAudio,
    };
  });

  // Audit trail: every word that fell back to Kaishi's gloss (no exact JMdict
  // pair). Worth a human glance given hard rule #1.
  const fallback = words
    .filter((w) => w.meaningSource === "kaishi")
    .map((w) => ({ expression: w.expression, reading: w.reading, meaning: w.meaning }));
  await writeFile(
    path.join(ROOT, "data", "seed-report.json"),
    JSON.stringify({ jmdictMatched: jmHits, kaishiFallback: fallback.length, fallback }, null, 2),
  );

  // ── Kanji set: those in vocab + jōyō/JLPT from KANJIDIC2 ─────────────────────
  const inVocab = new Set<string>();
  for (const w of words) for (const ch of kanjiChars(w.expression)) inVocab.add(ch);
  const kanjiLiterals = new Set(inVocab);
  for (const [lit, d] of kanjidic) {
    if ((d.grade != null && d.grade <= 8) || d.jlpt != null) kanjiLiterals.add(lit);
  }
  const kanjiId = new Map<string, number>();
  let kid = 0;
  const kanjiRows = [...kanjiLiterals].map((lit) => {
    kanjiId.set(lit, ++kid);
    const d = kanjidic.get(lit);
    return {
      id: kid, literal: lit,
      jlpt: d?.jlpt ?? null, grade: d?.grade ?? null, frequency: d?.frequency ?? null,
      strokeCount: d?.strokeCount ?? null,
      meanings: JSON.stringify(d?.meanings ?? []),
      on: JSON.stringify(d?.on ?? []), kun: JSON.stringify(d?.kun ?? []),
      svg: kanjivg.getSvg(lit),
    };
  });
  const wordKanji: [number, number][] = [];
  for (const w of words) {
    for (const ch of kanjiChars(w.expression)) {
      const k = kanjiId.get(ch);
      if (k) wordKanji.push([w.id, k]);
    }
  }

  // ── Sentences: Kaishi bundled (rank 0) + up to N Tatoeba matches ─────────────
  console.log("Loading Tatoeba…");
  const tat = loadTatoeba(manifest.tatoeba.jpnSentences, manifest.tatoeba.links, manifest.tatoeba.audio);
  console.log(`  ${tat.jpById.size} JP sentences, ${tat.audio.size} with audio`);

  // Inverted index: char -> JP sentence ids containing it (cheap substring prefilter).
  const byChar = new Map<string, number[]>();
  for (const [id, text] of tat.jpById) {
    const seen = new Set<string>();
    for (const ch of text) {
      if (seen.has(ch)) continue;
      seen.add(ch);
      let arr = byChar.get(ch);
      if (!arr) byChar.set(ch, (arr = []));
      arr.push(id);
    }
  }

  const sentences: SentenceRow[] = [];
  const wordSentences: { word: number; sentence: number; rank: number }[] = [];
  const sentenceAudio: { sentence: number; file: string; license: string | null; attribution: string | null }[] = [];
  const tatoebaPick: { sentenceRowId: number; jpId: number }[] = []; // for optional audio fetch
  const neededEng = new Set<number>();
  const tatBySentence = new Map<number, number>(); // jpId -> chosen engId
  let sid = 0;

  for (const w of words) {
    // Kaishi bundled sentence (always present, validated).
    if (w.expression && notes[w.order - 1].sentenceJp) {
      const n = notes[w.order - 1];
      sentences.push({ id: ++sid, jp: n.sentenceJp, en: n.sentenceEn || null, source: "kaishi" });
      wordSentences.push({ word: w.id, sentence: sid, rank: 0 });
      if (n.sentenceAudio) sentenceAudio.push({ sentence: sid, file: n.sentenceAudio, license: null, attribution: null });
    }

    // Tatoeba candidates containing the expression, with an English translation.
    const cand = byChar.get(w.expression[0]) ?? [];
    const matches: number[] = [];
    for (const id of cand) {
      const text = tat.jpById.get(id)!;
      if (text.includes(w.expression) && tat.jpToEng.has(id)) matches.push(id);
    }
    matches.sort((a, b) => {
      const au = (FETCH_TATOEBA_AUDIO ? Number(tat.audio.has(b)) - Number(tat.audio.has(a)) : 0);
      return au || tat.jpById.get(a)!.length - tat.jpById.get(b)!.length;
    });
    matches.slice(0, MAX_TATOEBA_PER_WORD).forEach((jpId, i) => {
      const engId = tat.jpToEng.get(jpId)![0];
      neededEng.add(engId);
      tatBySentence.set(jpId, engId);
      sentences.push({ id: ++sid, jp: tat.jpById.get(jpId)!, en: null, source: "tatoeba" });
      wordSentences.push({ word: w.id, sentence: sid, rank: i + 1 });
      tatoebaPick.push({ sentenceRowId: sid, jpId });
    });
  }

  console.log(`Loading ${neededEng.size} English translations…`);
  const engText = await loadEngSubset(manifest.tatoeba.engSentences, neededEng);
  // Backfill English on Tatoeba sentence rows.
  for (const pick of tatoebaPick) {
    const engId = tatBySentence.get(pick.jpId);
    const en = engId != null ? engText.get(engId) : undefined;
    const row = sentences[pick.sentenceRowId - 1];
    if (row) row.en = en ?? null;
  }

  // Optional: fetch Tatoeba native audio for CC-licensed picks.
  if (FETCH_TATOEBA_AUDIO) {
    await fetchTatoebaAudio(tatoebaPick, tat, sentenceAudio);
  }

  // ── Cards (one per learnable item) ──────────────────────────────────────────
  const now = new Date();
  type CardSeed = { type: "kana" | "word" | "kanji"; id: number };
  const kana = buildKana();
  const cardSeeds: CardSeed[] = [
    ...kana.map((_, i) => ({ type: "kana" as const, id: i + 1 })),
    ...words.map((w) => ({ type: "word" as const, id: w.id })),
    ...[...inVocab].map((lit) => ({ type: "kanji" as const, id: kanjiId.get(lit)! })),
  ];

  // ── Insert (one synchronous transaction) ────────────────────────────────────
  console.log("Writing database…");
  const db = freshDb();
  const insert = db.transaction(() => {
    const kanaStmt = db.prepare("INSERT INTO kana (id,char,romaji,type,row,col,group_tag) VALUES (?,?,?,?,?,?,?)");
    kana.forEach((k, i) => kanaStmt.run(i + 1, k.char, k.romaji, k.type, k.row, k.col, k.group_tag));

    const wStmt = db.prepare(
      "INSERT INTO words (id,kaishi_order,expression,reading,meaning_en,meaning_es,meaning_source,frequency,jlpt,audio_path) VALUES (?,?,?,?,?,?,?,?,?,?)",
    );
    for (const w of words) wStmt.run(w.id, w.order, w.expression, w.reading, w.meaning, tr(w.meaning), w.meaningSource, w.frequency, null, w.audio);

    const kStmt = db.prepare(
      "INSERT INTO kanji (id,literal,jlpt,grade,frequency,stroke_count,meanings,meanings_es,on_readings,kun_readings,kanjivg_svg) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    );
    for (const k of kanjiRows) {
      const esMeanings = JSON.stringify((JSON.parse(k.meanings) as string[]).map((m) => tr(m) ?? m));
      kStmt.run(k.id, k.literal, k.jlpt, k.grade, k.frequency, k.strokeCount, k.meanings, esMeanings, k.on, k.kun, k.svg);
    }

    const wkStmt = db.prepare("INSERT OR IGNORE INTO word_kanji (word_id,kanji_id) VALUES (?,?)");
    for (const [w, k] of wordKanji) wkStmt.run(w, k);

    const sStmt = db.prepare("INSERT INTO sentences (id,jp,en,es,source) VALUES (?,?,?,?,?)");
    for (const s of sentences) sStmt.run(s.id, s.jp, s.en, tr(s.en), s.source);

    const wsStmt = db.prepare("INSERT OR IGNORE INTO word_sentences (word_id,sentence_id,rank) VALUES (?,?,?)");
    for (const ws of wordSentences) wsStmt.run(ws.word, ws.sentence, ws.rank);

    const saStmt = db.prepare("INSERT OR IGNORE INTO sentence_audio (sentence_id,file_path,license,attribution) VALUES (?,?,?,?)");
    for (const a of sentenceAudio) saStmt.run(a.sentence, a.file, a.license, a.attribution);

    const csStmt = db.prepare(
      "INSERT INTO card_state (card_type,card_id,fsrs_card,fsrs_stability,fsrs_difficulty,fsrs_reps,fsrs_lapses,due,state,last_review,introduced_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    );
    for (const c of cardSeeds) {
      const card = emptyCard(now);
      csStmt.run(c.type, c.id, serializeCard(card), card.stability, card.difficulty, 0, 0, null, card.state, null, null);
    }

    const meta = db.prepare("INSERT OR REPLACE INTO ingest_meta (key,value) VALUES (?,?)");
    meta.run("seeded_at", now.toISOString());
    meta.run("jmdict_version", manifest.jmdict.tag);
    meta.run("kanjidic_version", manifest.kanjidic.tag);
    meta.run("kanjivg_version", manifest.kanjivg.tag);
    meta.run("kaishi_version", manifest.kaishi.tag);
    meta.run("words_jmdict_matched", String(jmHits));

    const set = db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)");
    set.run("new_per_day", "10");
    set.run("theme", "dark");
  });
  insert();

  const counts = {
    kana: count(db, "kana"), words: count(db, "words"), kanji: count(db, "kanji"),
    word_kanji: count(db, "word_kanji"), sentences: count(db, "sentences"),
    word_sentences: count(db, "word_sentences"), sentence_audio: count(db, "sentence_audio"),
    card_state: count(db, "card_state"),
    words_jmdict_matched: jmHits, words_kaishi_fallback: words.length - jmHits,
  };
  db.close();
  return counts;
}

function count(db: Database.Database, table: string): number {
  return (db.prepare(`SELECT count(*) c FROM ${table}`).get() as { c: number }).c;
}

async function fetchTatoebaAudio(
  picks: { sentenceRowId: number; jpId: number }[],
  tat: Awaited<ReturnType<typeof loadTatoeba>>,
  out: { sentence: number; file: string; license: string | null; attribution: string | null }[],
): Promise<void> {
  const dir = path.join(PUBLIC_AUDIO, "tatoeba");
  await ensureDir(dir);
  const { writeFile } = await import("node:fs/promises");
  let ok = 0;
  for (const p of picks) {
    const meta = tat.audio.get(p.jpId);
    if (!meta || !/^CC BY/i.test(meta.license)) continue; // CC-licensed only
    try {
      const res = await fetch(`https://audio.tatoeba.org/sentences/jpn/${p.jpId}.mp3`);
      if (!res.ok) continue;
      const rel = `audio/tatoeba/${p.jpId}.mp3`;
      await writeFile(path.join(ROOT, "public", rel), Buffer.from(await res.arrayBuffer()));
      out.push({ sentence: p.sentenceRowId, file: rel, license: meta.license, attribution: meta.attribution || meta.username });
      ok++;
    } catch {
      /* resilient: skip failures */
    }
  }
  console.log(`  fetched ${ok} Tatoeba audio clips`);
}
