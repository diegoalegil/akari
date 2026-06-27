"use client";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * REDISEÑO — one mastery bar for JLPT levels, kanji-by-grade and any ratio in
 * Progreso. The fill is a live gradient (ember→akari by default, good→easy for
 * vocab) over a surface-3 track, with a 1px specular highlight on the top edge so
 * it reads like a tube of warm light, not a flat fill. It animates from 0 when
 * it scrolls into view (once), and at 100% a soft permanent halo marks the level
 * as completed. Honours prefers-reduced-motion (no grow, just the final width).
 */
export function ProgressBar({
  value,
  total,
  label,
  from = "var(--color-ember)",
  to = "var(--color-akari)",
}: {
  value: number;
  total: number;
  label?: string;
  from?: string;
  to?: string;
}) {
  const reduce = useReducedMotion();
  const pct = total ? Math.min(100, (value / total) * 100) : 0;
  const done = total > 0 && value >= total;

  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-[var(--color-fg-muted)]">{label}</span>
        <span className="tabular-nums text-[var(--color-fg-faint)]">
          {value} / {total}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
        <motion.div
          className="relative h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${from}, ${to})`,
            boxShadow: done ? `0 0 10px -2px color-mix(in oklab, ${to} 60%, transparent)` : undefined,
          }}
          initial={reduce ? false : { width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: reduce ? 0 : 0.7, ease: EASE }}
        >
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-white/25" />
        </motion.div>
      </div>
    </div>
  );
}
