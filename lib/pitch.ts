// Tokyo-dialect pitch accent helpers. The accent integer (drop position) comes
// from Kaishi's validated pitch widget — see scripts/augment-kaishi.ts. Here we
// only turn (reading, accent) into a per-mora high/low contour for rendering.
const SMALL = "ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ";

/** Split a kana reading into morae (small kana fold into the previous mora). */
export function splitMorae(reading: string): string[] {
  const morae: string[] = [];
  for (const ch of reading) {
    if (SMALL.includes(ch) && morae.length) morae[morae.length - 1] += ch;
    else morae.push(ch);
  }
  return morae;
}

/** High/low per mora. 0 heiban: low-high…high; 1 atamadaka: high-low…low;
 *  n≥2: low-high…high(drop after mora n)-low…low. */
export function pitchPattern(moraCount: number, accent: number): boolean[] {
  const high: boolean[] = [];
  for (let i = 1; i <= moraCount; i++) {
    if (accent === 0) high.push(i > 1);
    else if (accent === 1) high.push(i === 1);
    else high.push(i > 1 && i <= accent);
  }
  return high;
}

export function pitchName(accent: number, moraCount: number): string {
  if (accent === 0) return "heiban (sin caída)";
  if (accent === 1) return "atamadaka (cae tras la 1ª mora)";
  if (accent === moraCount) return "odaka (cae al final)";
  return `nakadaka (cae tras la mora ${accent})`;
}
