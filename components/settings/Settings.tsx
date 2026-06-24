"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { AppSettings } from "@/lib/queries";
import { resetProgress, setApiKey, updateSetting } from "@/app/settings/actions";
import { Lantern } from "@/components/Lantern";
import { Furigana } from "@/components/Furigana";
import { PitchAccent } from "@/components/PitchAccent";
import { playSound, setSoundEnabled } from "@/lib/sound";
import { flushClientDb, getClientDb } from "@/lib/clientDb";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
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
  const [saveError, setSaveError] = useState(false);
  const [hasKey, setHasKey] = useState(initial.hasApiKey);
  const [keyInput, setKeyInput] = useState("");
  const [keyMsg, setKeyMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const saveKey = () => {
    startTransition(async () => {
      const r = await setApiKey(keyInput);
      if (!r.ok) { setKeyMsg("La clave debe empezar por «sk-ant-»."); return; }
      setHasKey(r.set); setKeyInput(""); setKeyMsg(r.set ? "Clave guardada ✓ — Explícame activo" : "Clave eliminada");
    });
  };
  const clearKey = () => {
    startTransition(async () => { await setApiKey(""); setHasKey(false); setKeyInput(""); setKeyMsg("Clave eliminada"); });
  };
  const exportProgress = async () => {
    await flushClientDb();
    const blob = new Blob([getClientDb().export() as unknown as BlobPart], { type: "application/x-sqlite3" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "akari-progreso.sqlite";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = s.theme;
    document.documentElement.classList.toggle("reduce-motion", s.reducedMotion);
    document.documentElement.classList.toggle("no-furigana", !s.furigana);
    document.documentElement.classList.toggle("no-pitch", !s.pitch);
  }, [s.theme, s.reducedMotion, s.furigana, s.pitch]);

  const save = (key: string, value: string) => { updateSetting(key, value).catch(() => setSaveError(true)); };
  const setNum = (v: number) => { const n = Math.max(0, Math.min(100, v)); setS((p) => ({ ...p, newPerDay: n })); save("new_per_day", String(n)); };
  const setStr = <K extends keyof AppSettings>(k: K, key: string, v: string) => { setS((p) => ({ ...p, [k]: v })); save(key, v); };
  const setBool = <K extends keyof AppSettings>(k: K, key: string, v: boolean) => { setS((p) => ({ ...p, [k]: v })); save(key, v ? "1" : "0"); };

  const themes: [string, string][] = [["dark", "Oscuro"], ["indigo", "Noche-índigo"]];

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-7">
        {saveError && (
          <div role="alert" className="rounded-lg border border-[color-mix(in_oklab,var(--color-again)_45%,transparent)] px-4 py-3 text-sm text-[var(--color-again)]">
            No se pudo guardar el ajuste
          </div>
        )}
        <Section title="Estudio">
          <Row title="Tarjetas nuevas por día" desc="Ritmo de palabras nuevas">
            <div className="flex items-center gap-3">
              <button aria-label="Menos tarjetas nuevas" onClick={() => setNum(s.newPerDay - 5)} className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-line-strong)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] sm:h-9 sm:w-9">−</button>
              <span className="w-8 text-center text-lg font-semibold tabular-nums">{s.newPerDay}</span>
              <button aria-label="Más tarjetas nuevas" onClick={() => setNum(s.newPerDay + 5)} className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-line-strong)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] sm:h-9 sm:w-9">+</button>
            </div>
          </Row>
          <Row title="Animación de la tarjeta" desc="Cómo se revela el reverso">
            <div className="flex rounded-lg border border-[var(--color-line-strong)] p-0.5 text-sm">
              {([["turn", "Giro suave"], ["flip", "Volteo 3D"]] as [string, string][]).map(([v, l]) => (
                <button key={v} aria-pressed={s.cardAnim === v} onClick={() => setStr("cardAnim", "card_anim", v)} className={`min-h-[44px] rounded-md px-3 py-1.5 transition-colors sm:min-h-0 ${s.cardAnim === v ? "bg-[color-mix(in_oklab,var(--color-indigo)_18%,transparent)] text-[var(--color-fg)]" : "text-[var(--color-fg-muted)]"}`}>{l}</button>
              ))}
            </div>
          </Row>
          <Row title="Furigana" desc="Lecturas sobre los kanji (reverso y frases)">
            <Toggle label="Furigana" on={s.furigana} onChange={(v) => setBool("furigana", "furigana", v)} />
          </Row>
          <Row title="Acento tonal" desc="Contorno tonal sobre la lectura">
            <Toggle label="Acento tonal" on={s.pitch} onChange={(v) => setBool("pitch", "pitch", v)} />
          </Row>
          <Row title="Modo de repaso" desc="Ver la palabra · oírla · decirla desde el significado">
            <div className="flex rounded-lg border border-[var(--color-line-strong)] p-0.5 text-sm">
              {([["normal", "Ver"], ["listen", "Oír"], ["produce", "Decir"]] as [string, string][]).map(([v, l]) => (
                <button key={v} aria-pressed={s.reviewMode === v} onClick={() => setStr("reviewMode", "review_mode", v)} className={`min-h-[44px] rounded-md px-3 py-1.5 transition-colors sm:min-h-0 ${s.reviewMode === v ? "bg-[color-mix(in_oklab,var(--color-indigo)_18%,transparent)] text-[var(--color-fg)]" : "text-[var(--color-fg-muted)]"}`}>{l}</button>
              ))}
            </div>
          </Row>
        </Section>

        <section>
          <h2 className="mb-2 text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">Apariencia</h2>
          <div className="surface p-5">
            <div className="mb-3 text-[var(--color-fg)]">Tema</div>
            <div className="grid grid-cols-2 gap-2">
              {themes.map(([v, l]) => (
                <button key={v} aria-pressed={s.theme === v} onClick={() => setStr("theme", "theme", v)} className={`rounded-xl border p-3 text-center transition-colors ${s.theme === v ? "border-[var(--color-indigo)] ring-1 ring-[color-mix(in_oklab,var(--color-indigo)_30%,transparent)]" : "border-[var(--color-line)]"}`}>
                  <div className="mb-2 h-9 w-full rounded-md" style={{ background: v === "indigo" ? "linear-gradient(180deg,#1a1d2e,#0e0f13)" : "linear-gradient(180deg,var(--color-surface),var(--color-ink))" }}>
                    <span className="block h-2 w-2 translate-x-2 translate-y-2 rounded-full" style={{ background: v === "indigo" ? "var(--color-indigo)" : "var(--color-ember)" }} />
                  </div>
                  <span className="text-xs text-[var(--color-fg-muted)]">{l}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <Section title="Audio y movimiento">
          <Row title="Sonidos" desc="Efectos de sonido (koto, campana, trazo)">
            <Toggle label="Sonidos" on={s.sound} onChange={(v) => { setBool("sound", "sound", v); setSoundEnabled(v); if (v) playSound("good"); }} />
          </Row>
          <Row title="Reproducir al revelar" desc="Audio nativo tras el giro"><Toggle label="Reproducir al revelar" on={s.autoplay} onChange={(v) => setBool("autoplay", "autoplay", v)} /></Row>
          <Row title="Movimiento reducido" desc="Conserva el brillo, calma el resto"><Toggle label="Movimiento reducido" on={s.reducedMotion} onChange={(v) => setBool("reducedMotion", "reduced_motion", v)} /></Row>
        </Section>

        <Section title="Explícame · IA">
          <div className="space-y-3 px-5 py-4">
            <p className="text-sm text-[var(--color-fg-muted)]">
              El panel «Explícame» usa <span className="text-[var(--color-fg)]">tu propia clave</span> de Anthropic (modelo Sonnet 4.6). Se guarda solo en tu equipo y nunca sale de aquí. {hasKey ? "Está activo." : "Pégala para activarlo."}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); setKeyMsg(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" && keyInput.trim()) saveKey(); }}
                placeholder={hasKey ? "•••• configurada — pega otra para cambiarla" : "sk-ant-…"}
                aria-label="Clave de API de Anthropic"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] px-3 py-2 text-base text-[var(--color-fg)] outline-none transition-colors placeholder:text-[var(--color-fg-faint)] focus:border-[var(--color-indigo)] sm:text-sm"
              />
              <button onClick={saveKey} disabled={pending || !keyInput.trim()} className="shrink-0 rounded-lg bg-gradient-to-r from-[var(--color-akari)] to-[var(--color-ember)] px-3.5 py-2 text-sm font-semibold text-[var(--color-ink-deep)] transition-[filter] hover:brightness-105 disabled:opacity-40">
                Guardar
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs ${keyMsg ? "text-[var(--color-good)]" : hasKey ? "text-[var(--color-good)]" : "text-[var(--color-fg-faint)]"}`}>
                {keyMsg ?? (hasKey ? "Clave configurada ✓" : "Sin configurar — el panel mostrará un aviso")}
              </span>
              {hasKey && <button onClick={clearKey} disabled={pending} className="shrink-0 text-xs text-[var(--color-again)] hover:underline disabled:opacity-40">Quitar</button>}
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--color-fg-faint)]">Consíguela en console.anthropic.com. Se cobra a tu cuenta, solo cuando pulsas «Explícame».</p>
          </div>
        </Section>

        <Section title="Datos y créditos">
          <button onClick={exportProgress} className="block w-full px-5 py-4 text-left text-[var(--color-fg)] transition-colors hover:bg-[var(--color-surface-2)]">Exportar progreso</button>
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
          <span lang="ja" className="font-jp text-6xl leading-relaxed text-[var(--color-fg)]"><Furigana text="灯[あかり]" fallback="灯" /></span>
          <span lang="ja" className="font-jp text-[var(--color-ember)]"><PitchAccent reading="あかり" accent={0} /></span>
          <div className="mt-1 flex gap-2">
            <span className="rounded-lg border px-3 py-1 text-sm" style={{ borderColor: "color-mix(in oklab, var(--color-good) 45%, transparent)", color: "var(--color-good)" }}>Bien</span>
            <span className="rounded-lg border px-3 py-1 text-sm" style={{ borderColor: "color-mix(in oklab, var(--color-easy) 45%, transparent)", color: "var(--color-easy)" }}>Fácil</span>
          </div>
        </div>
      </div>
    </div>
  );
}
