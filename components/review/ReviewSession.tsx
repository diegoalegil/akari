"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReviewCard } from "@/lib/review";
import { gradeCard } from "@/app/review/actions";
import { Lantern } from "@/components/Lantern";
import { Explain } from "@/components/explain/Explain";
import { Furigana } from "@/components/Furigana";
import { PitchAccent } from "@/components/PitchAccent";
import { playSound } from "@/lib/sound";

const EASE = [0.22, 1, 0.36, 1] as const;
const GRADE_SND = ["again", "hard", "good", "easy"] as const;

const GRADES = [
  { g: 1, label: "Otra vez", color: "var(--color-again)", key: "1" },
  { g: 2, label: "Difícil", color: "var(--color-hard)", key: "2" },
  { g: 3, label: "Bien", color: "var(--color-good)", key: "3" },
  { g: 4, label: "Fácil", color: "var(--color-easy)", key: "4" },
] as const;

// Audio button with playback state: announces pressed state, pulses while
// playing, and degrades to a dormant "sin audio" chip if the clip 404s/errors.
function Speaker({ src, label = "Reproducir audio", big = false }: { src: string; label?: string; big?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-label="Sin audio disponible"
        title="Sin audio"
        className={`inline-grid place-items-center rounded-full border border-dashed border-[var(--color-line)] text-[var(--color-fg-faint)] ${big ? "h-11 w-11" : "h-8 w-8"}`}
      >
        <svg width={big ? 18 : 14} height={big ? 18 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="m17 9 4 4M21 9l-4 4" />
        </svg>
      </span>
    );
  }

  return (
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
      className={`inline-grid place-items-center rounded-full border border-[var(--color-line-strong)] text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-ember)] hover:text-[var(--color-ember)] aria-pressed:border-[var(--color-ember)] aria-pressed:text-[var(--color-ember)] ${big ? "h-11 w-11" : "h-8 w-8"}`}
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
        animate={playing ? { scale: [1, 1.12, 1] } : { scale: 1 }}
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
  );
}

const BLANK_INTERVALS = { again: "", hard: "", good: "", easy: "" };

