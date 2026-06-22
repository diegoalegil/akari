"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { AppSettings } from "@/lib/queries";
import { resetProgress, updateSetting } from "@/app/settings/actions";
import { Lantern } from "@/components/Lantern";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-gradient-to-r from-[var(--color-akari)] to-[var(--color-ember)]" : "bg-[var(--color-surface-3)]"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left] ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">{title}</h2>
      <div className="surface divide-y divide-[var(--color-line)]">{children}</div>
    </section>
  );
}

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <div className="text-[var(--color-fg)]">{title}</div>
        {desc && <div className="text-sm text-[var(--color-fg-muted)]">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

export function Settings({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    document.documentElement.dataset.theme = s.theme;
    document.documentElement.classList.toggle("reduce-motion", s.reducedMotion);
  }, [s.theme, s.reducedMotion]);

  const save = (key: string, value: string) => void updateSetting(key, value);
  const setNum = (v: number) => { const n = Math.max(0, Math.min(100, v)); setS((p) => ({ ...p, newPerDay: n })); save("new_per_day", String(n)); };
  const setStr = <K extends keyof AppSettings>(k: K, key: string, v: string) => { setS((p) => ({ ...p, [k]: v })); save(key, v); };
  const setBool = <K extends keyof AppSettings>(k: K, key: string, v: boolean) => { setS((p) => ({ ...p, [k]: v })); save(key, v ? "1" : "0"); };

  const themes: [string, string][] = [["dark", "Oscuro"], ["indigo", "Noche-índigo"], ["system", "Sistema"]];

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-7">
        <Section title="Estudio">
          <Row title="Tarjetas nuevas por día" desc="Ritmo de palabras nuevas">
            <div className="flex items-center gap-3">
              <button onClick={() => setNum(s.newPerDay - 5)} className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-line-strong)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">−</button>
              <span className="w-8 text-center text-lg font-semibold tabular-nums">{s.newPerDay}</span>
              <button onClick={() => setNum(s.newPerDay + 5)} className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-line-strong)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">+</button>
            </div>
          </Row>
          <Row title="Animación de la tarjeta" desc="Cómo se revela el reverso">
            <div className="flex rounded-lg border border-[var(--color-line-strong)] p-0.5 text-sm">
              {([["turn", "Giro suave"], ["flip", "Volteo 3D"]] as [string, string][]).map(([v, l]) => (
                <button key={v} onClick={() => setStr("cardAnim", "card_anim", v)} className={`rounded-md px-3 py-1.5 transition-colors ${s.cardAnim === v ? "bg-[color-mix(in_oklab,var(--color-indigo)_18%,transparent)] text-[var(--color-fg)]" : "text-[var(--color-fg-muted)]"}`}>{l}</button>
              ))}
            </div>
          </Row>
        </Section>

        <section>
          <h2 className="mb-2 text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">Apariencia</h2>
          <div className="surface p-5">
            <div className="mb-3 text-[var(--color-fg)]">Tema</div>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(([v, l]) => (
                <button key={v} onClick={() => setStr("theme", "theme", v)} className={`rounded-xl border p-3 text-center transition-colors ${s.theme === v ? "border-[var(--color-indigo)] ring-1 ring-[color-mix(in_oklab,var(--color-indigo)_30%,transparent)]" : "border-[var(--color-line)]"}`}>
                  <div className="mb-2 h-9 w-full rounded-md" style={{ background: v === "system" ? "linear-gradient(120deg,var(--color-surface) 50%,#e8e6e0 50%)" : v === "indigo" ? "linear-gradient(180deg,#1a1d2e,#0e0f13)" : "linear-gradient(180deg,var(--color-surface),var(--color-ink))" }}>
                    <span className="block h-2 w-2 translate-x-2 translate-y-2 rounded-full" style={{ background: v === "indigo" ? "var(--color-indigo)" : "var(--color-ember)" }} />
                  </div>
                  <span className="text-xs text-[var(--color-fg-muted)]">{l}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <Section title="Audio y movimiento">
          <Row title="Sonido" desc="Un mazo suave sobre madera cálida"><Toggle on={s.sound} onChange={(v) => setBool("sound", "sound", v)} /></Row>
          <Row title="Reproducir al revelar" desc="Audio nativo tras el giro"><Toggle on={s.autoplay} onChange={(v) => setBool("autoplay", "autoplay", v)} /></Row>
          <Row title="Movimiento reducido" desc="Conserva el brillo, calma el resto"><Toggle on={s.reducedMotion} onChange={(v) => setBool("reducedMotion", "reduced_motion", v)} /></Row>
        </Section>

        <Section title="Datos y créditos">
          <a href="/api/export" className="block px-5 py-4 text-[var(--color-fg)] transition-colors hover:bg-[var(--color-surface-2)]">Exportar progreso</a>
          <Link href="/attributions" className="block px-5 py-4 text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-surface-2)]">JMdict · KANJIDIC2 · KanjiVG · Tatoeba</Link>
          <button
            onClick={() => {
              if (!confirmReset) { setConfirmReset(true); return; }
              startTransition(async () => { await resetProgress(); setConfirmReset(false); router.refresh(); });
            }}
            disabled={pending}
            className="block w-full px-5 py-4 text-left text-[var(--color-again)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-again)_10%,transparent)] disabled:opacity-50"
          >
            {pending ? "Restableciendo…" : confirmReset ? "¿Seguro? Toca de nuevo para borrar todo" : "Restablecer progreso"}
          </button>
        </Section>
      </div>

      {/* live preview */}
      <div className="md:sticky md:top-8 md:self-start">
        <h2 className="mb-2 text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">Vista previa</h2>
        <div className="surface ambient-lantern flex flex-col items-center gap-3 px-6 py-9" style={{ boxShadow: "var(--akari-glow)" }}>
          <span className="font-jp text-6xl text-[var(--color-fg)]">灯</span>
          <span className="font-jp text-[var(--color-ember)]">あかり</span>
          <div className="mt-1 flex gap-2">
            <span className="rounded-lg border px-3 py-1 text-sm" style={{ borderColor: "color-mix(in oklab, var(--color-good) 45%, transparent)", color: "var(--color-good)" }}>Bien</span>
            <span className="rounded-lg border px-3 py-1 text-sm" style={{ borderColor: "color-mix(in oklab, var(--color-easy) 45%, transparent)", color: "var(--color-easy)" }}>Fácil</span>
          </div>
        </div>
      </div>
    </div>
  );
}
