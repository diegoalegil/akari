"use client";
import { Lantern } from "@/components/Lantern";

// Route-segment error boundary — recovers from render/query errors (e.g. an
// unseeded DB, a locked file) instead of crashing to Next's default screen.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <Lantern size={64} animated={false} />
        <h1 className="text-xl font-semibold tracking-tight">Algo se apagó</h1>
        <p className="text-[var(--color-fg-muted)]">
          Ocurrió un error inesperado. Si acabas de instalar, ejecuta{" "}
          <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 text-sm">npm run seed</code>.
        </p>
        <button
          onClick={reset}
          className="mt-2 rounded-xl border border-[var(--color-line-strong)] px-4 py-2 text-sm text-[var(--color-fg)] transition-colors hover:border-[var(--color-indigo)]"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
