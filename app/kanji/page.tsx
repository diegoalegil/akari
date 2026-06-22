import Link from "next/link";
import { getKanjiList } from "@/lib/kanji";
import { kanjiWriteCounts } from "@/lib/kanjiDrill";
import { getSettings } from "@/lib/queries";

export const metadata = { title: "Kanji" };
export const dynamic = "force-dynamic";

export default function KanjiPage() {
  const kanji = getKanjiList(160);
  const { newPerDay } = getSettings();
  const w = kanjiWriteCounts(newPerDay);
  const writeReady = w.due + w.newAvail;
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
      <div className="flex items-center gap-3">
        <span lang="ja" aria-hidden className="font-jp text-3xl text-[var(--color-fg-faint)]">字</span>
        <h1 className="text-2xl font-semibold tracking-tight">Explorar kanji</h1>
      </div>
      <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
        Los kanji de tu vocabulario, por frecuencia. Toca uno para ver trazos, lecturas y palabras.
      </p>

      {/* Handwriting drill CTA */}
      <Link
        href={writeReady > 0 ? "/kanji/write" : "/kanji"}
        aria-disabled={writeReady === 0}
        className={`surface ambient-lantern relative mt-6 flex items-center gap-4 overflow-hidden p-5 transition-colors ${writeReady > 0 ? "hover:border-[var(--color-line-strong)]" : "pointer-events-none opacity-70"}`}
      >
        <span lang="ja" aria-hidden className="font-jp pointer-events-none absolute -right-3 -top-5 select-none text-[7rem] leading-none text-white/[0.03]">書</span>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-akari)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
        </svg>
        <div className="min-w-0">
          <div className="font-medium text-[var(--color-fg)]">Escribir kanji a mano</div>
          <div className="text-sm text-[var(--color-fg-muted)]">
            {writeReady > 0
              ? <><span className="text-[var(--color-fg)]">{writeReady}</span> {writeReady === 1 ? "listo" : "listos"} · trazo a trazo, detecta tus aciertos</>
              : "Todo al día — vuelve mañana para más práctica"}
          </div>
        </div>
        {writeReady > 0 && <span className="ml-auto shrink-0 text-[var(--color-fg-faint)]">→</span>}
      </Link>

      <div className="mt-7 grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
        {kanji.map((k) => (
          <Link
            key={k.literal}
            href={`/kanji/${encodeURIComponent(k.literal)}`}
            className="surface group flex flex-col items-center gap-1 p-4 transition-colors hover:border-[var(--color-line-strong)]"
          >
            <span className="font-jp text-3xl text-[var(--color-fg)] transition-colors group-hover:text-[var(--color-ember)]">{k.literal}</span>
            <span className="line-clamp-1 w-full text-center text-[11px] text-[var(--color-fg-faint)]">{k.meaning}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
