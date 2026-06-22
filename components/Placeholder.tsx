import type { ReactNode } from "react";
import { Lantern } from "./Lantern";

// On-brand "coming in a later phase" screen for routes not built yet.
export function Placeholder({ title, glyph, phase, children }: { title: string; glyph: string; phase: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <div className="flex items-center gap-3">
        <span className="font-jp text-3xl text-[var(--color-fg-faint)]">{glyph}</span>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="surface ambient-lantern mt-6 flex flex-col items-center gap-4 p-12 text-center">
        <Lantern size={56} />
        <p className="max-w-sm text-[var(--color-fg-muted)]">{children}</p>
        <span className="rounded-full border border-[var(--color-line-strong)] px-3 py-1 text-xs text-[var(--color-fg-faint)]">
          {phase}
        </span>
      </div>
    </div>
  );
}
