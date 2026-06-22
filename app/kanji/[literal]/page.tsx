import Link from "next/link";
import { notFound } from "next/navigation";
import { KanjiStrokes } from "@/components/kanji/KanjiStrokes";
import { Explain } from "@/components/explain/Explain";
import { getKanjiDetail } from "@/lib/kanji";

export const dynamic = "force-dynamic";

// KANJIDIC2 stores the OLD 4-level JLPT scale; map approximately to the modern
// N5–N1 for display. (Refined later via a dedicated JLPT dataset.)
const JLPT_MAP: Record<number, string> = { 4: "N5", 3: "N4", 2: "N3", 1: "N2" };

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">{label}</div>
      <div className="mt-0.5 font-medium text-[var(--color-fg)]">{value}</div>
    </div>
  );
}

export default async function KanjiDetailPage({ params }: { params: Promise<{ literal: string }> }) {
  const { literal } = await params;
  const lit = decodeURIComponent(literal);
  const k = getKanjiDetail(lit);
  if (!k) notFound();

  const dot = ["var(--color-good)", "var(--color-akari)", "var(--color-ember)", "var(--color-easy)", "var(--color-indigo)"];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-[var(--color-fg-faint)]">Kanji · 字典</span>
        {k.next && (
          <Link href={`/kanji/${encodeURIComponent(k.next)}`} className="rounded-lg border border-[var(--color-line-strong)] px-3 py-1.5 text-sm text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-indigo)] hover:text-[var(--color-fg)]">
            Ver <span className="font-jp">{k.next}</span> →
          </Link>
        )}
      </div>

      <div className="mt-5 grid gap-7 md:grid-cols-[320px_1fr]">
        {/* stroke order */}
        <div className="mx-auto w-full max-w-[320px]">
          {k.strokes.length > 0 ? (
            <KanjiStrokes strokes={k.strokes} />
          ) : (
            <div className="surface grid aspect-square place-items-center">
              <span className="font-jp text-8xl text-[var(--color-fg)]">{k.literal}</span>
            </div>
          )}
        </div>

        {/* info */}
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <span lang="ja" className="font-jp text-6xl font-medium leading-none text-[var(--color-fg)]">{k.literal}</span>
            <div className="border-l-2 border-[var(--color-ember)] pl-3">
              <div className="text-xl font-medium text-[var(--color-fg)]">{k.meanings[0] ?? lit}</div>
              {k.meanings.length > 1 && <div className="text-sm text-[var(--color-fg-muted)]">{k.meanings.slice(1, 4).join(" · ")}</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Chip label="JLPT" value={k.jlpt ? JLPT_MAP[k.jlpt] ?? "—" : "—"} />
            <Chip label="Trazos" value={k.strokeCount != null ? String(k.strokeCount) : "—"} />
            <Chip label="Grado" value={k.grade != null ? `${k.grade}.º` : "—"} />
            <Chip label="Frecuencia" value={k.frequency != null ? `#${k.frequency}` : "—"} />
          </div>

          <div className="surface grid grid-cols-2 divide-x divide-[var(--color-line)]">
            <div className="p-4">
              <div lang="ja" className="font-jp text-xs text-[var(--color-ember)]">オン</div>
              <div lang="ja" className="font-jp mt-1 text-lg text-[var(--color-fg)]">{k.on.length ? k.on.join("、") : "—"}</div>
            </div>
            <div className="p-4">
              <div lang="ja" className="font-jp text-xs text-[var(--color-akari)]">くん</div>
              <div lang="ja" className="font-jp mt-1 text-lg text-[var(--color-fg)]">{k.kun.length ? k.kun.join("、") : "—"}</div>
            </div>
          </div>

          <Explain
            label="Explícame este kanji"
            context={{ expression: k.literal, reading: [...k.on, ...k.kun][0], meaning: k.meanings[0] }}
          />
        </div>
      </div>

      {/* words using this kanji */}
      {k.words.length > 0 && (
        <div className="mt-9">
          <h2 className="text-xs uppercase tracking-wider text-[var(--color-fg-faint)]">
            Palabras con <span className="font-jp">{k.literal}</span>
          </h2>
          <ul className="mt-3 divide-y divide-[var(--color-line)] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
            {k.words.map((w, i) => (
              <li key={w.expression + i} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot[i % dot.length] }} />
                  <div>
                    <div className="font-jp text-lg text-[var(--color-fg)]">
                      {w.expression.split(k.literal).map((part, j, arr) => (
                        <span key={j}>
                          {part}
                          {j < arr.length - 1 && <span className="text-[var(--color-ember)]">{k.literal}</span>}
                        </span>
                      ))}
                    </div>
                    <div className="font-jp text-xs text-[var(--color-fg-faint)]">{w.reading}</div>
                  </div>
                </div>
                <span className="max-w-[45%] truncate text-right text-sm text-[var(--color-fg-muted)]">{w.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
