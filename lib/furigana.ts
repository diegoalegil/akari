// Parse Anki-style ruby ("日本[にほん]語[ご]", "大[おお]きい") into tokens for
// <ruby> rendering. A token is either a ruby pair {base, rt} (kanji run + its
// reading) or plain {text} (kana / punctuation / okurigana). Pure + deterministic;
// the furigana itself is validated Kaishi data, never generated here.
export type FuriToken = { base: string; rt: string } | { text: string };

// A run that can carry a reading: CJK unified + ext-A + iteration/repeat marks,
// plus ASCII/fullwidth digits (Kaishi writes e.g. "3[さん]" with a numeral base).
const RUBY = /([0-9０-９㐀-鿿々〆ヶ]+)\[([^\]]+)\]/g;

export function parseFurigana(input: string | null | undefined): FuriToken[] {
  const s = (input ?? "").replace(/<\/?b>/g, ""); // any stray bold → ignore
  if (!s) return [];
  const out: FuriToken[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  RUBY.lastIndex = 0;
  while ((m = RUBY.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    out.push({ base: m[1], rt: m[2] });
    last = RUBY.lastIndex;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}
