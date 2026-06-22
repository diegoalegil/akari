import { Lantern } from "@/components/Lantern";
import { getIngestMeta } from "@/lib/queries";

export const metadata = { title: "Créditos" };
export const dynamic = "force-dynamic";

type Source = { name: string; use: string; license: string; href: string; versionKey?: string };

const SOURCES: Source[] = [
  { name: "JMdict", use: "Lecturas y glosas en inglés del vocabulario", license: "EDRDG · CC BY-SA", href: "https://github.com/scriptin/jmdict-simplified", versionKey: "jmdict_version" },
  { name: "KANJIDIC2", use: "Datos de kanji: lecturas on/kun, JLPT, trazos", license: "EDRDG · CC BY-SA", href: "https://github.com/scriptin/jmdict-simplified", versionKey: "kanjidic_version" },
  { name: "KanjiVG", use: "SVGs con el orden de trazos de cada kanji", license: "Ulrich Apel · CC BY-SA 3.0", href: "https://github.com/KanjiVG/kanjivg", versionKey: "kanjivg_version" },
  { name: "Tatoeba", use: "Frases de ejemplo y audio nativo", license: "CC BY 2.0 FR (audio: licencia por grabación)", href: "https://tatoeba.org", },
  { name: "Kaishi 1.5k", use: "Lista curada y orden de estudio + audio incluido", license: "donkuri", href: "https://github.com/donkuri/kaishi", versionKey: "kaishi_version" },
];

export default function AttributionsPage() {
  const meta = getIngestMeta();
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <div className="flex items-center gap-3">
        <Lantern size={30} />
        <h1 className="text-2xl font-semibold tracking-tight">Créditos y datos</h1>
      </div>
      <p className="mt-3 max-w-prose text-[var(--color-fg-muted)]">
        Todo el contenido de aprendizaje de Akari proviene de estos datasets abiertos —{" "}
        <span className="text-[var(--color-fg)]">nunca</span> generado por un LLM. Gracias a quienes
        los mantienen.
      </p>

      <ul className="mt-8 space-y-3">
        {SOURCES.map((s) => (
          <li key={s.name} className="surface flex flex-col gap-1 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <a href={s.href} target="_blank" rel="noreferrer" className="font-medium text-[var(--color-fg)] underline decoration-[var(--color-line-strong)] underline-offset-4 transition-colors hover:decoration-[var(--color-akari)]">
                {s.name}
              </a>
              {s.versionKey && meta[s.versionKey] && (
                <span className="font-mono text-xs text-[var(--color-fg-faint)]">{meta[s.versionKey]}</span>
              )}
            </div>
            <p className="text-sm text-[var(--color-fg-muted)]">{s.use}</p>
            <p className="text-xs text-[var(--color-fg-faint)]">{s.license}</p>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-[var(--color-fg-faint)]">
        El código de Akari es MIT. Cada dataset conserva su propia licencia.
        {meta.seeded_at && <> · Sembrado: {new Date(meta.seeded_at).toLocaleDateString("es-ES")}</>}
      </p>
    </div>
  );
}
