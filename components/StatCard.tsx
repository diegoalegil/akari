import type { ReactNode } from "react";

// Calm, editorial stat tile. Numbers don't count-up (SRS data stays quiet).
export function StatCard({
  label,
  value,
  sub,
  glyph,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  glyph?: string;
  accent?: string;
}) {
  return (
    <div className="surface relative overflow-hidden p-4">
      {glyph && (
        <span className="font-jp pointer-events-none absolute -right-2 -top-3 select-none text-6xl leading-none text-white/[0.035]">
          {glyph}
        </span>
      )}
      <div className="text-2xl font-semibold tracking-tight text-[var(--color-fg)]">{value}</div>
      <div className="mt-0.5 text-sm text-[var(--color-fg-muted)]">{label}</div>
      {sub && <div className="mt-1 text-xs text-[var(--color-fg-faint)]">{sub}</div>}
      {accent && <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-full opacity-70" style={{ background: accent }} />}
    </div>
  );
}
