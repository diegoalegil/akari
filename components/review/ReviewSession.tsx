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
import { Speaker } from "@/components/Speaker";
import { GradeButtons } from "@/components/review/GradeButtons";
import { clozeFurigana, type ClozeToken } from "@/lib/cloze";
import { kanjiWriteCounts } from "@/lib/kanjiDrill";
import { kanaCounts } from "@/lib/kana";
import { getSetting, getStreak } from "@/lib/queries";
import { playSound } from "@/lib/sound";

const EASE = [0.22, 1, 0.36, 1] as const;
const BLANK_INTERVALS = { again: "", hard: "", good: "", easy: "" };

/**
 * REDISEÑO — same logic and modes as the original; the presentation is upgraded:
 *  - the card "ignites" on reveal (akari-glow grows from the centre), not a hard
 *    background swap;
 *  - the grade row is the shared <GradeButtons/> (per-grade glow + interval
 *    hierarchy + 1–4 chips);
 *  - audio uses the shared <Speaker/> (concentric ember rings while playing).
 * Behaviour (queue, re-queue on "Otra vez", iOS audio unlock, keyboard, daily
 * chaining, reduced-motion) is preserved verbatim.
 */
function ClozeSentence({ tokens }: { tokens: ClozeToken[] }) {
  return (
    <span lang="ja" className="font-jp">
      {tokens.map((t, i) =>
        "blank" in t ? (
          <span key={i} aria-label="palabra oculta" className="mx-1 inline-block min-w-[2.5em] border-b-2 border-dashed border-[var(--color-ember)] align-bottom">
            &nbsp;
          </span>
        ) : "base" in t ? (
          <ruby key={i}>
            {t.base}
            <rt>{t.rt}</rt>
          </ruby>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
    </span>
  );
}

export function ReviewSession({ cards, autoplay = true, cardAnim = "turn", reviewMode = "normal" }: { cards: ReviewCard[]; autoplay?: boolean; cardAnim?: string; reviewMode?: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [queue, setQueue] = useState<ReviewCard[]>(cards);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [done, setDone] = useState(0);
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
    if (autoplay && card?.audio) playWord();
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
      if (!res?.ok) {
        setPending(false);
        setSaveError(true);
        return;
      }
      playSound((["again", "hard", "good", "easy"] as const)[g - 1]);
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

  // iOS unlock — prime the persistent word-audio element on first touch.
  useEffect(() => {
    const unlock = () => {
      const a = wordAudioRef.current;
      if (a) {
        a.muted = true;
        a.play().then(() => { a.pause(); a.currentTime = 0; a.muted = false; }).catch(() => { a.muted = false; });
      }
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // Listening mode — play the word as each new card appears (first card skipped).
  useEffect(() => {
    if (reviewMode !== "listen" || revealed || !card?.audio || idx === 0) return;
    const t = setTimeout(playWord, 220);
    return () => clearTimeout(t);
  }, [idx, reviewMode, revealed, card, playWord]);

  // Keyboard — Space/Enter reveals, J replays audio. (1–4 live in <GradeButtons/>.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if ((e.key === " " || e.key === "Enter") && !revealed) {
        e.preventDefault();
        reveal();
      } else if (e.key.toLowerCase() === "j" && (revealed || reviewMode === "listen")) {
        playWord();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, revealed, reviewMode, reveal, playWord]);

  const completedRef = useRef(false);
  useEffect(() => {
    if (finished && !completedRef.current) { completedRef.current = true; playSound("complete"); }
  }, [finished]);

  if (finished) {
    const streak = getStreak();
    const newPerDay = Number(getSetting("new_per_day", "10"));
    const kw = kanjiWriteCounts(newPerDay);
    const kc = kanaCounts();
    const kanjiReady = kw.due + kw.newAvail;
    const kanaReady = kc.due + kc.newAvail;
    const next = kanjiReady > 0
      ? { href: "/kanji/write", label: `Escribir kanji (${kanjiReady})` }
      : kanaReady > 0
        ? { href: `/kana/drill?script=${kc.script}&mode=recognition`, label: `Practicar kana (${kanaReady})` }
        : null;
    return (
      <motion.div className="fixed inset-0 z-40 grid place-items-center bg-[var(--color-ink)] px-6" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, ease: EASE }}>
        <div className="flex flex-col items-center gap-5 text-center">
          {/* the lantern ignites to its streak intensity */}
          <motion.div initial={reduce ? false : { scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 20 }}>
            <Lantern size={72} intensity={Math.min(1, streak / 30)} milestone={streak === 7 || streak === 30 || streak === 100} />
          </motion.div>
          <motion.h1 className="text-2xl font-semibold tracking-tight" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ease: EASE }}>
            ¡Sesión completa!
          </motion.h1>
          <motion.div className="flex gap-3" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, ease: EASE }}>
            <div className="surface px-6 py-3">
              <div className="text-2xl font-semibold leading-none tabular-nums text-[var(--color-fg)]">{done}</div>
              <div className="mt-1 text-xs text-[var(--color-fg-muted)]">{done === 1 ? "repaso" : "repasos"}</div>
            </div>
            <div className="surface px-6 py-3">
              <div className="text-2xl font-semibold leading-none tabular-nums text-[var(--color-good)]">{correctRef.current}</div>
              <div className="mt-1 text-xs text-[var(--color-fg-muted)]">{correctRef.current === 1 ? "acierto" : "aciertos"}</div>
            </div>
          </motion.div>
          {streak > 0 && <p className="text-sm font-medium text-[var(--color-ember)]">🏮 Racha de {streak} {streak === 1 ? "día" : "días"}</p>}
          {next && <p className="text-sm text-[var(--color-fg-faint)]">Continuará…</p>}
          {next ? (
            <div className="mt-2 flex flex-col items-center gap-3">
              <button onClick={() => router.push(next.href)} className="btn btn-primary">{next.label} →</button>
              <button onClick={() => router.push("/")} className="text-sm text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]">Volver al inicio</button>
            </div>
          ) : (
            <button onClick={() => router.push("/")} className="btn btn-primary mt-2">Volver al inicio</button>
          )}
        </div>
      </motion.div>
    );
  }

  const progress = queue.length ? (done / queue.length) * 100 : 0;
  const headLabel = card.reading === card.expression ? card.expression : `${card.expression}（${card.reading}）`;
  const kanaOnly = card.reading === card.expression;

  const Back = (
    <>
      <div role="img" lang="ja" aria-label={headLabel} className="font-jp text-4xl font-medium leading-tight text-[var(--color-fg)] sm:text-5xl">
        {kanaOnly ? <PitchAccent reading={card.expression} accent={card.pitchAccent} pitchReading={card.pitchReading} /> : <Furigana text={card.furigana} fallback={card.expression} />}
      </div>
      {(!kanaOnly || card.audio) && (
        <div className="flex items-center gap-3">
          {!kanaOnly && (
            <span lang="ja" aria-hidden className="font-jp text-xl text-[var(--color-ember)]">
              <PitchAccent reading={card.reading} accent={card.pitchAccent} pitchReading={card.pitchReading} />
            </span>
          )}
          {card.audio && <Speaker src={`/${card.audio}`} label="Pronunciación" />}
        </div>
      )}
      <p className="max-w-md text-pretty text-lg text-[var(--color-fg)]">{card.meaning}</p>
    </>
  );

  const cloze =
    reviewMode === "cloze"
      ? (() => {
          for (const s of card.sentences) {
            const c = clozeFurigana(s.furigana, s.jp, card.expression);
            if (c.ok) return { tokens: c.tokens, hint: s.en };
          }
          return null;
        })()
      : null;

  const Front =
    reviewMode === "listen" ? (
      <>
        {card.audio && (
          <button type="button" onClick={(e) => { e.stopPropagation(); playWord(); }} aria-label="Reproducir audio" className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-[var(--color-line-strong)] text-[var(--color-ember)] transition-colors hover:border-[var(--color-ember)]">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" /></svg>
          </button>
        )}
        <p className="mt-6 text-sm text-[var(--color-fg-faint)]">Escucha y recuerda · toca para comprobar</p>
      </>
    ) : reviewMode === "cloze" && cloze ? (
      <>
        <div lang="ja" className="text-pretty text-2xl leading-relaxed text-[var(--color-fg)] sm:text-3xl"><ClozeSentence tokens={cloze.tokens} /></div>
        {cloze.hint && <p className="mt-4 text-pretty text-base text-[var(--color-fg-muted)]">{cloze.hint}</p>}
        <p className="mt-6 text-sm text-[var(--color-fg-faint)]">¿Qué palabra falta? · toca para comprobar</p>
      </>
    ) : reviewMode === "produce" || reviewMode === "cloze" ? (
      <>
        <div className="text-pretty text-2xl font-medium leading-snug text-[var(--color-fg)] sm:text-3xl">{card.meaning}</div>
        <p className="mt-6 text-sm text-[var(--color-fg-faint)]">¿Cómo se dice en japonés? · toca para comprobar</p>
      </>
    ) : (
      <>
        <div lang="ja" className="font-jp text-5xl font-medium leading-tight text-[var(--color-fg)] sm:text-6xl">{card.expression}</div>
        <p className="mt-6 text-sm text-[var(--color-fg-faint)]">Recuérdalo, luego toca para comprobar</p>
      </>
    );

  return (
    <motion.div className="fixed inset-0 z-40 flex flex-col bg-[var(--color-ink)]" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22, ease: EASE }}>
      {/* top bar */}
      <header className="flex items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={() => router.push("/")} aria-label="Salir de la sesión" className="grid h-11 w-11 place-items-center rounded-lg text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--color-ember)] to-[var(--color-akari)]" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: reduce ? 0 : 0.3, ease: EASE }} />
        </div>
        <span className="text-xs tabular-nums text-[var(--color-fg-faint)]">{done}/{queue.length}</span>
      </header>

      {/* card area */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex w-full max-w-xl flex-col items-stretch gap-4">
          <div
            onClick={!revealed ? reveal : undefined}
            onKeyDown={!revealed ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); reveal(); } } : undefined}
            role={!revealed ? "button" : undefined}
            tabIndex={!revealed ? 0 : undefined}
            className={`surface ambient-lantern relative block w-full overflow-hidden px-6 py-10 text-center [perspective:1200px] transition-shadow duration-[var(--motion-slow)] ${!revealed ? "cursor-pointer" : ""}`}
            style={revealed ? { boxShadow: "var(--akari-glow)" } : undefined}
          >
            {card.isNew && (
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--color-ember)_15%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ember)]">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-ember)] shadow-[0_0_8px_var(--color-ember)]" />
                nueva
              </span>
            )}

            {isFlip ? (
              <motion.div className="relative grid min-h-[210px] [transform-style:preserve-3d]" initial={false} animate={{ rotateY: revealed ? 180 : 0 }} transition={{ duration: 0.5, ease: EASE }}>
                <div className="col-start-1 row-start-1 grid place-items-center [backface-visibility:hidden]" aria-hidden={revealed}><div>{Front}</div></div>
                <div className="col-start-1 row-start-1 flex flex-col items-center justify-center gap-3 [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden={!revealed}>{Back}</div>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                {!revealed ? (
                  <motion.div key="front" initial={{ opacity: 0 }} animate={{ opacity: 1, rotateY: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, rotateY: -8 }} transition={{ duration: reduce ? 0.05 : 0.18, ease: EASE }}>{Front}</motion.div>
                ) : (
                  <motion.div key="back" initial={reduce ? { opacity: 0 } : { opacity: 0, rotateY: 8 }} animate={{ opacity: 1, rotateY: 0 }} transition={{ duration: reduce ? 0.05 : 0.22, ease: EASE }} className="flex flex-col items-center gap-3">{Back}</motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* extras after reveal */}
          <AnimatePresence>
            {revealed && (
              <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE, delay: 0.06 }} className="flex flex-col gap-3">
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
          {saveError && <p role="alert" className="mb-2 text-center text-sm text-[var(--color-again)]">No se pudo guardar tu repaso. Inténtalo de nuevo.</p>}
          {!revealed ? (
            <button onClick={reveal} className="showbtn w-full rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] py-3.5 font-medium text-[var(--color-fg)] transition-[border-color,box-shadow] hover:border-[var(--color-ember)]">
              Mostrar respuesta
            </button>
          ) : (
            <>
              <p className="mb-2 text-center text-xs text-[var(--color-fg-faint)]">¿Qué tal lo recordaste? · el tiempo = <b className="font-semibold text-[var(--color-ember)]">cuándo vuelve</b></p>
              <GradeButtons intervals={card.intervals} onGrade={(g) => grade(g)} disabled={pending} />
            </>
          )}
        </div>
      </footer>
    </motion.div>
  );
}
