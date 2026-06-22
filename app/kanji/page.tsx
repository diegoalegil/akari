import Link from "next/link";
import { getKanjiList } from "@/lib/kanji";

export const metadata = { title: "Kanji" };
export const dynamic = "force-dynamic";

export default function KanjiPage() {
  const kanji = getKanjiList(160);
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
      <div className="flex items-center gap-3">
        <span className="font-jp text-3xl text-[var(--color-fg-faint)]">字</span>
        <h1 className="text-2xl font-semibold tracking-tight">Explorar kanji</h1>
      </div>
      <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
        Los kanji de tu vocabulario, por frecuencia. Toca uno para ver trazos, lecturas y palabras.
      </p>

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
