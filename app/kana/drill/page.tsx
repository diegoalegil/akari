"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KanaDrill, type DrillMode } from "@/components/kana/KanaDrill";
import { Lantern } from "@/components/Lantern";
import { getKanaQueue, type KanaType } from "@/lib/kana";
import { Loading } from "@/components/Loading";
import { useDbReady } from "@/lib/useDb";

export default function KanaDrillPage() {
  // useSearchParams needs a Suspense boundary for static generation.
  return (
    <Suspense fallback={<Loading />}>
      <KanaDrillInner />
    </Suspense>
  );
}

function KanaDrillInner() {
  const sp = useSearchParams();
  const dbReady = useDbReady();
  const script: KanaType = sp.get("script") === "katakana" ? "katakana" : "hiragana";
  const mode: DrillMode = sp.get("mode") === "recall" ? "recall" : "recognition";
  if (!dbReady) return <Loading />;
  const items = getKanaQueue(script);

  if (items.length === 0) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Lantern size={64} animated={false} />
          <h1 className="text-2xl font-semibold tracking-tight">Kana al día</h1>
          <p className="text-[var(--color-fg-muted)]">No quedan kana de {script} por repasar ahora mismo.</p>
          <Link href="/kana" className="mt-2 rounded-xl border border-[var(--color-line-strong)] px-4 py-2 text-sm text-[var(--color-fg)] transition-colors hover:border-[var(--color-indigo)]">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const scriptLabel = script === "hiragana" ? "Hiragana" : "Katakana";
  const modeLabel = mode === "recognition" ? "Lectura" : "Escritura";
  return <KanaDrill items={items} mode={mode} title={`${scriptLabel} · ${modeLabel}`} />;
}
