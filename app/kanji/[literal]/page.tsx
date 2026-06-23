import Database from "better-sqlite3";
import path from "node:path";
import { KanjiDetailClient } from "@/components/kanji/KanjiDetailClient";

export function generateStaticParams() {
  const db = new Database(path.join(process.cwd(), "data", "app.db"), { readonly: true });
  const rows = db.prepare("SELECT literal FROM kanji WHERE id IN (SELECT kanji_id FROM word_kanji)").all() as { literal: string }[];
  db.close();
  return rows.map((r) => ({ literal: r.literal }));
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ literal: string }> }) {
  const { literal } = await params;
  return <KanjiDetailClient literal={decodeURIComponent(literal)} />;
}
