"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

/**
 * REDISEÑO — one coherent audio control for the whole app (flashcard, kanji
 * detail, example sentences). A circle on surface-2; while it plays, three
 * concentric ember rings radiate outward like sound from a lantern. Degrades to
 * a dormant "sin audio" chip if the clip 404s. Honours prefers-reduced-motion
 * (no rings, instant state). Same call shape as the inline Speaker it replaces.
 */
export function Speaker({
  src,
  label = "Reproducir audio",
  big = false,
}: {
  src: string;
  label?: string;
  big?: boolean;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const sz = big ? "h-14 w-14" : "h-11 w-11";

  if (failed) {
    return (
      <span
        aria-label="Sin audio disponible"
        title="Sin audio"
        className={`inline-grid place-items-center rounded-full border border-dashed border-[var(--color-line)] text-[var(--color-fg-faint)] ${sz}`}
      >
        <svg width={big ? 18 : 14} height={big ? 18 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="m17 9 4 4M21 9l-4 4" />
        </svg>
      </span>
    );
  }

  return (
    <span className="relative inline-grid place-items-center">
      {/* radiating rings while playing */}
      <AnimatePresence>
        {playing && !reduce && (
          <>
            {[0, 0.15, 0.3].map((delay) => (
              <motion.span
                key={delay}
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{ border: "1.5px solid color-mix(in oklab, var(--color-ember) 50%, transparent)" }}
                initial={{ scale: 0.8, opacity: 0.4 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, repeat: Infinity, delay, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-label={label}
        aria-pressed={playing}
        onClick={() => {
          const a = ref.current;
          if (a) {
            a.currentTime = 0;
            a.play().catch(() => setFailed(true));
          }
        }}
        className={`relative inline-grid place-items-center rounded-full border border-[var(--color-line-strong)] text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-ember)] hover:text-[var(--color-ember)] aria-pressed:border-[var(--color-ember)] aria-pressed:text-[var(--color-ember)] ${sz}`}
      >
        <motion.svg
          width={big ? 20 : 16}
          height={big ? 20 : 16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          animate={playing && !reduce ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={playing ? { duration: 0.6, repeat: Infinity } : { duration: 0.2 }}
        >
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" />
        </motion.svg>
        <audio
          ref={ref}
          src={src}
          preload="none"
          onPlay={() => setPlaying(true)}
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
          onError={() => setFailed(true)}
        />
      </button>
    </span>
  );
}
