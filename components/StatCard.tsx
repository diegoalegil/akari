"use client";

/**
 * REDISEÑO — a coherent stat tile for the dashboard cluster and Progreso.
 * Editorial figure (tabular-nums so it never shimmer-shifts), a quiet Spanish
 * label, a faint font-jp watermark glyph, and a 2px accent bar that teaches the
 * category at a glance without saturating the surface (vocab=cyan, kanji=sakura,
 * racha=ember, etc.). Matches the existing `<StatCard label value glyph accent>`
 * call sites in app/page.tsx.
 */
export function StatCard({
  label,
  value,
  glyph,
  accent,
}: {
  label: string;
  value: string | number;
  glyph?: string;
  accent?: string;
}) {
  return (
    <div className="surface relative overflow-hidden p-4">
      {glyph && (
        <span
          lang="ja"
          aria-hidden
          className="font-jp pointer-events-none absolute -bottom-3.5 -right-1.5 select-none text-[62px] leading-none text-white/[0.04]"
        >
          {glyph}
        </span>
      )}
      <div className="text-2xl font-semibold leading-none tracking-tight tabular-nums text-[var(--color-fg)]">
        {value}
      </div>
      <div className="mt-1 text-sm text-[var(--color-fg-muted)]">{label}</div>
      {accent && (
        <span
          aria-hidden
          className="absolute bottom-0 left-4 h-[2px] w-[30px] rounded-full"
          style={{ background: accent, opacity: 0.85 }}
        />
      )}
    </div>
  );
}
