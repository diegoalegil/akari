"use client";
import Link from "next/link";
import { Lantern } from "@/components/Lantern";
import { PitchDrill } from "@/components/pitch/PitchDrill";
import { getPitchDrillQueue } from "@/lib/pitchDrill";
import { Loading } from "@/components/Loading";
import { useDbReady } from "@/lib/useDb";

// Pitch-accent practice: pick the correct contour for a word, hear it, move on.
// Pure practice (no FSRS), reached from the dashboard "Practica también" section.
export default function PitchDrillPage() {
  const dbReady = useDbReady();
  if (!dbReady) return <Loading />;
  const items = getPitchDrillQueue();

  if (items.length === 0) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Lantern size={64} animated={false} />
          <h1 className="text-2xl font-semibold tracking-tight">Sin datos de acento</h1>
          <p className="text-[var(--color-fg-muted)]">No hay palabras con acento tonal en la base todavía.</p>
          <Link href="/" className="mt-2 rounded-xl border border-[var(--color-line-strong)] px-4 py-2 text-sm text-[var(--color-fg)] transition-colors hover:border-[var(--color-indigo)]">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return <PitchDrill items={items} />;
}
