import { getDb } from "./db";
import { seeded } from "./queries";
import type { KanaType } from "./kana";

// A continuous stream of tap-the-romaji rounds for a timed sprint. Each round shows
// one kana and four readings to choose between — the right one plus three
// distractors. Pure recall speed practice: no FSRS, no grading against the deck,
// just "how fast can you read these". Built straight from the seeded kana table.
export type KanaGameRound = { char: string; romaji: string; options: string[] };

const shuffle = <T,>(a: T[]): T[] =>
  a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map(([, v]) => v);

/** Build `count` rounds for a 60-second sprint. We cycle through a reshuffled deck
 *  of every kana in the script so each one appears before any repeats and the order
 *  differs each lap; distractors are drawn from the distinct readings (a couple of
 *  kana share one — じ/ぢ, ず/づ — so we dedupe to never offer the answer twice). */
export function getKanaGameRounds(script: KanaType, count = 90): KanaGameRound[] {
  const db = getDb();
  if (!seeded(db)) return [];
  const all = db
    .prepare("SELECT char, romaji FROM kana WHERE type = ? AND romaji != ''")
    .all(script) as { char: string; romaji: string }[];
  if (all.length < 4) return [];

  const readings = [...new Set(all.map((k) => k.romaji))];
  const rounds: KanaGameRound[] = [];
  let deck: typeof all = [];
  for (let i = 0; i < count; i++) {
    if (deck.length === 0) deck = shuffle(all);
    const k = deck.pop()!;
    const distractors = shuffle(readings.filter((r) => r !== k.romaji)).slice(0, 3);
    rounds.push({ char: k.char, romaji: k.romaji, options: shuffle([k.romaji, ...distractors]) });
  }
  return rounds;
}
