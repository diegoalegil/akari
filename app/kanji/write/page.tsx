"use client";
import { redirect } from "next/navigation";
import { KanjiWrite } from "@/components/kanji/KanjiWrite";
import { getKanjiWriteQueue } from "@/lib/kanjiDrill";
import { getSettings } from "@/lib/queries";
import { Loading } from "@/components/Loading";
import { useDbReady } from "@/lib/useDb";

export default function KanjiWritePage() {
  const dbReady = useDbReady();
  if (!dbReady) return <Loading />;
  const { newPerDay } = getSettings();
  const items = getKanjiWriteQueue(newPerDay);
  // Nothing due or new today — back to the explorer.
  if (items.length === 0) redirect("/kanji");
  return <KanjiWrite items={items} />;
}
