"use client";
import { useRef } from "react";
import type { WordOfDay as WordOfDayData } from "@/lib/queries";
import { Furigana } from "@/components/Furigana";
import { PitchAccent } from "@/components/PitchAccent";

const STATUS: Record<WordOfDayData["status"], { label: string; color: string }> = {
  new: { label: "nueva para ti", color: "var(--color-akari)" },
  learning: { label: "en tu repaso", color: "var(--color-ember)" },
  known: { label: "ya la dominas", color: "var(--color-good)" },
};

// Tappable audio — play() runs inside the tap so iOS WebKit allows it.
function PlayBtn({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => { const a = ref.current; if (a) { a.currentTime = 0; a.play().catch(() => {}); } }}
      className="inline-grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--color-line-strong)] text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-ember)] hover:text-[var(--color-ember)]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" /></svg>
      <audio ref={ref} src={src} preload="none" />
    </button>
  );
}

export function WordOfDay({ word }: { word: WordOfDayData }) {
  const st = STATUS[word.status];
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">Palabra del día</span>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: st.color, background: `color-mix(in oklab, ${st.color} 14%, transparent)` }}>{st.label}</span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div lang="ja" className="font-jp text-4xl font-medium leading-tight text-[var(--color-fg)]"><Furigana text={word.furigana} fallback={word.expression} /></div>
          <div lang="ja" aria-hidden className="mt-1 font-jp text-base text-[var(--color-ember)]"><PitchAccent reading={word.reading} accent={word.pitchAccent} pitchReading={word.pitchReading} /></div>
        </div>
        {word.audio && <PlayBtn src={`/${word.audio}`} label="Pronunciación" />}
      </div>
      <p className="mt-2 text-pretty text-[var(--color-fg)]">{word.meaning}</p>
      {word.sentence && (
        <div className="mt-4 border-t border-[var(--color-line)] pt-3">
          <div className="flex items-start justify-between gap-3">
            <p lang="ja" className="min-w-0 font-jp leading-relaxed text-[var(--color-fg-muted)]"><Furigana text={word.sentence.furigana} fallback={word.sentence.jp} /></p>
            {word.sentence.audio && <PlayBtn src={`/${word.sentence.audio}`} label="Audio de la frase" />}
          </div>
          {word.sentence.es && <p className="mt-1 text-sm text-[var(--color-fg-faint)]">{word.sentence.es}</p>}
        </div>
      )}
    </div>
  );
}
