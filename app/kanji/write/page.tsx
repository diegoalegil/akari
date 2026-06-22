import { redirect } from "next/navigation";
import { KanjiWrite } from "@/components/kanji/KanjiWrite";
import { getKanjiWriteQueue } from "@/lib/kanjiDrill";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default function KanjiWritePage() {
  const { newPerDay } = getSettings();
  const items = getKanjiWriteQueue(newPerDay);
  // Nothing due or new today — back to the explorer.
  if (items.length === 0) redirect("/kanji");
  return <KanjiWrite items={items} />;
}
