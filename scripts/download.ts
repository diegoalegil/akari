// Phase 1, step 1 — download + cache every raw dataset into data/raw/.
// Re-running is fast: existing non-empty files are reused.
import path from "node:path";
import { writeFile } from "node:fs/promises";
import {
  RAW_DIR,
  download,
  ensureDir,
  extractBz2,
  extractTgz,
  githubLatestAsset,
  isMain,
  type ReleaseAsset,
} from "./lib/util.ts";

// Pinned known-good releases — the safety net when api.github.com/releases/latest
// is unreachable (the unauthenticated 60/hr limit is shared across Cloudflare's CI
// build IPs and exhausts under load, 403-ing the seed and reding the deploy). These
// `releases/download/<tag>/…` URLs are stable and never expire; refresh them when
// the upstream datasets bump. The live API is still preferred whenever it answers.
const PINNED: Record<"jmdict" | "kanjidic" | "kanjivg" | "kaishi", ReleaseAsset> = {
  jmdict: {
    name: "jmdict-eng-3.6.2+20260622163854.json.tgz",
    url: "https://github.com/scriptin/jmdict-simplified/releases/download/3.6.2%2B20260622163854/jmdict-eng-3.6.2%2B20260622163854.json.tgz",
    tag: "3.6.2+20260622163854",
  },
  kanjidic: {
    name: "kanjidic2-en-3.6.2+20260622163854.json.tgz",
    url: "https://github.com/scriptin/jmdict-simplified/releases/download/3.6.2%2B20260622163854/kanjidic2-en-3.6.2%2B20260622163854.json.tgz",
    tag: "3.6.2+20260622163854",
  },
  kanjivg: {
    name: "kanjivg-20250816-main.zip",
    url: "https://github.com/KanjiVG/kanjivg/releases/download/r20250816/kanjivg-20250816-main.zip",
    tag: "r20250816",
  },
  kaishi: {
    name: "Kaishi.1.5k.v2.4.1.apkg",
    url: "https://github.com/donkuri/kaishi/releases/download/v2.4.1/Kaishi.1.5k.v2.4.1.apkg",
    tag: "v2.4.1",
  },
};

export type Manifest = {
  jmdict: { tag: string; jsonPath: string };
  kanjidic: { tag: string; jsonPath: string };
  kanjivg: { tag: string; zipPath: string; extractDir: string };
  kaishi: { tag: string; apkgPath: string };
  tatoeba: {
    jpnSentences: string;
    engSentences: string;
    links: string;
    audio: string;
  };
  jlpt: Record<"n5" | "n4" | "n3" | "n2" | "n1", string>;
};

const JLPT_BASE = "https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/main/src";

const TATOEBA = "https://downloads.tatoeba.org/exports";

export async function resolveAndDownload(): Promise<Manifest> {
  await ensureDir(RAW_DIR);

  // ── JMdict (English, full) ──────────────────────────────────────────────────
  console.log("JMdict:");
  const jm = await githubLatestAsset(
    "scriptin/jmdict-simplified",
    /^jmdict-eng-\d[\d.]*.*\.json\.tgz$/,
    /common|examples/,
    PINNED.jmdict,
  );
  const jmTgz = await download(jm.url, path.join(RAW_DIR, jm.name));
  const jmJson = await extractTgz(jmTgz, RAW_DIR);

  // ── KANJIDIC2 (English) ─────────────────────────────────────────────────────
  console.log("KANJIDIC2:");
  const kd = await githubLatestAsset(
    "scriptin/jmdict-simplified",
    /^kanjidic2-en-\d[\d.]*.*\.json\.tgz$/,
    undefined,
    PINNED.kanjidic,
  );
  const kdTgz = await download(kd.url, path.join(RAW_DIR, kd.name));
  const kdJson = await extractTgz(kdTgz, RAW_DIR);

  // ── KanjiVG (stroke-order SVGs, "-main" archive) ────────────────────────────
  console.log("KanjiVG:");
  const kv = await githubLatestAsset("KanjiVG/kanjivg", /-main\.zip$/, undefined, PINNED.kanjivg);
  const kvZip = await download(kv.url, path.join(RAW_DIR, kv.name));
  const kvDir = path.join(RAW_DIR, "kanjivg");

  // ── Kaishi 1.5k (.apkg) ─────────────────────────────────────────────────────
  console.log("Kaishi 1.5k:");
  const ka = await githubLatestAsset("donkuri/kaishi", /\.apkg$/i, undefined, PINNED.kaishi);
  const apkg = await download(ka.url, path.join(RAW_DIR, ka.name));

  // ── Tatoeba (sentences, links, audio metadata) ──────────────────────────────
  console.log("Tatoeba:");
  const jpnBz = await download(`${TATOEBA}/per_language/jpn/jpn_sentences.tsv.bz2`, path.join(RAW_DIR, "jpn_sentences.tsv.bz2"));
  const engBz = await download(`${TATOEBA}/per_language/eng/eng_sentences.tsv.bz2`, path.join(RAW_DIR, "eng_sentences.tsv.bz2"));
  const linkBz = await download(`${TATOEBA}/per_language/jpn/jpn-eng_links.tsv.bz2`, path.join(RAW_DIR, "jpn-eng_links.tsv.bz2"));
  const audioBz = await download(`${TATOEBA}/per_language/jpn/jpn_sentences_with_audio.tsv.bz2`, path.join(RAW_DIR, "jpn_sentences_with_audio.tsv.bz2"));
  const jpnTsv = await extractBz2(jpnBz, path.join(RAW_DIR, "jpn_sentences.tsv"));
  const engTsv = await extractBz2(engBz, path.join(RAW_DIR, "eng_sentences.tsv"));
  const linksTsv = await extractBz2(linkBz, path.join(RAW_DIR, "jpn-eng_links.tsv"));
  const audioTsv = await extractBz2(audioBz, path.join(RAW_DIR, "jpn_sentences_with_audio.tsv"));

  // ── JLPT vocabulary levels (jamsinclair/open-anki-jlpt-decks, MIT) ──────────
  console.log("JLPT vocab:");
  const jlpt = {} as Record<"n5" | "n4" | "n3" | "n2" | "n1", string>;
  for (const lvl of ["n5", "n4", "n3", "n2", "n1"] as const) {
    jlpt[lvl] = await download(`${JLPT_BASE}/${lvl}.csv`, path.join(RAW_DIR, `jlpt-${lvl}.csv`));
  }

  const manifest: Manifest = {
    jmdict: { tag: jm.tag, jsonPath: jmJson },
    kanjidic: { tag: kd.tag, jsonPath: kdJson },
    kanjivg: { tag: kv.tag, zipPath: kvZip, extractDir: kvDir },
    kaishi: { tag: ka.tag, apkgPath: apkg },
    tatoeba: { jpnSentences: jpnTsv, engSentences: engTsv, links: linksTsv, audio: audioTsv },
    jlpt,
  };
  await writeFile(path.join(RAW_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("\nManifest written to data/raw/manifest.json");
  return manifest;
}

// Allow `npm run download` to run this directly.
if (isMain(import.meta.url)) {
  resolveAndDownload().then(
    () => console.log("Download complete."),
    (e) => {
      console.error(e);
      process.exit(1);
    },
  );
}
