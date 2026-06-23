import { getDb } from "@/lib/db";
import { seeded } from "@/lib/queries";
import { isRomaji, romajiToKana } from "@/lib/romaji";

export type SearchResults = {
  words: { expression: string; furigana: string | null; reading: string; meaning: string }[];
  kanji: { literal: string; meaning: string }[];
};

export async function searchAll(query: string): Promise<SearchResults> {
  const q = query.trim();
  const db = getDb();
  if (!q || !seeded(db)) return { words: [], kanji: [] };
  const like = `%${q}%`;
  // Beginner-friendly: "mizu" → みず so a Latin-keyboard search hits the reading.
  const kanaLike = isRomaji(q) ? `%${romajiToKana(q)}%` : like;

  const words = (
    db
      .prepare(
        `SELECT expression, furigana, reading, COALESCE(meaning_es, meaning_en) meaning FROM words
         WHERE expression LIKE ? OR reading LIKE ? OR reading LIKE ? OR meaning_es LIKE ? OR meaning_en LIKE ?
         ORDER BY kaishi_order LIMIT 24`,
      )
      .all(like, like, kanaLike, like, like) as { expression: string; furigana: string | null; reading: string; meaning: string }[]
  );

  const kanji = (
    db
      .prepare(
        `SELECT literal, COALESCE(meanings_es, meanings) m FROM kanji
         WHERE literal = ? OR meanings LIKE ? OR meanings_es LIKE ?
         ORDER BY (frequency IS NULL), frequency ASC LIMIT 24`,
      )
      .all(q, like, like) as { literal: string; m: string }[]
  ).map((k) => ({ literal: k.literal, meaning: (JSON.parse(k.m || "[]") as string[])[0] ?? "" }));

  return { words, kanji };
}
