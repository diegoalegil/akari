"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

const GRADES = [
  { g: 1 as const, label: "Otra vez", color: "var(--color-again)", key: "1", k: "again" },
  { g: 2 as const, label: "Difícil", color: "var(--color-hard)", key: "2", k: "hard" },
  { g: 3 as const, label: "Bien", color: "var(--color-good)", key: "3", k: "good" },
  { g: 4 as const, label: "Fácil", color: "var(--color-easy)", key: "4", k: "easy" },
] as const;

// Split "10 min" / "1 d" into figure + unit so the number leads in tabular-nums
// and the unit trails in fg-faint (the eye reads the grade, then the interval).
function splitInterval(s: string): { n: string; u: string } {
  const parts = (s || "").trim().split(/\s+/);
  return { n: parts[0] ?? "", u: parts.slice(1).join(" ") };
}

/**
 * REDISEÑO — the SRS grade row. Near-monochrome at rest; each cell reveals its
 * muted semantic colour only as a 2px bottom accent + a faint wash that lifts on
 * hover with a soft matching glow (the akari signature, scoped per grade). The
 * 1–4 keyboard shortcut shows in a corner chip and fires the same press. Interval
 * preview is live-computed by the caller (FSRS) and rendered figure-over-unit.
 */
export function GradeButtons({
  intervals,
  onGrade,
  disabled = false,
}: {
  intervals: { again: string; hard: string; good: string; easy: string };
  onGrade: (g: 1 | 2 | 3 | 4) => void;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  const [lastKey, setLastKey] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        setLastKey(e.key);
        setTimeout(() => setLastKey(null), 150);
        onGrade(Number(e.key) as 1 | 2 | 3 | 4);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onGrade]);

  return (
    <div className="grid grid-cols-4 gap-2">
      {GRADES.map((b) => {
        const iv = splitInterval(intervals[b.k as keyof typeof intervals]);
        return (
          <motion.button
            key={b.g}
            disabled={disabled}
            onClick={() => onGrade(b.g)}
            animate={lastKey === b.key ? { scale: 0.94 } : { scale: 1 }}
            whileHover={reduce ? undefined : { y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.12, ease: EASE }}
            className="group relative flex flex-col items-center gap-0.5 overflow-hidden rounded-xl border py-2.5 transition-[background-color,box-shadow] duration-[var(--motion-fast)] hover:bg-[color-mix(in_oklab,var(--btn)_13%,transparent)] hover:shadow-[0_7px_20px_-10px_var(--btn)] disabled:opacity-50"
            style={{ borderColor: "color-mix(in oklab, var(--btn) 45%, transparent)", ["--btn" as string]: b.color }}
          >
            <span className="absolute right-1.5 top-1 hidden rounded border border-[var(--color-line)] px-1 text-[10px] leading-snug text-[var(--color-fg-faint)] sm:block">
              {b.key}
            </span>
            <span className="text-sm font-semibold" style={{ color: b.color }}>
              {b.label}
            </span>
            <span>
              <span className="text-[13px] tabular-nums text-[var(--color-fg-muted)]">{iv.n}</span>{" "}
              <span className="text-[10px] text-[var(--color-fg-faint)]">{iv.u}</span>
            </span>
            {/* the 2px semantic accent that thickens on hover */}
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-0.5 transition-[height] duration-[var(--motion-base)] group-hover:h-[3px]"
              style={{ background: b.color }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
