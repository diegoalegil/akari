"use client";
import Link from "next/link";
import { Lantern } from "@/components/Lantern";
import { Loading } from "@/components/Loading";
import { Reveal } from "@/components/Reveal";
import { StartSession } from "@/components/StartSession";
import { OnboardingCard } from "@/components/OnboardingCard";
import { StatCard } from "@/components/StatCard";
import { WordOfDay } from "@/components/WordOfDay";
import { getDashboard, getWordOfDay } from "@/lib/queries";
import { useDbReady } from "@/lib/useDb";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

const NF = new Intl.NumberFormat("es-ES");

// Status line for a study surface: due reviews take priority over new cards,
// falling back to a static description when nothing is waiting.
function surfaceSub(due: number, newAvail: number, idle: string): string {
  if (due > 0) return `${due} ${due === 1 ? "tarjeta lista" : "tarjetas listas"}`;
  if (newAvail > 0) return `${newAvail} ${newAvail === 1 ? "nueva por empezar" : "nuevas por empezar"}`;
  return idle;
}

function SurfaceTile({ href, title, sub, due, glyph, accent }: { href: string; title: string; sub: string; due: number; glyph: string; accent: string }) {
  return (
    <Link href={href} className="surface group relative flex items-center justify-between p-5 transition-colors hover:border-[var(--color-line-strong)]" style={{ ["--hover" as string]: accent }}>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--color-fg)]">{title}</span>
          {due > 0 && <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />}
        </div>
        <div className="text-sm text-[var(--color-fg-muted)]">{sub}</div>
      </div>
      <span lang="ja" className="font-jp text-3xl text-[var(--color-fg-faint)] transition-colors group-hover:[color:var(--hover)]">
        {glyph}
      </span>
    </Link>
  );
}

