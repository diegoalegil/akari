"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

export type ExplainContext = { expression: string; reading?: string; meaning?: string; sentence?: string };
type Turn = { role: "user" | "assistant"; text: string };

const EASE = [0.22, 1, 0.36, 1] as const;

export function Explain({ context, label = "Explícame" }: { context: ExplainContext; label?: string }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Turn[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState("");
  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const ask = useCallback(
    async (question?: string) => {
      const base: Turn[] = question ? [...history, { role: "user", text: question }] : [{ role: "user", text: "Explícame la gramática y el uso." }];
      setStreaming(true);
      setHistory([...base, { role: "assistant", text: "" }]);
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context, history: base }),
        });
        if (res.status === 503) {
          setHistory([...base, { role: "assistant", text: "Para usar Explícame, añade tu `ANTHROPIC_API_KEY` en `.env.local` y reinicia. Es la única función que usa IA — bajo demanda y de tu cuenta." }]);
          return;
        }
        if (!res.body) throw new Error("no body");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          setHistory([...base, { role: "assistant", text: acc }]);
        }
      } catch {
        setHistory([...base, { role: "assistant", text: "_No se pudo conectar con la IA._" }]);
      } finally {
        setStreaming(false);
      }
    },
    [context, history],
  );

  useEffect(() => {
    if (open && !startedRef.current) {
      startedRef.current = true;
      void ask();
    }
    if (!open) startedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);

  // Escape closes; move focus into the panel when it opens.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setHistory([]);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[color-mix(in_oklab,var(--color-indigo)_55%,transparent)] px-3 py-1.5 text-sm text-[var(--color-indigo)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-indigo)_12%,transparent)]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" /><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" />
        </svg>
        {label}
        <span className="rounded bg-[color-mix(in_oklab,var(--color-indigo)_22%,transparent)] px-1.5 text-[10px] font-medium uppercase tracking-wide">IA</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex justify-end bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="explain-title"
              onClick={(e) => e.stopPropagation()}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.26, ease: EASE }}
              className="flex h-full w-full max-w-md flex-col border border-dotted border-[color-mix(in_oklab,var(--color-indigo)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-indigo)_8%,var(--color-surface))]"
              style={{ boxShadow: "-8px 0 40px -12px rgba(0,0,0,0.5)" }}
            >
              <header className="flex items-center gap-3 border-b border-[var(--color-line)] px-5 pt-[max(0.9rem,env(safe-area-inset-top))] pb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span id="explain-title" className="font-medium text-[var(--color-fg)]">Sensei</span>
                    <span className="rounded bg-[color-mix(in_oklab,var(--color-indigo)_22%,transparent)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-indigo)]">IA</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-fg-faint)]">puede fallar · repregunta si dudas</p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Cerrar" className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
              </header>

              <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
                <div className="rounded-lg border border-dashed border-[color-mix(in_oklab,var(--color-indigo)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-indigo)_8%,transparent)] px-3 py-2 text-sm">
                  <span lang="ja" className="font-jp text-[var(--color-fg)]">{context.expression}</span>
                  {context.reading && <span lang="ja" className="font-jp ml-2 text-[var(--color-fg-muted)]">{context.reading}</span>}
                  {context.meaning && <span className="ml-2 text-[var(--color-fg-faint)]">· {context.meaning}</span>}
                </div>
                {history.map((t, i) => (
                  <div key={i} className={t.role === "user" ? "self-end rounded-2xl rounded-br-sm bg-[var(--color-surface-3)] px-3.5 py-2 text-sm text-[var(--color-fg)]" : "text-sm leading-relaxed text-[var(--color-fg)]"}>
                    {t.role === "assistant" ? (
                      <div className="whitespace-pre-wrap">{t.text || (streaming ? "…" : "")}</div>
                    ) : (
                      t.text
                    )}
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = input.trim();
                  if (!q || streaming) return;
                  setInput("");
                  void ask(q);
                }}
                className="flex items-center gap-2 border-t border-[var(--color-line)] px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  aria-label="Repregunta a Sensei"
                  placeholder="Repregunta a Sensei…"
                  className="flex-1 rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-faint)] focus:outline-none"
                />
                <button type="submit" aria-label="Enviar" disabled={streaming || !input.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-indigo)] text-white transition-opacity disabled:opacity-40">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                </button>
              </form>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
