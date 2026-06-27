"use client";

/**
 * REDISEÑO — the activity heatmap as a field of paper lanterns. Instead of flat
 * GitHub-green cells, intense days carry a soft radial akari glow (box-shadow,
 * no hard edge) that grows with the count, so a year of constancy reads as a
 * constellation of warm lights over the ink. The ramp goes surface-2 (cero) →
 * ember (bajo) → akari (alto), perceptually stepped in oklab.
 *
 * Props match the `s.heatmap` / `s.heatmapMax` shape from lib/stats.
 */
function heatColor(count: number, max: number): string {
  if (count <= 0) return "var(--color-surface-2)";
  const t = max ? count / max : 0;
  const mix = t <= 0.25 ? 22 : t <= 0.5 ? 40 : t <= 0.75 ? 58 : 78;
  const base = t > 0.6 ? "var(--color-akari)" : "var(--color-ember)";
  return `color-mix(in oklab, ${base} ${mix}%, var(--color-surface-3))`;
}
function heatGlow(count: number, max: number): string {
  const t = max ? count / max : 0;
  return t > 0.6 ? `0 0 7px color-mix(in oklab, var(--color-akari) ${Math.round(t * 45)}%, transparent)` : "none";
}

export function Heatmap({ cells, max }: { cells: { date: string; count: number }[]; max: number }) {
  return (
    <div>
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ width: "max-content" }}>
          {cells.map((d) => (
            <div
              key={d.date}
              role="img"
              aria-label={`${d.date}: ${d.count} ${d.count === 1 ? "repaso" : "repasos"}`}
              title={`${d.date}: ${d.count}`}
              className="h-3 w-3 rounded-[3px]"
              style={{ background: heatColor(d.count, max), boxShadow: heatGlow(d.count, max) }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-[var(--color-fg-faint)]">
        menos
        {[0, 0.3, 0.6, 1].map((t, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ background: heatColor(t ? Math.max(1, Math.round(t * max)) : 0, max || 1) }}
          />
        ))}
        más
      </div>
    </div>
  );
}
