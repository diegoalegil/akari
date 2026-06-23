"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KanaGrid } from "@/components/kana/KanaGrid";
import { getKanaGrid, kanaMastery, type KanaType } from "@/lib/kana";
import { Loading } from "@/components/Loading";
import { useDbReady } from "@/lib/useDb";

export default function KanaPage() {
  // useSearchParams needs a Suspense boundary for static generation.
  return (
    <Suspense fallback={<Loading />}>
      <KanaInner />
    </Suspense>
  );
}

function KanaInner() {
  const sp = useSearchParams();
  const script: KanaType = sp.get("script") === "katakana" ? "katakana" : "hiragana";
  const dbReady = useDbReady();
  if (!dbReady) return <Loading />;
  const cells = getKanaGrid(script);
  const { known, total } = kanaMastery(script);

  const tab = (value: KanaType, label: string) => (
    <Link
      href={`/kana?script=${value}`}
      aria-current={script === value ? "page" : undefined}
      className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
        script === value
          ? "bg-[color-mix(in_oklab,var(--color-indigo)_16%,transparent)] text-[var(--color-fg)] ring-1 ring-[color-mix(in_oklab,var(--color-indigo)_30%,transparent)]"
          : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 md:px-8 md:py-12">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="font-jp text-3xl text-[var(--color-fg-faint)]">あ</span>
        <h1 className="text-2xl font-semibold tracking-tight">Entrenador de kana</h1>
      </div>

      <div className="mt-5 inline-flex gap-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-1">
        {tab("hiragana", "Hiragana")}
        {tab("katakana", "Katakana")}
      </div>

      <section className="surface ambient-lantern mt-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-[var(--color-fg-muted)]">Dominados</div>
          <div className="text-2xl font-semibold">
            {known}
            <span className="text-base font-normal text-[var(--color-fg-faint)]"> / {total}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/kana/drill?script=${script}&mode=recognition`}
            className="rounded-xl bg-gradient-to-r from-[var(--color-akari)] to-[var(--color-ember)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink-deep)] shadow-[var(--akari-glow)] transition-[filter] hover:brightness-105"
          >
            Practicar lectura
          </Link>
          <Link
            href={`/kana/drill?script=${script}&mode=recall`}
            className="rounded-xl border border-[var(--color-line-strong)] px-4 py-2.5 text-sm font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-indigo)]"
          >
            Practicar escritura
          </Link>
        </div>
      </section>

      <div className="mt-7">
        <KanaGrid cells={cells} />
      </div>

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--color-fg-faint)]">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border border-[var(--color-line)]" /> nuevo</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border border-[color-mix(in_oklab,var(--color-ember)_45%,transparent)]" /> aprendiendo</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border border-[color-mix(in_oklab,var(--color-good)_50%,transparent)]" /> dominado</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border border-[var(--color-indigo)]" /> toca repasar</span>
      </div>
    </div>
  );
}
