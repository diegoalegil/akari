"use client";
import Link from "next/link";
import { ShadowingPlayer } from "@/components/shadow/ShadowingPlayer";
import { getShadowingQueue } from "@/lib/shadowing";
import { Lantern } from "@/components/Lantern";
import { Loading } from "@/components/Loading";
import { useDbReady } from "@/lib/useDb";

export default function ShadowPage() {
  const dbReady = useDbReady();
  if (!dbReady) return <Loading />;
  const items = getShadowingQueue();

  if (items.length === 0) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Lantern size={64} animated={false} />
          <h1 className="text-2xl font-semibold tracking-tight">Shadowing no disponible</h1>
          <p className="text-[var(--color-fg-muted)]">No hay palabras con audio para practicar.</p>
          <Link href="/" className="mt-2 rounded-xl border border-[var(--color-line-strong)] px-4 py-2 text-sm text-[var(--color-fg)] transition-colors hover:border-[var(--color-indigo)]">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return <ShadowingPlayer items={items} />;
}
