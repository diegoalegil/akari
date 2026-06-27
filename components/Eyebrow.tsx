"use client";
import type { ReactNode } from "react";

/**
 * REDISEÑO — the canonical section label ("eyebrow"). Replaces the repeated
 * `text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]` strings
 * scattered across the dashboard, stats and settings with one voice + a tiny
 * akari tick so every section header reads as the same brand mark.
 *
 * Usage:  <Eyebrow>Palabra del día</Eyebrow>
 */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-fg-faint)] ${className}`}
    >
      <span
        aria-hidden
        className="h-[0.3rem] w-[0.3rem] rounded-full bg-[var(--color-ember)]"
        style={{ boxShadow: "0 0 6px color-mix(in oklab, var(--color-ember) 70%, transparent)" }}
      />
      {children}
    </span>
  );
}
