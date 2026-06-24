"use client";
import Link from "next/link";
import { Lantern } from "@/components/Lantern";
import { ReviewSession } from "@/components/review/ReviewSession";
import { getLeechQueue } from "@/lib/review";
import { getSettings } from "@/lib/queries";
import { Loading } from "@/components/Loading";
import { useDbReady } from "@/lib/useDb";

// Focused review of the words you keep forgetting (fsrs_lapses ≥ 4). Reached from
// the stats "Palabras que más olvidas" card.
export default function LeechesPage() {
  const dbReady = useDbReady();
  if (!dbReady) return <Loading />;
  const cards = getLeechQueue();

  if (cards.length === 0) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Lantern size={64} animated={false} />
          <h1 className="text-2xl font-semibold tracking-tight">Sin puntos débiles</h1>
          <p className="text-[var(--color-fg-muted)]">
            No tienes palabras que se te resistan todavía. Aparecerán aquí las que falles varias veces.
          </p>
          <Link
            href="/"
            className="mt-2 rounded-xl border border-[var(--color-line-strong)] px-4 py-2 text-sm text-[var(--color-fg)] transition-colors hover:border-[var(--color-indigo)]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const { autoplay, cardAnim, reviewMode } = getSettings();
  return <ReviewSession cards={cards} autoplay={autoplay} cardAnim={cardAnim} reviewMode={reviewMode} />;
}
