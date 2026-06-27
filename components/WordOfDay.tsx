"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { WordOfDay as WordOfDayData } from "@/lib/queries";
import { Furigana } from "@/components/Furigana";
import { PitchAccent } from "@/components/PitchAccent";
import { Speaker } from "@/components/Speaker";
import { Eyebrow } from "@/components/Eyebrow";

const EASE = [0.22, 1, 0.36, 1] as const;

const STATUS: Record<WordOfDayData["status"], { label: string; color: string }> = {
  new: { label: "nueva para ti", color: "var(--color-akari)" },
  learning: { label: "en tu repaso", color: "var(--color-ember)" },
  known: { label: "ya la dominas", color: "var(--color-good)" },
};

/**
 * REDISEÑO — the "Palabra del día" as a small editorial piece. It now sits on a
 * `.surface-lit` (warm bloom from the top edge + a 1px akari→ember filament that
 * evokes the spine of a page) and reveals in a calm cascade on mount — kanji,
 * then reading, then meaning — like opening a page each morning. The expression
 * is the indisputable protagonist; the status badge is demoted, the translation
 * quietens to a caption. Reuses the shared <Speaker/>.
 *
 * Add `.surface-lit` from the upgraded globals.css.
 */
export function WordOfDay({ word }: { word: WordOfDayData }) {
  const reduce = useReducedMotion();
  const st = STATUS[word.status];
  const rise = (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, delay } }
      : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: EASE, delay } };

  return (
    <div className="surface surface-lit p-5">
      <div className="flex items-center justify-between">
        <Eyebrow>Palabra del día</Eyebrow>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ color: st.color, background: `color-mix(in oklab, ${st.color} 14%, transparent)` }}
        >
          {st.label}
        </span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <motion.div lang="ja" className="font-jp text-4xl font-medium leading-tight text-[var(--color-fg)]" {...rise(0.05)}>
            <Furigana text={word.furigana} fallback={word.expression} />
          </motion.div>
          <motion.div lang="ja" aria-hidden className="mt-1 font-jp text-base text-[var(--color-ember)]" {...rise(0.16)}>
            <PitchAccent reading={word.reading} accent={word.pitchAccent} pitchReading={word.pitchReading} />
          </motion.div>
        </div>
        {word.audio && <Speaker src={`/${word.audio}`} label="Pronunciación" />}
      </div>

      <motion.p className="mt-2 text-pretty text-[var(--color-fg)]" {...rise(0.26)}>
        {word.meaning}
      </motion.p>

      {word.sentence && (
        <div className="mt-4 border-t border-[var(--color-line)] pt-3">
          <div className="flex items-start justify-between gap-3">
            <p lang="ja" className="min-w-0 font-jp leading-relaxed text-[var(--color-fg-muted)]">
              <Furigana text={word.sentence.furigana} fallback={word.sentence.jp} />
            </p>
            {word.sentence.audio && <Speaker src={`/${word.sentence.audio}`} label="Audio de la frase" />}
          </div>
          {word.sentence.es && <p className="mt-1 text-sm text-[var(--color-fg-faint)]">{word.sentence.es}</p>}
        </div>
      )}
    </div>
  );
}
