"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { PitchDrillItem } from "@/lib/pitchDrill";
import { PitchAccent } from "@/components/PitchAccent";
import { splitMorae, pitchName } from "@/lib/pitch";
import { Lantern } from "@/components/Lantern";
import { playSound } from "@/lib/sound";

const EASE = [0.22, 1, 0.36, 1] as const;

// Pure practice (no FSRS): pick the correct Tokyo pitch contour for a word, hear
// it, and move on. Pitch is invisible in romaji, so this trains the one thing the
// rest of the app can only show passively.
export function PitchDrill({ items }: { items: PitchDrillItem[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const item = items[idx];
  const finished = idx >= items.length;

  const pick = useCallback(
    (accent: number) => {
      if (picked !== null || !item) return;
      setPicked(accent);
      const a = audioRef.current; // play inside the tap → iOS lets it through
      if (a && item.audio) { a.currentTime = 0; a.play().catch(() => {}); }
      const ok = accent === item.accent;
      if (ok) setCorrect((c) => c + 1);
      playSound(ok ? "correct" : "wrong");
    },
    [picked, item],
  );

  const next = useCallback(() => {
    setPicked(null);
    setIdx((i) => i + 1);
  }, []);

  if (finished) {
    return (
      <motion.div className="fixed inset-0 z-40 grid place-items-center bg-[var(--color-ink)] px-6" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, ease: EASE }}>
        <div className="flex flex-col items-center gap-5 text-center">
          <Lantern size={72} />
          <h1 className="text-2xl font-semibold tracking-tight">¡Práctica completa!</h1>
          <p className="text-[var(--color-fg-muted)]">{correct} / {items.length} aciertos de acento</p>
          <button onClick={() => router.push("/")} className="mt-2 rounded-xl bg-gradient-to-r from-[var(--color-akari)] to-[var(--color-ember)] px-5 py-2.5 font-semibold text-[var(--color-ink-deep)] shadow-[var(--akari-glow)] transition-[filter] hover:brightness-105">
            Volver al inicio
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="fixed inset-0 z-40 flex flex-col bg-[var(--color-ink)]" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22, ease: EASE }}>
      <header className="flex items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={() => router.push("/")} aria-label="Salir" className="grid h-11 w-11 place-items-center rounded-lg text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-[var(--color-fg-faint)]">Acento tonal</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--color-ember)] to-[var(--color-akari)]" initial={false} animate={{ width: `${(idx / items.length) * 100}%` }} transition={{ duration: reduce ? 0 : 0.3, ease: EASE }} />
          </div>
        </div>
        <span className="text-xs tabular-nums text-[var(--color-fg-faint)]">{idx}/{items.length}</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-start overflow-y-auto px-4 py-6 sm:justify-center">
        <div className="w-full max-w-md text-center">
          <div lang="ja" className="font-jp text-5xl font-medium leading-tight text-[var(--color-fg)]">{item.expression}</div>
          <p className="mt-2 text-pretty text-[var(--color-fg-muted)]">{item.meaning}</p>
          <p className="mt-6 text-sm text-[var(--color-fg-faint)]">{picked === null ? "¿Cuál es el acento?" : pitchName(item.accent, splitMorae(item.reading).length)}</p>

          <div className="mt-5 flex flex-col gap-3">
            {item.options.map((opt) => {
              const isCorrect = opt === item.accent;
              const isPicked = opt === picked;
              const revealed = picked !== null;
              const border = !revealed
                ? "border-[var(--color-line-strong)] hover:border-[var(--color-ember)]"
                : isCorrect
                  ? "border-[var(--color-good)] bg-[color-mix(in_oklab,var(--color-good)_12%,transparent)]"
                  : isPicked
                    ? "border-[var(--color-again)] bg-[color-mix(in_oklab,var(--color-again)_12%,transparent)]"
                    : "border-[var(--color-line)] opacity-50";
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={revealed}
                  onClick={() => pick(opt)}
                  aria-label={pitchName(opt, splitMorae(item.reading).length)}
                  className={`rounded-2xl border bg-[var(--color-surface)] py-4 transition-colors ${border}`}
                >
                  <span lang="ja" className="font-jp text-3xl text-[var(--color-fg)]">
                    <PitchAccent reading={item.reading} accent={opt} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-md">
          <AnimatePresence initial={false}>
            {picked !== null && (
              <motion.button initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={next} className="w-full rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] py-3.5 font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-indigo)]">
                Siguiente →
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </footer>
      {item.audio && <audio ref={audioRef} src={`/${item.audio}`} preload="none" />}
    </motion.div>
  );
}
