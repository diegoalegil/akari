"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ShadowingItem } from "@/lib/shadowing";
import { Furigana } from "@/components/Furigana";
import { PitchAccent } from "@/components/PitchAccent";

const EASE = [0.22, 1, 0.36, 1] as const;
const MIN_GAP = 1200; // floor on the "your turn" pause, even for very short words

// Listen-and-repeat shadowing: hear a word, then a held beat to say it back, on a
// loop. One of the most effective ways to fix pronunciation and pitch — and the app
// already has native audio for every word, so nothing is generated. Audio-first and
// iOS-safe: the first play rides the tap that starts it; once unlocked the loop and
// auto-advance replay it programmatically.
export function ShadowingPlayer({ items }: { items: ShadowingItem[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState<"idle" | "listen" | "repeat">("idle");
  const [reps, setReps] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false); // read inside async callbacks without re-binding

  const item = items[idx];

  const clearGap = () => { if (gapTimer.current) { clearTimeout(gapTimer.current); gapTimer.current = null; } };

  const playNow = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    clearGap();
    a.currentTime = 0;
    setPhase("listen");
    a.play().catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) {
      playingRef.current = false;
      setPlaying(false);
      clearGap();
      audioRef.current?.pause();
      setPhase("idle");
    } else {
      playingRef.current = true;
      setPlaying(true);
      setReps(0);
      playNow(); // synchronous in the tap → iOS unlocks the element
    }
  }, [playNow]);

  // Audio finished → open the "your turn" gap (≈ the clip's length so you have time
  // to say it), then loop back.
  const onEnded = useCallback(() => {
    if (!playingRef.current) return;
    setReps((r) => r + 1);
    setPhase("repeat");
    const a = audioRef.current;
    const dur = a && Number.isFinite(a.duration) ? a.duration * 1000 : 0;
    clearGap();
    gapTimer.current = setTimeout(() => {
      if (playingRef.current) playNow();
    }, Math.max(MIN_GAP, dur + 400));
  }, [playNow]);

  const go = useCallback(
    (delta: number) => {
      clearGap();
      setReps(0);
      if (items.length < 2) {
        if (playingRef.current) playNow(); // nothing to advance to — just restart
        return;
      }
      setIdx((i) => (i + delta + items.length) % items.length);
    },
    [items.length, playNow],
  );

  // A clip that fails to load (offline before it was cached) would stall the loop
  // forever — onEnded never fires. Skip past it so the session keeps going.
  const onAudioError = useCallback(() => {
    if (!playingRef.current) return;
    clearGap();
    gapTimer.current = setTimeout(() => { if (playingRef.current) go(1); }, MIN_GAP);
  }, [go]);

  // On word change, if the loop is running, play the new word (audio already
  // unlocked). A tick lets React commit the new <audio src> first.
  useEffect(() => {
    if (!playingRef.current) return;
    const t = setTimeout(() => playNow(), 60);
    return () => clearTimeout(t);
  }, [idx, playNow]);

  // Stop the loop when the PWA is backgrounded (iOS suspends timers/audio) so we
  // don't resume into a stale "playing" state. Only ever pauses — the user taps play
  // to resume on the already-unlocked element.
  useEffect(() => {
    const onHide = () => {
      if (!document.hidden || !playingRef.current) return;
      playingRef.current = false;
      setPlaying(false);
      clearGap();
      audioRef.current?.pause();
      setPhase("idle");
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  // On unmount, stop the audio too — leaving /shadow via the global ⌘K search, a
  // back-swipe, or any route change must silence the clip, not just the X button.
  useEffect(() => () => { playingRef.current = false; clearGap(); audioRef.current?.pause(); }, []);

  const exit = () => { clearGap(); audioRef.current?.pause(); router.push("/"); };

  const ringColor = phase === "repeat" ? "var(--color-ember)" : "var(--color-indigo)";
  const phaseLabel = phase === "repeat" ? "Tu turno" : phase === "listen" ? "Escucha" : "Toca para empezar";

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col items-center bg-[var(--color-ink)] px-4"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: EASE }}
    >
      <header className="flex w-full max-w-md items-center pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={exit} aria-label="Salir" className="-ml-2 grid h-11 w-11 place-items-center rounded-lg text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <span className="ml-1 text-xs text-[var(--color-fg-faint)]">Escucha y repite</span>
        <span className="ml-auto text-xs tabular-nums text-[var(--color-fg-faint)]">{idx + 1}/{items.length}</span>
      </header>

      <main className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8">
        {/* The pulsing ring + the word inside it */}
        <div className="relative grid place-items-center">
          <motion.div
            aria-hidden
            className="absolute h-56 w-56 rounded-full"
            initial={false}
            animate={
              reduce || phase === "idle"
                ? { opacity: 0.25, scale: 1 }
                : phase === "listen"
                  ? { opacity: [0.35, 0.7, 0.35], scale: [1, 1.06, 1] }
                  : { opacity: [0.4, 0.75, 0.4], scale: [1, 1.03, 1] }
            }
            transition={reduce || phase === "idle" ? { duration: 0.3 } : { duration: phase === "listen" ? 1.1 : 1.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: `0 0 70px 6px color-mix(in oklab, ${ringColor} 40%, transparent)`, border: `1px solid color-mix(in oklab, ${ringColor} 35%, transparent)` }}
          />
          <div aria-hidden className="relative px-6 text-center">
            <div lang="ja" className="font-jp text-5xl font-medium leading-tight text-[var(--color-fg)]">
              <Furigana text={item.furigana} fallback={item.expression} />
            </div>
            <div lang="ja" className="mt-2 font-jp text-lg text-[var(--color-ember)]">
              <PitchAccent reading={item.reading} accent={item.pitchAccent} pitchReading={item.pitchReading} />
            </div>
          </div>
        </div>

        {/* The visible word uses ruby, which VoiceOver garbles — announce a clean
            reading + meaning instead, once per word. */}
        <p role="status" aria-live="polite" className="sr-only">{item.reading} — {item.meaning}</p>

        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-pretty text-[var(--color-fg-muted)]">{item.meaning}</p>
          <p className="text-sm font-medium" style={{ color: phase === "repeat" ? "var(--color-ember)" : "var(--color-fg-faint)" }}>
            {phase === "repeat" ? "🎙️ " : ""}{phaseLabel}{reps > 0 ? ` · ×${reps}` : ""}
          </p>
        </div>
      </main>

      {/* Transport controls */}
      <footer className="flex w-full max-w-md items-center justify-center gap-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <button onClick={() => go(-1)} aria-label="Anterior" className="grid h-12 w-12 place-items-center rounded-full text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zm3.5 7 9 7V5z" /></svg>
        </button>
        <button
          onClick={toggle}
          aria-label="Reproducir o pausar"
          aria-pressed={playing}
          className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[var(--color-akari)] to-[var(--color-ember)] text-[var(--color-ink-deep)] shadow-[var(--akari-glow)] transition-[filter] hover:brightness-105"
        >
          {playing ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <button onClick={() => go(1)} aria-label="Siguiente" className="grid h-12 w-12 place-items-center rounded-full text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zm-1.5 7-9 7V5z" /></svg>
        </button>
      </footer>

      <audio ref={audioRef} src={`/${item.audio}`} preload="auto" onEnded={onEnded} onError={onAudioError} />
    </motion.div>
  );
}
