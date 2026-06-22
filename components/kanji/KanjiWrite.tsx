"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KanjiWriteItem } from "@/lib/kanjiDrill";
import { matchKanji, type MatchResult, type Pt } from "@/lib/strokeMatch";
import { gradeCard } from "@/app/review/actions";
import { Lantern } from "@/components/Lantern";

const EASE = [0.22, 1, 0.36, 1] as const;
const GRADES = [
  { g: 1, label: "Otra vez", color: "var(--color-again)", key: "1" },
  { g: 2, label: "Difícil", color: "var(--color-hard)", key: "2" },
  { g: 3, label: "Bien", color: "var(--color-good)", key: "3" },
  { g: 4, label: "Fácil", color: "var(--color-easy)", key: "4" },
] as const;
const KEYS = ["again", "hard", "good", "easy"] as const;
const BLANK_INTERVALS = { again: "", hard: "", good: "", easy: "" } as const;

const ptsAttr = (s: Pt[]) => s.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

function sampleEl(el: SVGPathElement | null, n = 32): Pt[] {
  if (!el) return [];
  let len = 0;
  try { len = el.getTotalLength(); } catch { return []; }
  if (!len) return [];
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = el.getPointAtLength((len * i) / (n - 1));
    out.push({ x: p.x, y: p.y });
  }
  return out;
}

