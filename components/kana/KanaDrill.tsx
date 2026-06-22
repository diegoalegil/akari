"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KanaQueueItem } from "@/lib/kana";
import { gradeCard } from "@/app/review/actions";
import { Lantern } from "@/components/Lantern";

const EASE = [0.22, 1, 0.36, 1] as const;
const GRADES = [
  { g: 1, label: "Otra vez", color: "var(--color-again)" },
  { g: 2, label: "Difícil", color: "var(--color-hard)" },
  { g: 3, label: "Bien", color: "var(--color-good)" },
  { g: 4, label: "Fácil", color: "var(--color-easy)" },
] as const;
const KEYS = ["again", "hard", "good", "easy"] as const;

// Accept kunrei-style romaji as equivalent to the Hepburn stored in the deck,
// so typing "si"/"tu"/"hu" for し/つ/ふ isn't unfairly marked wrong.
const ROMAJI_ALT: Record<string, string> = {
  si: "shi", ti: "chi", tu: "tsu", hu: "fu", zi: "ji", di: "ji", du: "zu",
  sya: "sha", syu: "shu", syo: "sho", tya: "cha", tyu: "chu", tyo: "cho",
  zya: "ja", zyu: "ju", zyo: "jo", jya: "ja", jyu: "ju", jyo: "jo", wo: "o",
};
function normRomaji(s: string): string {
  const k = s.trim().toLowerCase().replace(/[\s'-]/g, "");
  return ROMAJI_ALT[k] ?? k;
}

export type DrillMode = "recognition" | "recall";

export function KanaDrill({ items, mode, title }: { items: KanaQueueItem[]; mode: DrillMode; title: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(0);
  const [typed, setTyped] = useState("");
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const startedAt = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const finished = idx >= items.length;
  const item = items[idx];
  // Recognition shows the kana and asks for its romaji — typeable on a Latin
  // keyboard, so we turn it into active recall instead of passive reveal.
  const typedMode = mode === "recognition";

  const reveal = useCallback(() => setRevealed(true), []);
  const submitTyped = useCallback(() => {
    if (revealed || !item) return;
    setWasCorrect(normRomaji(typed) === normRomaji(item.romaji));
    setRevealed(true);
  }, [revealed, item, typed]);
  const grade = useCallback(
    async (g: number) => {
      if (!revealed || pending || !item) return;
      setPending(true);
      try {
        await gradeCard("kana", item.id, g as 1 | 2 | 3 | 4, Date.now() - startedAt.current);
      } finally {
        setDone((d) => d + 1);
        setRevealed(false);
        setPending(false);
        setTyped("");
        setWasCorrect(null);
        startedAt.current = Date.now();
        setIdx((i) => i + 1);
      }
    },
    [revealed, pending, item],
  );

  // Focus the answer field as each recognition card appears.
  useEffect(() => {
    if (typedMode && !revealed) inputRef.current?.focus();
  }, [idx, typedMode, revealed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return;
      const t = e.target as HTMLElement | null;
      const inField = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (!revealed && (e.key === "Enter" || (e.key === " " && !typedMode))) {
        if (inField && e.key !== "Enter") return;
        e.preventDefault();
        if (typedMode) submitTyped();
        else reveal();
      } else if (revealed && !inField && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        void grade(Number(e.key));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, revealed, typedMode, reveal, submitTyped, grade]);

  if (finished) {
    return (
      <div className="fixed inset-0 z-40 grid place-items-center bg-[var(--color-ink)] px-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <Lantern size={64} />
          <h1 className="text-2xl font-semibold tracking-tight">¡Drill completo!</h1>
          <p className="text-[var(--color-fg-muted)]">{done} kana repasados. Continuará…</p>
          <button onClick={() => router.push("/kana")} className="mt-2 rounded-xl bg-gradient-to-r from-[var(--color-akari)] to-[var(--color-ember)] px-5 py-2.5 font-semibold text-[var(--color-ink-deep)] shadow-[var(--akari-glow)] transition-[filter] hover:brightness-105">
            Volver
          </button>
        </div>
      </div>
    );
  }

  const progress = (done / items.length) * 100;
  const prompt = mode === "recognition" ? item.char : item.romaji;
  const answer = mode === "recognition" ? item.romaji : item.char;
  const promptJp = mode === "recognition";

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[var(--color-ink)]">
      <header className="flex items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={() => router.push("/kana")} aria-label="Salir" className="grid h-9 w-9 place-items-center rounded-lg text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-[var(--color-fg-faint)]">{title}</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--color-ember)] to-[var(--color-akari)]" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: reduce ? 0 : 0.3, ease: EASE }} />
          </div>
        </div>
        <span className="text-xs tabular-nums text-[var(--color-fg-faint)]">{done}/{items.length}</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div
          onClick={!revealed && !typedMode ? reveal : undefined}
          role={!revealed && !typedMode ? "button" : undefined}
          tabIndex={!revealed && !typedMode ? 0 : undefined}
          className={`surface ambient-lantern relative grid min-h-[44vh] w-full max-w-md place-items-center overflow-hidden px-6 py-10 text-center ${!revealed && !typedMode ? "cursor-pointer" : ""}`}
          style={revealed ? { boxShadow: "var(--akari-glow)" } : undefined}
        >
          {item.isNew && (
            <span className="absolute left-4 top-4 rounded-full bg-[color-mix(in_oklab,var(--color-ember)_22%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ember)]">nuevo</span>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {!revealed ? (
              <motion.div key="front" initial={{ opacity: 0 }} animate={{ opacity: 1, rotateY: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, rotateY: -8 }} transition={{ duration: reduce ? 0.05 : 0.18, ease: EASE }}>
                <div lang={promptJp ? "ja" : undefined} className={`${promptJp ? "font-jp text-8xl" : "text-7xl"} font-medium leading-none text-[var(--color-fg)]`}>{prompt}</div>
                {typedMode ? (
                  <input
                    ref={inputRef}
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitTyped(); } }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="romaji…"
                    aria-label="Escribe el romaji"
                    className="mt-8 w-44 rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] px-4 py-3 text-center text-2xl tracking-wide text-[var(--color-fg)] outline-none transition-colors placeholder:text-[var(--color-fg-faint)] focus:border-[var(--color-indigo)]"
                  />
                ) : (
                  <p className="mt-8 text-sm text-[var(--color-fg-faint)]">Toca para mostrar · espacio</p>
                )}
              </motion.div>
            ) : (
              <motion.div key="back" initial={reduce ? { opacity: 0 } : { opacity: 0, rotateY: 8 }} animate={{ opacity: 1, rotateY: 0 }} transition={{ duration: reduce ? 0.05 : 0.22, ease: EASE }} className="flex flex-col items-center gap-3">
                <div lang={promptJp ? "ja" : undefined} className={`${promptJp ? "font-jp text-3xl" : "text-4xl"} text-[var(--color-fg-muted)]`}>{prompt}</div>
                <div lang={promptJp ? undefined : "ja"} className={`${promptJp ? "text-6xl" : "font-jp text-7xl"} font-medium leading-none text-[var(--color-ember)]`}>{answer}</div>
                {wasCorrect !== null && (
                  <div className={`text-sm font-medium ${wasCorrect ? "text-[var(--color-good)]" : "text-[var(--color-again)]"}`}>
                    {wasCorrect ? "¡Correcto!" : `Escribiste «${typed.trim() || "—"}»`}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-md">
          {!revealed ? (
            <button onClick={typedMode ? submitTyped : reveal} className="w-full rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] py-3.5 font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-indigo)]">
              {typedMode ? "Comprobar" : "Mostrar respuesta"}
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {GRADES.map((b) => (
                <button key={b.g} disabled={pending} onClick={() => grade(b.g)} className="flex flex-col items-center gap-0.5 rounded-xl border py-2.5 transition-[transform] duration-[var(--motion-fast)] active:scale-[0.97] disabled:opacity-50" style={{ borderColor: "color-mix(in oklab, var(--btn) 45%, transparent)", ["--btn" as string]: b.color }}>
                  <span className="text-sm font-medium" style={{ color: b.color }}>{b.label}</span>
                  <span className="text-[11px] tabular-nums text-[var(--color-fg-faint)]">{item.intervals[KEYS[b.g - 1]]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
