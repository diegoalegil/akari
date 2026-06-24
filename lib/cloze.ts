import { parseFurigana, type FuriToken } from "./furigana";

// A cloze token is a normal furigana token or the blank where the headword was.
export type ClozeToken = FuriToken | { blank: true };

/** Blank the headword run inside a sentence's furigana so the learner recalls the
 *  word in context. Pure + deterministic — no content is generated, it only hides
 *  part of a validated sentence:
 *   1. parse the Anki ruby into tokens (a ruby pair = one atomic unit),
 *   2. reconstruct the plain surface (each token contributes its base / text),
 *   3. find the expression in that surface (kanji are matched by their base, not
 *      their reading), and replace the covered token run with a single blank —
 *      splitting a plain-kana token at the boundary when the word starts/ends
 *      mid-token.
 *  Returns ok=false when the sentence doesn't actually contain the word, so the
 *  caller can fall back to another front. */
export function clozeFurigana(
  furigana: string | null | undefined,
  fallback: string,
  expression: string,
): { tokens: ClozeToken[]; ok: boolean } {
  const src = parseFurigana((furigana && furigana.trim()) || fallback || "");
  if (!src.length || !expression) return { tokens: src, ok: false };

  let surface = "";
  const range: Array<[number, number]> = [];
  for (const t of src) {
    const s = "base" in t ? t.base : t.text;
    range.push([surface.length, surface.length + s.length]);
    surface += s;
  }

  const at = surface.indexOf(expression);
  if (at < 0) return { tokens: src, ok: false };
  const end = at + expression.length;

  const out: ClozeToken[] = [];
  let blanked = false;
  src.forEach((t, i) => {
    const [ts, te] = range[i];
    if (te <= at || ts >= end) { out.push(t); return; } // fully outside the match
    if ("text" in t) {
      // plain-kana token straddling a boundary: keep the parts outside the word
      const pre = t.text.slice(0, Math.max(0, at - ts));
      const post = t.text.slice(Math.max(0, end - ts));
      if (pre) out.push({ text: pre });
      if (!blanked) { out.push({ blank: true }); blanked = true; }
      if (post) out.push({ text: post });
    } else if (!blanked) {
      // ruby (kanji) unit is atomic and fully inside the word run
      out.push({ blank: true });
      blanked = true;
    }
  });
  return { tokens: out, ok: blanked };
}
