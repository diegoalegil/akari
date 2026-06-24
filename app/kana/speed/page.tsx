"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KanaSpeedGame } from "@/components/kana/KanaSpeedGame";
import { getKanaGameRounds } from "@/lib/kanaGame";
import type { KanaType } from "@/lib/kana";
import { Lantern } from "@/components/Lantern";
import { Loading } from "@/components/Loading";
import { useDbReady } from "@/lib/useDb";

export default function KanaSpeedPage() {
  // useSearchParams needs a Suspense boundary for static generation.
  return (
    <Suspense fallback={<Loading />}>
      <SpeedInner />
    </Suspense>
  );
}

function SpeedInner() {
  const sp = useSearchParams();
  const script: KanaType = sp.get("script") === "katakana" ? "katakana" : "hiragana";
  const dbReady = useDbReady();
  if (!dbReady) return <Loading />;
  const rounds = getKanaGameRounds(script);

  // Defensive: an unseeded / corrupted DB yields no rounds. Bail to a calm empty
  // state instead of a dead 60-second screen, matching the drill page's pattern.
  if (rounds.length === 0) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Lantern size={64} animated={false} />
          <h1 className="text-2xl font-semibold tracking-tight">Sprint no disponible</h1>
          <p className="text-[var(--color-fg-muted)]">No hay kana cargados para practicar.</p>
          <Link href="/kana" className="mt-2 rounded-xl border border-[var(--color-line-strong)] px-4 py-2 text-sm text-[var(--color-fg)] transition-colors hover:border-[var(--color-indigo)]">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return <KanaSpeedGame script={script} rounds={rounds} />;
}