export function ReviewSession({ cards, autoplay = true, cardAnim = "turn" }: { cards: ReviewCard[]; autoplay?: boolean; cardAnim?: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [queue, setQueue] = useState<ReviewCard[]>(cards);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [done, setDone] = useState(0);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const startedAt = useRef<number>(Date.now());
  const correctRef = useRef(0);
  const wordAudioRef = useRef<HTMLAudioElement>(null);

  const finished = idx >= queue.length;
  const card = queue[idx];
  const isFlip = cardAnim === "flip" && !reduce;

  const playWord = useCallback(() => {
    const a = wordAudioRef.current;
    if (a) {
      a.currentTime = 0;
      a.play().catch(() => {});
    }
  }, []);

  const reveal = useCallback(() => {
    if (revealed) return;
    setRevealed(true);
    playSound("flip");
    if (autoplay && card?.audio) setTimeout(playWord, 120);
  }, [revealed, card, playWord, autoplay]);

  const grade = useCallback(
    async (g: number) => {
      if (!revealed || pending || !card) return;
      setPending(true);
      setSaveError(false);
      const elapsed = Date.now() - startedAt.current;
      let res: { ok: boolean } | undefined;
      try {
        res = await gradeCard(card.cardType, card.cardId, g as 1 | 2 | 3 | 4, elapsed);
      } catch {
        res = { ok: false };
      }
      // Only advance once the grade is actually persisted — otherwise the card
      // would silently leave the session while SRS state stayed untouched.
      if (!res?.ok) {
        setPending(false);
        setSaveError(true);
        return;
      }
      playSound(GRADE_SND[g - 1]);
      // "Otra vez" (Again) → re-queue this session, blanking the now-stale
      // interval preview (it was computed from the pre-lapse FSRS state).
      if (g === 1) setQueue((q) => [...q, { ...card, intervals: { ...BLANK_INTERVALS } }]);
      else correctRef.current += 1;
      setDone((d) => d + 1);
      setRevealed(false);
      setPending(false);
      startedAt.current = Date.now();
      setIdx((i) => i + 1);
    },
    [revealed, pending, card],
  );

  // Keyboard: Space/Enter reveals, 1–4 grade, J replays audio.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if ((e.key === " " || e.key === "Enter") && !revealed) {
        e.preventDefault();
        reveal();
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        // Mirror a tap: briefly pulse the matching grade cell.
        setLastKey(e.key);
        setTimeout(() => setLastKey(null), 150);
        void grade(Number(e.key));
      } else if (e.key.toLowerCase() === "j") {
        playWord();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, revealed, reveal, grade, playWord]);

  // Celebrate once when the session ends.
  const completedRef = useRef(false);
  useEffect(() => {
    if (finished && !completedRef.current) { completedRef.current = true; playSound("complete"); }
  }, [finished]);

  if (finished) {
    return (
      <motion.div
        className="fixed inset-0 z-40 grid place-items-center bg-[var(--color-ink)] px-6"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: EASE }}
      >
        <div className="flex flex-col items-center gap-5 text-center">
          <Lantern size={72} />
          <h1 className="text-2xl font-semibold tracking-tight">¡Sesión completa!</h1>
          <p className="text-[var(--color-fg-muted)]">
            {done} {done === 1 ? "repaso" : "repasos"} · {correctRef.current} {correctRef.current === 1 ? "acierto" : "aciertos"}
          </p>
          <p className="text-sm text-[var(--color-fg-faint)]">Continuará…</p>
          <button
            onClick={() => router.push("/")}
            className="mt-2 rounded-xl bg-gradient-to-r from-[var(--color-akari)] to-[var(--color-ember)] px-5 py-2.5 font-semibold text-[var(--color-ink-deep)] shadow-[var(--akari-glow)] transition-[filter] hover:brightness-105"
          >
            Volver al inicio
          </button>
        </div>
      </motion.div>
    );
  }

  const progress = queue.length ? (done / queue.length) * 100 : 0;
  const headLabel = `${card.expression} — ${card.reading} — ${card.meaning}`;

  // Card back content (reading + meaning + audio), shared by both flip modes.
  const Back = (
    <>
      <div lang="ja" aria-label={headLabel} className="font-jp text-4xl font-medium leading-tight text-[var(--color-fg)] sm:text-5xl"><Furigana text={card.furigana} fallback={card.expression} /></div>
      <div className="flex items-center gap-3">
        <span lang="ja" aria-hidden className="font-jp text-xl text-[var(--color-ember)]"><PitchAccent reading={card.reading} accent={card.pitchAccent} pitchReading={card.pitchReading} /></span>
        {card.audio && <Speaker src={`/${card.audio}`} label="Pronunciación" />}
      </div>
      <p aria-hidden className="max-w-md text-pretty text-lg text-[var(--color-fg)]">{card.meaning}</p>
    </>
  );

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col bg-[var(--color-ink)]"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: EASE }}
    >
      {/* top bar */}
      <header className="flex items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={() => router.push("/")} aria-label="Salir de la sesión" className="grid h-9 w-9 place-items-center rounded-lg text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-ember)] to-[var(--color-akari)]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
          />
        </div>
        <span className="text-xs tabular-nums text-[var(--color-fg-faint)]">
          {done}/{queue.length}
        </span>
      </header>

      {/* card area */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex w-full max-w-xl flex-col items-stretch gap-4">
          <div
            onClick={!revealed ? reveal : undefined}
            onKeyDown={!revealed ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); reveal(); } } : undefined}
            role={!revealed ? "button" : undefined}
            tabIndex={!revealed ? 0 : undefined}
            className={`surface ambient-lantern relative block w-full overflow-hidden px-6 py-10 text-center [perspective:1200px] ${!revealed ? "cursor-pointer" : ""}`}
            style={revealed ? { boxShadow: "var(--akari-glow)" } : undefined}
          >
            {card.isNew && (
              <span className="absolute left-4 top-4 rounded-full bg-[color-mix(in_oklab,var(--color-ember)_22%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ember)]">
                nueva
              </span>
            )}

            {isFlip ? (
              // True 3D flip: one persistent preserve-3d wrapper with two
              // backface-hidden faces rotating together.
              <motion.div
                className="relative grid min-h-[210px] [transform-style:preserve-3d]"
                initial={false}
                animate={{ rotateY: revealed ? 180 : 0 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <div className="col-start-1 row-start-1 grid place-items-center [backface-visibility:hidden]" aria-hidden={revealed}>
                  <div>
                    <div lang="ja" className="font-jp text-5xl font-medium leading-tight text-[var(--color-fg)] sm:text-6xl">{card.expression}</div>
                    <p className="mt-6 text-sm text-[var(--color-fg-faint)]">Recuérdalo, luego toca para comprobar</p>
                  </div>
                </div>
                <div className="col-start-1 row-start-1 flex flex-col items-center justify-center gap-3 [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden={!revealed}>
                  {Back}
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                {!revealed ? (
                  <motion.div
                    key="front"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, rotateY: -8 }}
                    transition={{ duration: reduce ? 0.05 : 0.18, ease: EASE }}
                  >
                    <div lang="ja" className="font-jp text-5xl font-medium leading-tight text-[var(--color-fg)] sm:text-6xl">{card.expression}</div>
                    <p className="mt-6 text-sm text-[var(--color-fg-faint)]">Recuérdalo, luego toca para comprobar</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, rotateY: 8 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ duration: reduce ? 0.05 : 0.22, ease: EASE }}
                    className="flex flex-col items-center gap-3"
                  >
                    {Back}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* extras after reveal */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: EASE, delay: 0.06 }}
                className="flex flex-col gap-3"
              >
                <div className="flex justify-center">
                  <Explain context={{ expression: card.expression, reading: card.reading, meaning: card.meaning, sentence: card.sentences[0]?.jp }} />
                </div>
                {card.sentences.map((s, i) => (
                  <div key={i} className="surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p lang="ja" className="font-jp text-lg leading-relaxed text-[var(--color-fg)]"><Furigana text={s.furigana} fallback={s.jp} /></p>
                      {s.audio && <Speaker src={`/${s.audio}`} label="Audio de la frase" />}
                    </div>
                    {s.en && <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{s.en}</p>}
                  </div>
                ))}
                {card.kanji.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {card.kanji.map((k) => (
                      <span key={k.literal} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-1.5">
                        <span lang="ja" className="font-jp text-lg text-[var(--color-fg)]">{k.literal}</span>
                        <span className="text-xs text-[var(--color-fg-muted)]">{k.meanings.join(", ")}</span>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* hidden word-audio element for autoplay / J key */}
      {card.audio && <audio ref={wordAudioRef} src={`/${card.audio}`} preload="auto" />}

      {/* actions (thumb zone) */}
      <footer className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-xl">
          {saveError && (
            <p role="alert" className="mb-2 text-center text-sm text-[var(--color-again)]">
              No se pudo guardar tu repaso. Inténtalo de nuevo.
            </p>
          )}
          {!revealed ? (
            <button
              onClick={reveal}
              className="w-full rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] py-3.5 font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-indigo)]"
            >
              Mostrar respuesta
            </button>
          ) : (
            <>
              <p className="mb-2 text-center text-xs text-[var(--color-fg-faint)]">
                ¿Qué tal lo recordaste? · el tiempo = cuándo vuelve
              </p>
              <div className="grid grid-cols-4 gap-2">
              {GRADES.map((b) => (
                <motion.button
                  key={b.g}
                  disabled={pending}
                  onClick={() => grade(b.g)}
                  animate={lastKey === b.key ? { scale: 0.94 } : { scale: 1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.12, ease: EASE }}
                  className="relative flex flex-col items-center gap-0.5 rounded-xl border py-2.5 transition-[background-color] duration-[var(--motion-fast)] hover:bg-[color-mix(in_oklab,var(--btn)_14%,transparent)] disabled:opacity-50"
                  style={{ borderColor: "color-mix(in oklab, var(--btn) 45%, transparent)", ["--btn" as string]: b.color }}
                >
                  <span className="absolute right-1.5 top-1 hidden rounded border border-[var(--color-line)] px-1 text-[10px] text-[var(--color-fg-faint)] sm:block">{b.key}</span>
                  <span className="text-sm font-medium" style={{ color: b.color }}>{b.label}</span>
                  <span className="text-[11px] tabular-nums text-[var(--color-fg-faint)]">{card.intervals[["again", "hard", "good", "easy"][b.g - 1] as keyof ReviewCard["intervals"]]}</span>
                </motion.button>
              ))}
              </div>
            </>
          )}
        </div>
      </footer>
    </motion.div>
  );
}
