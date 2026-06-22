import type { CSSProperties } from "react";
import type { KanaCell } from "@/lib/kana";

const MASTERY: Record<KanaCell["mastery"], string> = {
  new: "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-fg-faint)]",
  learning: "border-[color-mix(in_oklab,var(--color-ember)_45%,transparent)] bg-[var(--color-surface-2)] text-[var(--color-fg)]",
  known: "border-[color-mix(in_oklab,var(--color-good)_50%,transparent)] bg-[color-mix(in_oklab,var(--color-good)_10%,var(--color-surface-2))] text-[var(--color-fg)]",
  due: "border-[var(--color-indigo)] bg-[var(--color-surface-2)] text-[var(--color-fg)]",
};

function Cell({ c, style }: { c: KanaCell; style: CSSProperties }) {
  return (
    <div style={style} className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border ${MASTERY[c.mastery]}`}>
      <span className="font-jp text-lg leading-none sm:text-xl">{c.char}</span>
      <span className="text-[9px] leading-none opacity-70 sm:text-[10px]">{c.romaji}</span>
    </div>
  );
}

function GroupGrid({ cells, cols, label }: { cells: KanaCell[]; cols: number; label?: string }) {
  if (cells.length === 0) return null;
  const rowBase = Math.min(...cells.map((c) => c.row));
  return (
    <section className="flex flex-col gap-2">
      {label && <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-fg-faint)]">{label}</h3>}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {cells.map((c) => (
          <Cell key={c.id} c={c} style={{ gridColumnStart: c.col + 1, gridRowStart: c.row - rowBase + 1 }} />
        ))}
      </div>
    </section>
  );
}

export function KanaGrid({ cells }: { cells: KanaCell[] }) {
  const by = (g: string) => cells.filter((c) => c.group === g);
  return (
    <div className="flex flex-col gap-6">
      <GroupGrid cells={by("gojuon")} cols={5} />
      <GroupGrid cells={by("dakuten")} cols={5} label="Dakuten ゛" />
      <GroupGrid cells={by("handakuten")} cols={5} label="Handakuten ゜" />
      <GroupGrid cells={by("combo")} cols={3} label="Combinaciones (yōon)" />
    </div>
  );
}
