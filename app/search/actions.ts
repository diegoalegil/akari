"use server";
import { getDb } from "@/lib/db";

export type SearchResults = {
  words: { expression: string; reading: string; meaning: string }[];
  kanji: { literal: string; meaning: string }[];
};

export async function searchAll(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { words: [], kanji: [] };
  const db = getDb();
  const like = `%${q}%`;

  const words = (
    db
      .prepare(
        `SELECT expression, reading, COALESCE(meaning_es, meaning_en) meaning FROM words
         WHERE expression LIKE ? OR reading LIKE ? OR meaning_es LIKE ? OR meaning_en LIKE ?
         ORDER BY kaishi_order LIMIT 24`,
      )
      .all(like, like, like, like) as { expression: string; reading: string; meaning: string }[]
  );

  const kanji = (
    db
      .prepare(
        `SELECT literal, COALESCE(meanings_es, meanings) m FROM kanji
         WHERE id IN (SELECT kanji_id FROM word_kanji) AND (literal = ? OR meanings LIKE ? OR meanings_es LIKE ?)
         LIMIT 24`,
      )
      .all(q, like, like) as { literal: string; m: string }[]
  ).map((k) => ({ literal: k.literal, meaning: (JSON.parse(k.m || "[]") as string[])[0] ?? "" }));

  return { words, kanji };
}
