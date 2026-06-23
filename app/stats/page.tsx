"use client";
import { getStats } from "@/lib/stats";
import { Loading } from "@/components/Loading";
import { useDbReady } from "@/lib/useDb";

const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);

function StatTop({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="px-5 py-4">
      <div className="text-3xl font-semibold tracking-tight text-[var(--color-fg)]">
        {value}
        {accent && <span className="ml-0.5 inline-block h-[3px] w-8 align-middle" style={{ background: accent }} />}
      </div>
      <div className="mt-1 text-sm text-[var(--color-fg-muted)]">{label}</div>
    </div>
  );
}

function heatColor(count: number, max: number): string {
  if (count <= 0) return "var(--color-surface-2)";
  const t = max ? count / max : 0;
  const mix = t <= 0.25 ? 22 : t <= 0.5 ? 40 : t <= 0.75 ? 58 : 78;
  const base = t > 0.6 ? "var(--color-akari)" : "var(--color-ember)";
  return `color-mix(in oklab, ${base} ${mix}%, var(--color-surface-3))`;
}

export default function StatsPage() {
  const dbReady = useDbReady();
  if (!dbReady) return <Loading />;
  const s = getStats();
  const fcMax = Math.max(1, ...s.forecast.map((f) => f.count));

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Progreso</h1>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">La luz que ya has encendido.</p>

      {/* top metrics */}
      <div className="surface mt-6 grid grid-cols-2 divide-x divide-y divide-[var(--color-line)] sm:grid-cols-4 sm:divide-y-0">
        <StatTop value={pct(s.retention)} label="retención" accent="var(--color-akari)" />
        <StatTop value={String(s.streak)} label="días de racha" />
        <StatTop value={String(s.viewsToday)} label="vistas hoy" />
        <StatTop value={pct(s.mastery)} label="dominio" />
      </div>

      {/* heatmap */}
      <section className="surface mt-5 p-5">
        <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">Actividad</div>
        <h2 className="mt-0.5 font-medium text-[var(--color-fg)]">Último año de repasos</h2>
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ width: "max-content" }}>
            {s.heatmap.map((d) => (
              <div key={d.date} role="img" aria-label={`${d.date}: ${d.count} ${d.count === 1 ? "repaso" : "repasos"}`} title={`${d.date}: ${d.count}`} className="h-3 w-3 rounded-[3px]" style={{ background: heatColor(d.count, s.heatmapMax) }} />
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-[var(--color-fg-faint)]">
          menos
          {[0, 0.3, 0.6, 1].map((t, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: heatColor(t * s.heatmapMax || (t ? 1 : 0), s.heatmapMax || 1) }} />
          ))}
          más
        </div>
      </section>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* Kanji handwriting mastery — by school grade */}
        <section className="surface p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">Dominio</div>
              <h2 className="mt-0.5 font-medium text-[var(--color-fg)]">Trazos de kanji</h2>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold tabular-nums text-[var(--color-fg)]">
                {s.kanji.known}
                <span className="text-sm font-normal text-[var(--color-fg-faint)]"> / {s.kanji.total}</span>
              </div>
              <div className="text-[11px] text-[var(--color-fg-faint)]">{s.kanji.introduced} empezados</div>
            </div>
          </div>
          {s.kanjiByGrade.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-fg-faint)]">Aún no hay kanji para escribir.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {s.kanjiByGrade.map((g) => (
                <div key={g.label}>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-fg-muted)]">{g.label === "+" ? "Avanzado" : `Grado ${g.label}`}</span>
                    <span className="tabular-nums text-[var(--color-fg-faint)]">{g.known} / {g.total}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-ember)] to-[var(--color-akari)]" style={{ width: `${g.total ? (g.known / g.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* forecast */}
        <section className="surface p-5">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">Pronóstico</div>
          <h2 className="mt-0.5 font-medium text-[var(--color-fg)]">Vencen en 14 días</h2>
          <div className="mt-5 flex h-32 items-end gap-1.5">
            {s.forecast.map((f, i) => (
              <div key={f.date} role="img" aria-label={`${f.date}: ${f.count} ${f.count === 1 ? "repaso" : "repasos"}`} className="flex flex-1 flex-col items-center justify-end" title={`${f.date}: ${f.count}`}>
                <div
                  className="w-full rounded-t-[3px]"
                  style={{ height: `${(f.count / fcMax) * 100}%`, minHeight: f.count ? 4 : 2, background: i === 0 ? "var(--color-akari)" : "color-mix(in oklab, var(--color-indigo) 70%, transparent)" }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-[var(--color-fg-faint)]">
            <span>hoy</span>
            <span>+14 d</span>
          </div>
        </section>
      </div>

      {/* Vocabulary mastery by JLPT level (words.jlpt is ~87% tagged) */}
      {!s.jlpt.every((j) => j.total === 0) && (
        <section className="surface mt-5 p-5">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">Dominio</div>
          <h2 className="mt-0.5 font-medium text-[var(--color-fg)]">Vocabulario por nivel JLPT</h2>
          <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {s.jlpt.map((j) => (
              <div key={j.level}>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-fg-muted)]">{j.level}</span>
                  <span className="tabular-nums text-[var(--color-fg-faint)]">{j.known} / {j.total}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-good)] to-[var(--color-easy)]" style={{ width: `${j.total ? (j.known / j.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Leeches — words that keep slipping, worth extra attention */}
      {s.leeches.length > 0 && (
        <section className="surface mt-5 p-5">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">Se te resisten</div>
          <h2 className="mt-0.5 font-medium text-[var(--color-fg)]">Palabras que más olvidas</h2>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">Las que más veces se te han escapado. Dales un repaso extra.</p>
          <ul className="mt-4 flex flex-col divide-y divide-[var(--color-line)]">
            {s.leeches.map((w) => (
              <li key={w.expression} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <span lang="ja" className="font-jp text-lg text-[var(--color-fg)]">{w.expression}</span>
                  <span lang="ja" className="font-jp ml-2 text-sm text-[var(--color-ember)]">{w.reading}</span>
                  <span className="ml-2 text-sm text-[var(--color-fg-muted)]">· {w.meaning}</span>
                </div>
                <span className="shrink-0 rounded-full bg-[color-mix(in_oklab,var(--color-again)_18%,transparent)] px-2 py-0.5 text-xs font-medium tabular-nums text-[var(--color-again)]">
                  {w.lapses} {w.lapses === 1 ? "fallo" : "fallos"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
