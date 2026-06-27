"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { getStats } from "@/lib/stats";
import { Loading } from "@/components/Loading";
import { Furigana } from "@/components/Furigana";
import { Eyebrow } from "@/components/Eyebrow";
import { Heatmap } from "@/components/stats/Heatmap";
import { ProgressBar } from "@/components/stats/ProgressBar";
import { useDbReady } from "@/lib/useDb";

const EASE = [0.22, 1, 0.36, 1] as const;
const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);

// A section that fades+rises into view once, calm and never loud.
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      className={`surface p-5 ${className}`}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
    >
      {children}
    </motion.section>
  );
}

function StatTop({ value, label, hero = false }: { value: string; label: string; hero?: boolean }) {
  return (
    <div className="px-5 py-4">
      <div
        className={
          hero
            ? "text-glow text-[2.4rem] font-bold leading-none tracking-tight tabular-nums text-[var(--color-akari)]"
            : "text-3xl font-semibold leading-none tracking-tight tabular-nums text-[var(--color-fg)]"
        }
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-[var(--color-fg-muted)]">{label}</div>
    </div>
  );
}

export default function StatsPage() {
  const dbReady = useDbReady();
  if (!dbReady) return <Loading />;
  const s = getStats();
  const fcMax = Math.max(1, ...s.forecast.map((f) => f.count));

  if (s.totalReviews === 0) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Progreso</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">La luz que vas a encender.</p>
        <div className="surface mt-8 flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span lang="ja" className="font-jp text-4xl text-[var(--color-ember)] text-glow">灯</span>
          <p className="max-w-sm text-pretty text-[var(--color-fg-muted)]">
            Tu retención, racha, mapa de actividad y pronóstico aparecerán aquí en cuanto termines tu primera sesión de repaso.
          </p>
          <Link href="/review" className="btn btn-primary mt-2">
            Empezar a estudiar →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Progreso</h1>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">La luz que ya has encendido.</p>

      {/* top metrics — retention is the hero */}
      <div className="surface mt-6 grid grid-cols-2 divide-x divide-y divide-[var(--color-line)] sm:grid-cols-4 sm:divide-y-0">
        <StatTop value={pct(s.retention)} label="retención" hero />
        <StatTop value={String(s.streak)} label="días de racha" />
        <StatTop value={String(s.viewsToday)} label="vistas hoy" />
        <StatTop value={pct(s.mastery)} label="dominio" />
      </div>

      {/* heatmap — field of lanterns */}
      <Section className="mt-5">
        <Eyebrow>Actividad</Eyebrow>
        <h2 className="mt-1.5 font-medium text-[var(--color-fg)]">Último año de repasos</h2>
        <div className="mt-4">
          <Heatmap cells={s.heatmap} max={s.heatmapMax} />
        </div>
      </Section>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* kanji handwriting by grade */}
        <Section>
          <div className="flex items-baseline justify-between">
            <div>
              <Eyebrow>Dominio</Eyebrow>
              <h2 className="mt-1.5 font-medium text-[var(--color-fg)]">Trazos de kanji</h2>
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
                <ProgressBar key={g.label} value={g.known} total={g.total} label={g.label === "+" ? "Avanzado" : `Grado ${g.label}`} />
              ))}
            </div>
          )}
        </Section>

        {/* forecast — future loses light toward +14d */}
        <Section>
          <Eyebrow>Pronóstico</Eyebrow>
          <h2 className="mt-1.5 font-medium text-[var(--color-fg)]">Vencen en 14 días</h2>
          <div className="mt-5 flex h-32 items-end gap-1.5">
            {s.forecast.map((f, i) => (
              <div
                key={f.date}
                role="img"
                aria-label={`${f.date}: ${f.count} ${f.count === 1 ? "repaso" : "repasos"}`}
                className="group flex flex-1 flex-col items-center justify-end"
                title={`${f.date}: ${f.count}`}
              >
                <motion.div
                  className="w-full rounded-t-[3px] transition-[filter] group-hover:brightness-125"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(f.count / fcMax) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EASE, delay: i * 0.02 }}
                  style={{
                    minHeight: f.count ? 4 : 2,
                    background: i === 0 ? "var(--color-akari)" : `color-mix(in oklab, var(--color-indigo) ${Math.max(20, 70 - i * 3)}%, transparent)`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-[var(--color-fg-faint)]">
            <span>hoy</span>
            <span>+14 d</span>
          </div>
        </Section>
      </div>

      {/* JLPT */}
      {!s.jlpt.every((j) => j.total === 0) && (
        <Section className="mt-5">
          <Eyebrow>Dominio</Eyebrow>
          <h2 className="mt-1.5 font-medium text-[var(--color-fg)]">Vocabulario por nivel JLPT</h2>
          <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {s.jlpt.map((j) => (
              <ProgressBar key={j.level} value={j.known} total={j.total} label={j.level} from="var(--color-good)" to="var(--color-easy)" />
            ))}
          </div>
        </Section>
      )}

      {/* leeches */}
      {s.leeches.length > 0 && (
        <Section className="mt-5">
          <Eyebrow>Se te resisten</Eyebrow>
          <h2 className="mt-1.5 font-medium text-[var(--color-fg)]">Palabras que más olvidas</h2>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">Las que más veces se te han escapado. Dales un repaso extra.</p>
          <ul className="mt-4 flex flex-col">
            {s.leeches.map((w, i) => (
              <li
                key={w.expression + i}
                className="flex items-center justify-between gap-3 rounded-lg border-l-2 py-2.5 pl-3 transition-colors hover:bg-[color-mix(in_oklab,var(--color-again)_6%,transparent)]"
                style={{ borderLeftColor: `color-mix(in oklab, var(--color-again) ${30 + w.lapses * 8}%, transparent)` }}
              >
                <div className="min-w-0">
                  <span lang="ja" className="font-jp text-lg leading-relaxed text-[var(--color-fg)]">
                    <Furigana text={w.furigana} fallback={w.expression} />
                  </span>
                  <span className="ml-2 text-sm text-[var(--color-fg-muted)]">· {w.meaning}</span>
                </div>
                <span className="shrink-0 rounded-full bg-[color-mix(in_oklab,var(--color-again)_18%,transparent)] px-2 py-0.5 text-xs font-medium tabular-nums text-[var(--color-again)]">
                  {w.lapses} {w.lapses === 1 ? "fallo" : "fallos"}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/review/leeches" className="btn btn-primary mt-4 block w-full text-center">
            Repasar las que se te resisten →
          </Link>
        </Section>
      )}
    </div>
  );
}