export default function Home() {
  const dbReady = useDbReady();
  if (!dbReady) return <Loading />;
  const d = getDashboard();
  const wod = getWordOfDay();
  const today = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const ready = d.dueNow + d.newRemaining;
  const kanjiReady = d.kanji.due + d.kanji.newAvail;
  const kanaReady = d.kana.due + d.kana.newAvail;

  if (!d.seeded) {
    return (
      <div className="mx-auto grid min-h-[100dvh] max-w-md place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Lantern size={72} />
          <h1 className="text-xl font-semibold">Akari aún no tiene datos</h1>
          <p className="text-[var(--color-fg-muted)]">
            Ejecuta <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 text-sm">npm run seed</code> para
            sembrar la base de datos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
      <Reveal>
        <p className="text-sm text-[var(--color-fg-muted)]">
          {greeting()} · <span className="first-letter:uppercase">{today}</span>
        </p>
      </Reveal>

      {!d.everReviewed && (
        <Reveal delay={0.02}>
          <div className="mt-4">
            <OnboardingCard />
          </div>
        </Reveal>
      )}

      {/* Hero — today's session */}
      <Reveal delay={0.04}>
        <section className="surface ambient-lantern relative mt-3 overflow-hidden p-7 md:p-9">
          <span aria-hidden="true" className="font-jp pointer-events-none absolute -right-8 -top-14 select-none text-[13rem] leading-none text-white/[0.03]">
            灯
          </span>
          <h1 className="text-xl font-medium text-[var(--color-fg-muted)]">Tu sesión de hoy</h1>

          {ready > 0 ? (
            <>
              <div className="mt-5 flex items-end gap-7">
                <div>
                  <div className="text-glow text-6xl font-semibold leading-none tracking-tight text-[var(--color-fg)]">{ready}</div>
                  <div className="mt-2 text-sm text-[var(--color-fg-muted)]">{ready === 1 ? "tarjeta lista" : "tarjetas listas"}</div>
                </div>
                <ul className="mb-1 space-y-1 text-sm text-[var(--color-fg-muted)]">
                  <li>
                    <span className="text-[var(--color-fg)]">{d.dueNow}</span> {d.dueNow === 1 ? "repaso vencido" : "repasos vencidos"}
                  </li>
                  <li>
                    <span className="text-[var(--color-fg)]">{d.newRemaining}</span> {d.newRemaining === 1 ? "palabra nueva" : "palabras nuevas"}
                  </li>
                </ul>
              </div>
              <StartSession />
            </>
          ) : kanjiReady + kanaReady > 0 ? (
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Lantern size={44} />
                <div>
                  <p className="text-lg text-[var(--color-fg)]">Vocabulario al día.</p>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    Aún te {kanjiReady + kanaReady === 1 ? "queda" : "quedan"}{kanjiReady > 0 ? ` ${kanjiReady} kanji` : ""}{kanjiReady > 0 && kanaReady > 0 ? " y" : ""}{kanaReady > 0 ? ` ${kanaReady} kana` : ""} por practicar.
                  </p>
                </div>
              </div>
              <Link
                href={kanjiReady > 0 ? "/kanji/write" : `/kana/drill?script=${d.kana.script}&mode=recognition`}
                className="shrink-0 rounded-xl bg-gradient-to-r from-[var(--color-akari)] to-[var(--color-ember)] px-5 py-2.5 text-center font-semibold text-[var(--color-ink-deep)] shadow-[var(--akari-glow)] transition-[filter] hover:brightness-105"
              >
                {kanjiReady > 0 ? "Escribir kanji" : "Practicar kana"} →
              </Link>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-4">
              <Lantern size={44} animated={false} />
              <div>
                <p className="text-lg text-[var(--color-fg)]">Todo al día.</p>
                <p className="text-sm text-[var(--color-fg-muted)]">Hoy descansas como en un episodio de relleno.</p>
              </div>
            </div>
          )}
        </section>
      </Reveal>

      {wod && (
        <Reveal delay={0.16}>
          <div className="mt-5">
            <WordOfDay word={wod} />
          </div>
        </Reveal>
      )}

      {/* recent kanji */}
      {d.recentKanji.length > 0 && (
        <Reveal delay={0.06}>
          <div className="mt-5 flex gap-2.5 overflow-x-auto pb-1">
            {d.recentKanji.map((k) => (
              <Link key={k.literal} href={`/kanji/${encodeURIComponent(k.literal)}`} className="surface flex min-w-[72px] flex-col items-center gap-1 px-4 py-3 transition-colors hover:border-[var(--color-line-strong)]">
                <span lang="ja" className="font-jp text-2xl text-[var(--color-fg)]">{k.literal}</span>
                <span lang="ja" className="font-jp text-[11px] text-[var(--color-fg-faint)]">{k.reading}</span>
              </Link>
            ))}
            <Link href="/kanji" className="surface flex min-w-[72px] flex-col items-center justify-center gap-0.5 border-dashed px-4 py-3 text-[var(--color-fg-faint)] transition-colors hover:text-[var(--color-fg)]">
              <span className="text-lg leading-none">+</span>
              <span className="text-[11px]">{Math.max(0, d.kanjiInVocab - d.recentKanji.length)}</span>
            </Link>
          </div>
        </Reveal>
      )}

      {/* Streak + stats */}
      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Reveal delay={0.08}>
          <div className="surface relative flex items-center gap-3 overflow-hidden p-4">
            <Lantern size={34} animated={d.streak > 0} intensity={Math.min(1, d.streak / 30)} />
            <div>
              <div className="text-2xl font-semibold leading-none">{d.streak}</div>
              <div className="mt-1 text-sm text-[var(--color-fg-muted)]">días de racha</div>
            </div>
            <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-[var(--color-ember)] opacity-70" />
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <StatCard label="vistas hoy" value={d.reviewsToday} glyph="今" accent="var(--color-indigo)" />
        </Reveal>
        <Reveal delay={0.16}>
          <StatCard label="vocabulario" value={NF.format(d.totals.words)} glyph="語" accent="var(--color-easy)" />
        </Reveal>
        <Reveal delay={0.2}>
          <StatCard label="kanji" value={NF.format(d.totals.kanji)} glyph="字" accent="var(--color-akari)" />
        </Reveal>
      </div>

      {/* Other study surfaces — kanji handwriting + kana, with live counts */}
      <Reveal delay={0.24}>
        <h2 className="mb-3 mt-7 text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">Practica también</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SurfaceTile
            href={d.kanji.due + d.kanji.newAvail > 0 ? "/kanji/write" : "/kanji"}
            title="Escribir kanji"
            sub={surfaceSub(d.kanji.due, d.kanji.newAvail, "trazo a trazo, a mano")}
            due={d.kanji.due}
            glyph="書"
            accent="var(--color-ember)"
          />
          <SurfaceTile
            href="/kana"
            title="Entrenador de kana"
            sub={surfaceSub(d.kana.due, d.kana.newAvail, `${d.totals.kana} hiragana + katakana`)}
            due={d.kana.due}
            glyph="あ"
            accent="var(--color-akari)"
          />
          <SurfaceTile
            href="/pitch/drill"
            title="Acento tonal"
            sub="elige el contorno correcto · práctica"
            due={0}
            glyph="音"
            accent="var(--color-indigo)"
          />
          <SurfaceTile
            href="/shadow"
            title="Escucha y repite"
            sub="shadowing · pronunciación"
            due={0}
            glyph="声"
            accent="var(--color-good)"
          />
        </div>
      </Reveal>
    </div>
  );
}
