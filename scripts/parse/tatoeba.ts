// Parse Tatoeba exports. Japanese sentences + JP→EN links are small enough to
// hold in memory; English (2M rows) is streamed and we keep only the subset we
// actually reference. Audio metadata carries a per-recording license.
import { createReadStream, readFileSync } from "node:fs";
import { createInterface } from "node:readline";

export type AudioMeta = { license: string; username: string; attribution: string };

export type TatoebaIndex = {
  jpById: Map<number, string>;
  jpToEng: Map<number, number[]>; // JP sentence id -> English translation ids
  audio: Map<number, AudioMeta>; // JP sentence id -> audio metadata (if any)
};

export function loadTatoeba(jpnPath: string, linksPath: string, audioPath: string): TatoebaIndex {
  const jpById = new Map<number, string>();
  for (const line of readFileSync(jpnPath, "utf8").split("\n")) {
    const a = line.indexOf("\t");
    if (a < 0) continue;
    const b = line.indexOf("\t", a + 1);
    if (b < 0) continue;
    jpById.set(Number(line.slice(0, a)), line.slice(b + 1));
  }

  const jpToEng = new Map<number, number[]>();
  for (const line of readFileSync(linksPath, "utf8").split("\n")) {
    const t = line.indexOf("\t");
    if (t < 0) continue;
    const jp = Number(line.slice(0, t));
    const en = Number(line.slice(t + 1));
    if (!jpById.has(jp) || !Number.isFinite(en)) continue;
    (jpToEng.get(jp) ?? jpToEng.set(jp, []).get(jp)!).push(en);
  }

  // sent_id \t audio_id \t username \t license \t attribution_url
  const audio = new Map<number, AudioMeta>();
  for (const line of readFileSync(audioPath, "utf8").split("\n")) {
    const c = line.split("\t");
    if (c.length < 4) continue;
    audio.set(Number(c[0]), { username: c[2] ?? "", license: c[3] ?? "", attribution: c[4] ?? "" });
  }

  return { jpById, jpToEng, audio };
}

/** Stream eng_sentences.tsv, keeping only the requested ids. */
export async function loadEngSubset(engPath: string, needed: Set<number>): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (needed.size === 0) return map;
  const rl = createInterface({ input: createReadStream(engPath, "utf8"), crlfDelay: Infinity });
  for await (const line of rl) {
    const a = line.indexOf("\t");
    if (a < 0) continue;
    const id = Number(line.slice(0, a));
    if (!needed.has(id)) continue;
    const b = line.indexOf("\t", a + 1);
    map.set(id, b >= 0 ? line.slice(b + 1) : "");
    if (map.size === needed.size) break;
  }
  return map;
}
