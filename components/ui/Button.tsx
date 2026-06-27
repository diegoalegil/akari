"use client";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * REDISEÑO — the three honest button tiers, as one component, so the primary
 * always sings and the rest accompany. Mirrors the `.btn-*` classes shipped in
 * the upgraded globals.css (use either; this is the typed React wrapper).
 *
 *  variant="primary"   akari→ember gradient + akari-glow + warm press
 *  variant="secondary" surface + line-strong border, indigo focus on hover
 *  variant="ghost"     text only, muted → fg on hover
 *
 * `loading` swaps the label for a dim ember spinner while keeping the width.
 */
type Variant = "primary" | "secondary" | "ghost";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm px-[1.15rem] py-[0.7rem] " +
  "transition-[transform,filter,box-shadow,border-color] duration-[var(--motion-base)] [transition-timing-function:var(--ease-akari)] " +
  "active:scale-[0.975] disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<Variant, string> = {
  primary:
    "text-[var(--color-ink-deep)] bg-gradient-to-br from-[var(--color-akari)] to-[var(--color-ember)] " +
    "shadow-[var(--akari-glow)] hover:brightness-105 hover:-translate-y-px active:brightness-95",
  secondary:
    "text-[var(--color-fg)] bg-[var(--color-surface-2)] border border-[var(--color-line-strong)] hover:border-[var(--color-indigo)]",
  ghost: "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; children: ReactNode }
>(function Button({ variant = "primary", loading = false, className = "", children, ...props }, ref) {
  return (
    <button ref={ref} className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props}>
      {loading ? (
        <span
          aria-hidden
          className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent opacity-60"
          style={{ animation: "spin 0.7s linear infinite" }}
        />
      ) : (
        children
      )}
    </button>
  );
});
