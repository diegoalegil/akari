import { getDb } from "@/lib/db";
import { seeded } from "@/lib/queries";
import { isRomaji, romajiToKana } from "@/lib/romaji";
import { safeParseArray } from "@/lib/json";

export type SearchResults = {
  words: { expression: string; furigana: string | null; reading: string; meaning: string }[];
  kanji: { literal: string; meaning: string }[];
};

export async function searchAll(query: string): Promise<SearchResults> {
  const q = query.trim();
  const db = getDb();
  if (!q || !seeded(db)) return { words: [], kanji: [] };
  // Escape LIKE wildcards so a query of "%" or "_" matches those literal characters
  // instead of every row. The matching ESCAPE '\' clause is on each LIKE below.
  const esc = (s: string) => s.replace(/[\\%_]/g, (c) => "\\" + c);
  const like = `%${esc(q)}%`;
  // Beginner-friendly: "mizu" → みず so a Latin-keyboard search hits the reading.
  const kanaLike = isRomaji(q) ? `%${esc(romajiToKana(q))}%` : like;

  const words = (
    db
      .prepare(
        `SELECT expression, furigana, reading, COALESCE(meaning_es, meaning_en) meaning FROM words
         WHERE expression LIKE ? ESCAPE '\\' OR reading LIKE ? ESCAPE '\\' OR reading LIKE ? ESCAPE '\\' OR meaning_es LIKE ? ESCAPE '\\' OR meaning_en LIKE ? ESCAPE '\\'
         ORDER BY kaishi_order LIMIT 24`,
      )
      .all(like, like, kanaLike, like, like) as { expression: string; furigana: string | null; reading: string; meaning: string }[]
  );

  const kanji = (
    db
      .prepare(
        `SELECT literal, COALESCE(meanings_es, meanings) m FROM kanji
         WHERE literal = ? OR meanings LIKE ? ESCAPE '\\' OR meanings_es LIKE ? ESCAPE '\\'
         ORDER BY (frequency IS NULL), frequency ASC LIMIT 24`,
      )
      .all(q, like, like) as { literal: string; m: string }[]
  ).map((k) => ({ literal: k.literal, meaning: safeParseArray(k.m)[0] ?? "" }));

  return { words, kanji };
}