export function KanjiWrite({ items }: { items: KanjiWriteItem[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [queue, setQueue] = useState<KanjiWriteItem[]>(items);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(0);
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const [cur, setCur] = useState<Pt[]>([]);
  const [checked, setChecked] = useState<MatchResult | null>(null);
  const [guide, setGuide] = useState(false);
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [correct, setCorrect] = useState(0);

  const svgRef = useRef<SVGSVGElement>(null);
  const refPaths = useRef<(SVGPathElement | null)[]>([]);
  const drawing = useRef(false);
  const curRef = useRef<Pt[]>([]); // source of truth for the in-progress stroke
  const startedAt = useRef<number>(Date.now());

  const finished = idx >= queue.length;
  const item = queue[idx];

  const toSvg = useCallback((e: React.PointerEvent): Pt => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: loc.x, y: loc.y };
  }, []);

  const onDown = (e: React.PointerEvent) => {
    if (checked) return;
    e.preventDefault();
    try { (e.currentTarget as SVGElement).setPointerCapture(e.pointerId); } catch { /* capture optional */ }
    drawing.current = true;
    curRef.current = [toSvg(e)];
    setCur(curRef.current);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current || checked) return;
    curRef.current = [...curRef.current, toSvg(e)];
    setCur(curRef.current);
  };
  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    // Snapshot the stroke into a local BEFORE resetting the ref — the setStrokes
    // updater runs later and would otherwise read the already-cleared ref.
    const stroke = curRef.current;
    curRef.current = [];
    setCur([]);
    if (stroke.length > 1) setStrokes((s) => [...s, stroke]);
  };

  const undo = () => !checked && setStrokes((s) => s.slice(0, -1));
  const clear = () => !checked && setStrokes([]);

  const check = useCallback(() => {
    if (checked || !item || strokes.length === 0) return;
    const ref = item.strokes.map((_, i) => sampleEl(refPaths.current[i]));
    setChecked(matchKanji(strokes, ref));
    setGuide(true);
  }, [checked, item, strokes]);

  const grade = useCallback(
    async (g: number) => {
      if (!checked || pending || !item) return;
      setPending(true);
      setSaveError(false);
      let res: { ok: boolean } | undefined;
      try {
        res = await gradeCard("kanji", item.id, g as 1 | 2 | 3 | 4, Date.now() - startedAt.current);
      } catch {
        res = { ok: false };
      }
      if (!res?.ok) {
        setPending(false);
        setSaveError(true);
        return;
      }
      // Re-queue a failed kanji this session (blank the stale interval preview).
      if (g === 1) setQueue((q) => [...q, { ...item, intervals: { ...BLANK_INTERVALS } }]);
      if (g >= 3 && checked.ok) setCorrect((c) => c + 1);
      setDone((d) => d + 1);
      setStrokes([]);
      setCur([]);
      setChecked(null);
      setGuide(false);
      setPending(false);
      startedAt.current = Date.now();
      setIdx((i) => i + 1);
    },
    [checked, pending, item],
  );

  // Keyboard: Enter checks; 1–4 grade after checking; Backspace undoes a stroke.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (!checked && e.key === "Enter") { e.preventDefault(); check(); }
      else if (checked && ["1", "2", "3", "4"].includes(e.key)) { e.preventDefault(); void grade(Number(e.key)); }
      else if (!checked && (e.key === "Backspace" || e.key.toLowerCase() === "z")) { e.preventDefault(); undo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, checked, check, grade]);

  if (finished) {
    return (
      <motion.div className="fixed inset-0 z-40 grid place-items-center bg-[var(--color-ink)] px-6" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <div className="flex flex-col items-center gap-5 text-center">
          <Lantern size={64} />
          <h1 className="text-2xl font-semibold tracking-tight">¡Escritura completa!</h1>
          <p className="text-[var(--color-fg-muted)]">{done} {done === 1 ? "kanji" : "kanji"} · {correct} {correct === 1 ? "perfecto" : "perfectos"}</p>
          <p className="text-sm text-[var(--color-fg-faint)]">Continuará…</p>
          <button onClick={() => router.push("/kanji")} className="mt-2 rounded-xl bg-gradient-to-r from-[var(--color-akari)] to-[var(--color-ember)] px-5 py-2.5 font-semibold text-[var(--color-ink-deep)] shadow-[var(--akari-glow)] transition-[filter] hover:brightness-105">Volver</button>
        </div>
      </motion.div>
    );
  }

  const progress = queue.length ? (done / queue.length) * 100 : 0;

  return (
    <motion.div className="fixed inset-0 z-40 flex flex-col bg-[var(--color-ink)]" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }}>
      <header className="flex items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={() => router.push("/kanji")} aria-label="Salir" className="grid h-9 w-9 place-items-center rounded-lg text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-[var(--color-fg-faint)]">Escritura de kanji</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--color-ember)] to-[var(--color-akari)]" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: reduce ? 0 : 0.3, ease: EASE }} />
          </div>
        </div>
        <span className="text-xs tabular-nums text-[var(--color-fg-faint)]">{done}/{queue.length}</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-4">
        {/* prompt */}
        <div className="text-center">
          {item.isNew && <span className="mb-1 inline-block rounded-full bg-[color-mix(in_oklab,var(--color-ember)_22%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ember)]">nuevo</span>}
          <div className="text-xl font-medium text-[var(--color-fg)]">{item.meaning || "—"}</div>
          {item.reading && <div lang="ja" className="font-jp text-[var(--color-ember)]">{item.reading}</div>}
          <p className="mt-1 text-sm text-[var(--color-fg-faint)]">{checked ? "Así se escribe:" : "Escribe el kanji de memoria"}</p>
        </div>

        {/* canvas */}
        <div className="surface ambient-lantern relative w-full max-w-[340px] overflow-hidden" style={checked?.ok ? { boxShadow: "var(--akari-glow)" } : undefined}>
          <svg
            ref={svgRef}
            viewBox="0 0 109 109"
            className="block aspect-square w-full touch-none select-none"
            role="application"
            aria-label="Lienzo para escribir el kanji"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerLeave={onUp}
          >
            {/* guide grid */}
            <g stroke="var(--color-line)" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.6">
              <line x1="54.5" y1="4" x2="54.5" y2="105" /><line x1="4" y1="54.5" x2="105" y2="54.5" />
            </g>
            {/* reference glyph: hidden by default (opacity 0 so it stays sample-able),
                faint when "Ver guía", and shown clearly after checking */}
            <g stroke="var(--color-akari)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"
               style={{ opacity: checked ? 0.45 : guide ? 0.18 : 0, transition: "opacity .2s" }}>
              {item.strokes.map((d, i) => (
                <path key={`r${item.id}-${i}`} ref={(el) => { refPaths.current[i] = el; }} d={d} />
              ))}
            </g>
            {/* user strokes */}
            <g fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              {strokes.map((s, i) => (
                <polyline key={i} points={ptsAttr(s)} stroke={checked ? (checked.perStroke[i] ? "var(--color-good)" : "var(--color-again)") : "var(--color-fg)"} />
              ))}
              {cur.length > 1 && <polyline points={ptsAttr(cur)} stroke="var(--color-fg)" />}
            </g>
          </svg>
          {/* revealed answer chip */}
          <AnimatePresence>
            {checked && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pointer-events-none absolute right-2 top-2 rounded-lg bg-[var(--color-surface-2)] px-2 py-1">
                <span lang="ja" className="font-jp text-2xl text-[var(--color-fg)]">{item.literal}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* tools / verdict */}
        {!checked ? (
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={!strokes.length} className="rounded-lg border border-[var(--color-line-strong)] px-3 py-1.5 text-sm text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)] disabled:opacity-40">Deshacer</button>
            <button onClick={clear} disabled={!strokes.length} className="rounded-lg border border-[var(--color-line-strong)] px-3 py-1.5 text-sm text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)] disabled:opacity-40">Borrar</button>
            <button onClick={() => setGuide((g) => !g)} className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${guide ? "border-[var(--color-akari)] text-[var(--color-akari)]" : "border-[var(--color-line-strong)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"}`}>{guide ? "Ocultar guía" : "Ver guía"}</button>
          </div>
        ) : (
          <p className={`text-sm font-medium ${checked.ok ? "text-[var(--color-good)]" : "text-[var(--color-hard)]"}`}>
            {checked.ok ? "¡Perfecto! Todos los trazos correctos." : !checked.countMatch ? `Esperaba ${checked.expected} trazos, dibujaste ${strokes.length}.` : `${checked.perStroke.filter(Boolean).length}/${checked.expected} trazos correctos.`}
          </p>
        )}
      </main>

      <footer className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-md">
          {saveError && <p role="alert" className="mb-2 text-center text-sm text-[var(--color-again)]">No se pudo guardar. Inténtalo de nuevo.</p>}
          {!checked ? (
            <button onClick={check} disabled={!strokes.length} className="w-full rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] py-3.5 font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-indigo)] disabled:opacity-40">
              Comprobar
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {GRADES.map((b) => (
                <button key={b.g} disabled={pending} onClick={() => grade(b.g)} className="relative flex flex-col items-center gap-0.5 rounded-xl border py-2.5 transition-[transform,background-color] duration-[var(--motion-fast)] hover:bg-[color-mix(in_oklab,var(--btn)_14%,transparent)] active:scale-[0.97] disabled:opacity-50" style={{ borderColor: "color-mix(in oklab, var(--btn) 45%, transparent)", ["--btn" as string]: b.color }}>
                  <span className="absolute right-1.5 top-1 hidden rounded border border-[var(--color-line)] px-1 text-[10px] text-[var(--color-fg-faint)] sm:block">{b.key}</span>
                  <span className="text-sm font-medium" style={{ color: b.color }}>{b.label}</span>
                  <span className="text-[11px] tabular-nums text-[var(--color-fg-faint)]">{item.intervals[KEYS[b.g - 1]]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </footer>
    </motion.div>
  );
}
