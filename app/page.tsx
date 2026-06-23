"use client";
import Link from "next/link";
import { Lantern } from "@/components/Lantern";
import { Loading } from "@/components/Loading";
import { Reveal } from "@/components/Reveal";
import { StartSession } from "@/components/StartSession";
import { StatCard } from "@/components/StatCard";
import { getDashboard } from "@/lib/queries";
import { useDbReady } from "@/lib/useDb";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

const NF = new Intl.NumberFormat("es-ES");

export default function Home() {
  const dbReady = useDbReady();
  if (!dbReady) return <Loading />;
  const d = getDashboard();
  const today = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const ready = d.dueNow + d.newRemaining;

  if (!d.seeded) {
    return (
      <div className="mx-auto grid min-h-screen max-w-md place-items-center px-6 text-center">
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

      {/* Quick links */}
      <Reveal delay={0.24}>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/kana" className="surface group flex items-center justify-between p-5 transition-colors hover:border-[var(--color-line-strong)]">
            <div>
              <div className="font-medium text-[var(--color-fg)]">Entrenador de kana</div>
              <div className="text-sm text-[var(--color-fg-muted)]">{d.totals.kana} hiragana + katakana</div>
            </div>
            <span lang="ja" className="font-jp text-3xl text-[var(--color-fg-faint)] transition-colors group-hover:text-[var(--color-akari)]">
              あ
            </span>
          </Link>
          <Link href="/kanji" className="surface group flex items-center justify-between p-5 transition-colors hover:border-[var(--color-line-strong)]">
            <div>
              <div className="font-medium text-[var(--color-fg)]">Explorar kanji</div>
              <div className="text-sm text-[var(--color-fg-muted)]">trazos, lecturas y JLPT</div>
            </div>
            <span lang="ja" className="font-jp text-3xl text-[var(--color-fg-faint)] transition-colors group-hover:text-[var(--color-ember)]">
              字
            </span>
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
