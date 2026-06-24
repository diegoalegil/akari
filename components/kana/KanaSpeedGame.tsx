"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KanaGameRound } from "@/lib/kanaGame";
import type { KanaType } from "@/lib/kana";
import { Lantern } from "@/components/Lantern";
import { playSound } from "@/lib/sound";

const EASE = [0.22, 1, 0.36, 1] as const;
const ROUND_SECONDS = 60;

const bestKey = (script: KanaType) => `akari:kana-sprint-best:${script}`;
// A visible multiplier that climbs every 5-in-a-row, capped at ×4. Each correct
// read scores 10 × multiplier, so streaks are what make a high run.
const multFor = (combo: number) => 1 + Math.min(3, Math.floor(combo / 5));

// A 60-second arcade sprint: a kana flashes, tap its reading, keep the combo alive.
// No spaced repetition — this is the fluency layer, training the recognition speed
// the SRS can't measure. Thumb-first and snappy; everything resolves on tap so iOS
// audio rides the gesture.
export function KanaSpeedGame({ script, rounds }: { script: KanaType; rounds: KanaGameRound[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [hits, setHits] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem(bestKey(script))) || 0);
    } catch {}
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [script]);

  const finish = useCallback(
    (finalScore: number) => {
      if (timer.current) clearInterval(timer.current);
      setPhase("over");
      playSound("complete");
      setBest((prev) => {
        if (finalScore <= prev) return prev;
        try { localStorage.setItem(bestKey(script), String(finalScore)); } catch {}
        return finalScore;
      });
    },
    [script],
  );

  const start = useCallback(() => {
    setIdx(0); setScore(0); setCombo(0); setHits(0); setFlash(null);
    setTimeLeft(ROUND_SECONDS);
    setPhase("playing");
    playSound("start");
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { finish(scoreRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  }, [finish]);

  // The interval closure needs the latest score without re-arming each tick.
  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const pick = useCallback(
    (opt: string) => {
      if (phase !== "playing") return;
      const round = rounds[idx];
      if (!round) return;
      const ok = opt === round.romaji;
      if (ok) {
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        setHits((h) => h + 1);
        setScore((s) => s + 10 * multFor(nextCombo));
        setFlash("ok");
      } else {
        setCombo(0);
        setFlash("bad");
      }
      playSound(ok ? "correct" : "wrong");
      setIdx((i) => (i + 1) % rounds.length);
    },
    [phase, rounds, idx, combo],
  );

  // Clear the edge flash shortly after each answer.
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 220);
    return () => clearTimeout(t);
  }, [flash, idx]);

  const exit = () => { if (timer.current) clearInterval(timer.current); router.push("/kana"); };

  if (phase === "ready") {
    return (
      <Shell onExit={exit} reduce={reduce}>
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <Lantern size={64} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sprint de {script === "hiragana" ? "hiragana" : "katakana"}</h1>
            <p className="mt-2 text-pretty text-[var(--color-fg-muted)]">
              60 segundos. Aparece un kana, toca su lectura. Encadena aciertos para subir el multiplicador.
            </p>
          </div>
          {best > 0 && (
            <p className="text-sm text-[var(--color-fg-faint)]">Tu mejor marca: <span className="font-semibold text-[var(--color-ember)]">{best}</span></p>
          )}
          <button
            onClick={start}
            className="min-h-[52px] w-full rounded-xl bg-gradient-to-r from-[var(--color-akari)] to-[var(--color-ember)] px-5 font-semibold text-[var(--color-ink-deep)] shadow-[var(--akari-glow)] transition-[filter] hover:brightness-105"
          >
            Empezar
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === "over") {
    const record = score > 0 && score >= best;
    return (
      <Shell onExit={exit} reduce={reduce}>
        <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
          <Lantern size={72} intensity={Math.min(1, hits / 30)} />
          {record ? (
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ember)]">¡Nuevo récord! 🏮</h1>
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight">¡Tiempo!</h1>
          )}
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold tabular-nums text-[var(--color-fg)]">{score}</span>
            <span className="pb-1 text-sm text-[var(--color-fg-faint)]">puntos</span>
          </div>
          <p className="text-sm text-[var(--color-fg-muted)]">
            {hits} {hits === 1 ? "lectura" : "lecturas"} · mejor marca {best}
          </p>
          <div className="mt-1 flex w-full flex-col gap-2.5">
            <button
              onClick={start}
              className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-[var(--color-akari)] to-[var(--color-ember)] px-5 font-semibold text-[var(--color-ink-deep)] shadow-[var(--akari-glow)] transition-[filter] hover:brightness-105"
            >
              Otra vez
            </button>
            <button
              onClick={exit}
              className="min-h-[48px] w-full rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] px-5 font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-indigo)]"
            >
              Volver al kana
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const round = rounds[idx];
  const mult = multFor(combo);
  return (
    <Shell onExit={exit} reduce={reduce} flash={flash}>
      <div className="flex w-full max-w-md flex-1 flex-col">
        {/* HUD: timer bar + score + combo */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <span className="text-2xl font-bold tabular-nums text-[var(--color-fg)]">{score}</span>
          <AnimatePresence>
            {combo >= 2 && (
              <motion.span
                key={mult}
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-full border border-[color-mix(in_oklab,var(--color-ember)_55%,transparent)] bg-[color-mix(in_oklab,var(--color-ember)_14%,transparent)] px-3 py-1 text-sm font-semibold text-[var(--color-ember)]"
                style={{ boxShadow: `0 0 ${8 + mult * 6}px color-mix(in oklab, var(--color-ember) ${15 + mult * 12}%, transparent)` }}
              >
                ×{mult} · combo {combo}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-2xl font-bold tabular-nums text-[var(--color-fg-muted)]">{timeLeft}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-ember)] to-[var(--color-akari)]"
            initial={false}
            animate={{ width: `${(timeLeft / ROUND_SECONDS) * 100}%` }}
            transition={{ duration: reduce ? 0 : 0.9, ease: "linear" }}
          />
        </div>

        {/* The kana */}
        <div className="flex flex-1 items-center justify-center py-6">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={idx}
              lang="ja"
              initial={reduce ? false : { y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: -14, opacity: 0 }}
              transition={{ duration: 0.16, ease: EASE }}
              className="font-jp text-[7rem] leading-none text-[var(--color-fg)]"
            >
              {round?.char}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* The four readings */}
        <div className="grid grid-cols-2 gap-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {round?.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => pick(opt)}
              className="min-h-[60px] rounded-2xl border border-[var(--color-line-strong)] bg-[var(--color-surface)] text-xl font-medium text-[var(--color-fg)] transition-colors active:border-[var(--color-ember)] active:bg-[color-mix(in_oklab,var(--color-ember)_10%,transparent)]"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Shell({
  children,
  onExit,
  reduce,
  flash,
}: {
  children: React.ReactNode;
  onExit: () => void;
  reduce: boolean | null;
  flash?: "ok" | "bad" | null;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col items-center bg-[var(--color-ink)] px-4"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: EASE }}
    >
      {/* Edge glow feedback — calm, never a full-screen flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash}
            aria-hidden
            initial={{ opacity: reduce ? 0 : 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              boxShadow: `inset 0 0 90px 8px ${flash === "ok" ? "color-mix(in oklab, var(--color-good) 45%, transparent)" : "color-mix(in oklab, var(--color-again) 45%, transparent)"}`,
            }}
          />
        )}
      </AnimatePresence>
      <header className="z-10 flex w-full max-w-md items-center pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          onClick={onExit}
          aria-label="Salir"
          className="-ml-2 grid h-11 w-11 place-items-center rounded-lg text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <span className="ml-1 text-xs text-[var(--color-fg-faint)]">Sprint de kana</span>
      </header>
      <main className="z-10 flex w-full flex-1 flex-col items-center justify-center">{children}</main>
    </motion.div>
  );
}
