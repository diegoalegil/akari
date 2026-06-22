// Parse the Kaishi 1.5k .apkg (modern Anki v3 format):
//   - collection.anki21b  = zstd(SQLite, schema 18)
//   - media               = zstd(protobuf: index -> filename)
//   - "0","1",…           = zstd(media bytes)
// We read the ordered note list (the canonical study sequence + curated reading)
// and extract the bundled native audio. Field order is fixed by the Kaishi note
// type; we avoid the `fields`/`notetypes` tables because they use Anki's custom
// `unicase` collation, which better-sqlite3 doesn't provide.
import Database from "better-sqlite3";
import { decompress } from "fzstd";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { cleanEn, cleanJp, ensureDir, openZip, RAW_DIR } from "../lib/util.ts";

// Field positions in notes.flds (confirmed against the deck).
const F = {
  word: 0,
  reading: 1,
  meaning: 2,
  wordAudio: 4,
  sentence: 5,
  sentenceMeaning: 6,
  sentenceAudio: 8,
  frequency: 12,
} as const;

const FS = String.fromCharCode(0x1f); // Anki field separator
const HAS_JP = /[぀-ヿ㐀-鿿]/; // hiragana / katakana / CJK

export type KaishiNote = {
  order: number;
  expression: string;
  reading: string;
  meaning: string;
  frequency: number | null;
  wordAudio: string | null; // path relative to /public
  sentenceJp: string;
  sentenceEn: string;
  sentenceAudio: string | null;
};

// ── minimal protobuf reader (just enough for MediaEntries) ───────────────────
function varint(b: Buffer | Uint8Array, pos: number): [number, number] {
  let r = 0, s = 0, p = pos;
  for (;;) {
    const x = b[p++];
    r += (x & 0x7f) * 2 ** s;
    if (!(x & 0x80)) break;
    s += 7;
  }
  return [r, p];
}
function skip(b: Buffer, pos: number, wire: number): number {
  if (wire === 0) return varint(b, pos)[1];
  if (wire === 2) { const [len, p] = varint(b, pos); return p + len; }
  if (wire === 5) return pos + 4;
  if (wire === 1) return pos + 8;
  throw new Error(`bad wire type ${wire}`);
}
function entryName(sub: Buffer): string {
  let pos = 0, name = "";
  while (pos < sub.length) {
    const [tag, p] = varint(sub, pos); pos = p;
    if ((tag >>> 3) === 1 && (tag & 7) === 2) {
      const [len, p2] = varint(sub, pos); pos = p2;
      name = sub.subarray(pos, pos + len).toString("utf8"); pos += len;
    } else pos = skip(sub, pos, tag & 7);
  }
  return name;
}
/** Parse the media protobuf into a filename -> archive-index map. */
function mediaNameToIndex(buf: Buffer): Map<string, number> {
  const map = new Map<string, number>();
  let pos = 0, i = 0;
  while (pos < buf.length) {
    const [tag, p] = varint(buf, pos); pos = p;
    if ((tag >>> 3) === 1 && (tag & 7) === 2) {
      const [len, p2] = varint(buf, pos); pos = p2;
      const name = entryName(buf.subarray(pos, pos + len)); pos += len;
      if (name) map.set(name, i);
      i++;
    } else pos = skip(buf, pos, tag & 7);
  }
  return map;
}

const soundFile = (field: string): string | null => /\[sound:([^\]]+)\]/.exec(field)?.[1] ?? null;

export async function parseKaishi(apkgPath: string, audioDir: string): Promise<KaishiNote[]> {
  await ensureDir(audioDir);
  const zip = await openZip(apkgPath);
  const byName = new Map(zip.files.map((f) => [f.path, f]));
  const blob = async (name: string) => byName.get(name)?.buffer();

  // collection.anki21b -> sqlite file
  const dbBytes = Buffer.from(decompress(new Uint8Array((await blob("collection.anki21b"))!)));
  const tmpDb = path.join(RAW_DIR, "kaishi-collection.sqlite");
  writeFileSync(tmpDb, dbBytes);
  const db = new Database(tmpDb, { readonly: true });

  // media map
  const nameToIndex = mediaNameToIndex(Buffer.from(decompress(new Uint8Array((await blob("media"))!))));

  // Decompress one media blob to /public on demand, deduped by archive index.
  const written = new Map<number, string>();
  const extractAudio = async (field: string): Promise<string | null> => {
    const file = soundFile(field);
    if (!file) return null;
    const idx = nameToIndex.get(file);
    if (idx === undefined) return null;
    if (written.has(idx)) return written.get(idx)!;
    const raw = await blob(String(idx));
    if (!raw) return null;
    const out = `m${idx}${path.extname(file) || ".mp3"}`;
    writeFileSync(path.join(audioDir, out), Buffer.from(decompress(new Uint8Array(raw))));
    const rel = `audio/kaishi/${out}`;
    written.set(idx, rel);
    return rel;
  };

  const rows = db.prepare(`
    select n.id as id, n.flds as flds
    from notes n join cards c on c.nid = n.id
    group by n.id
    order by min(c.due) asc
  `).all() as { id: number; flds: string }[];

  const notes: KaishiNote[] = [];
  let order = 0;
  for (const row of rows) {
    const f = row.flds.split(FS);
    const expression = (f[F.word] ?? "").trim();
    if (!HAS_JP.test(expression)) continue; // skip welcome / instruction notes
    order += 1;
    const freq = Number(f[F.frequency]);
    notes.push({
      order,
      expression,
      reading: cleanJp(f[F.reading] ?? ""),
      meaning: cleanEn(f[F.meaning] ?? ""),
      frequency: Number.isFinite(freq) && f[F.frequency] !== "" ? freq : null,
      wordAudio: await extractAudio(f[F.wordAudio] ?? ""),
      sentenceJp: cleanJp(f[F.sentence] ?? ""),
      sentenceEn: cleanEn(f[F.sentenceMeaning] ?? ""),
      sentenceAudio: await extractAudio(f[F.sentenceAudio] ?? ""),
    });
  }
  db.close();
  return notes;
}
