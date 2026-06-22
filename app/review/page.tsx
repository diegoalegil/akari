import Link from "next/link";
import { Lantern } from "@/components/Lantern";
import { ReviewSession } from "@/components/review/ReviewSession";
import { getReviewQueue } from "@/lib/review";
import { getSettings } from "@/lib/queries";

export const metadata = { title: "Repaso" };
export const dynamic = "force-dynamic";

export default function ReviewPage() {
  const cards = getReviewQueue();

  if (cards.length === 0) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Lantern size={64} animated={false} />
          <h1 className="text-2xl font-semibold tracking-tight">Todo al día</h1>
          <p className="text-[var(--color-fg-muted)]">
            No quedan repasos por ahora. Hoy descansas como en un episodio de relleno.
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

  const { autoplay, cardAnim } = getSettings();
  return <ReviewSession cards={cards} autoplay={autoplay} cardAnim={cardAnim} />;
}
