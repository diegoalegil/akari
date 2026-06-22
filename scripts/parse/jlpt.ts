// Parse the open-anki-jlpt-decks CSVs into an (expression[+reading]) → JLPT
// level lookup. Only the first two columns (expression, reading) are needed and
// they never contain commas/quotes, so a plain split is safe. Easiest level
// (highest N) wins when a word appears in several decks.
import { readFileSync } from "node:fs";

const SEP = "\t";

export type JlptIndex = { lookup(expression: string, reading: string): number | null; size: number };

export function parseJlpt(files: { level: number; path: string }[]): JlptIndex {
  const byPair = new Map<string, number>();
  const byExpr = new Map<string, number>();
  const ambiguous = new Set<string>(); // same surface form at >1 JLPT level
  const readingsBySurface = new Map<string, Set<string>>(); // surface → readings seen in CSV
  // Process easiest first (n5=5 … n1=1); "set if absent" keeps the easiest.
  for (const { level, path } of [...files].sort((a, b) => b.level - a.level)) {
    const lines = readFileSync(path, "utf8").split("\n");
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const c = line.split(",");
      const expr = (c[0] ?? "").trim();
      const reading = (c[1] ?? "").trim();
      if (!expr) continue;
      const pk = expr + SEP + reading;
      if (!byPair.has(pk)) byPair.set(pk, level);
      let readings = readingsBySurface.get(expr);
      if (!readings) {
        readings = new Set<string>();
        readingsBySurface.set(expr, readings);
      }
      readings.add(reading);
      if (byExpr.has(expr)) {
        if (byExpr.get(expr) !== level) ambiguous.add(expr);
      } else {
        byExpr.set(expr, level);
      }
    }
  }
  return {
    size: byExpr.size,
    lookup(expression, reading) {
      // Exact (expression+reading) pair is always safe. The surface-only
      // fallback is used only when that surface maps to a single JLPT level
      // and the studied reading was actually seen for that surface (so a
      // homograph studied with a different reading isn't mislabeled).
      const pair = byPair.get(expression + SEP + reading);
      if (pair != null) return pair;
      if (ambiguous.has(expression)) return null;
      if (!readingsBySurface.get(expression)?.has(reading)) return null;
      return byExpr.get(expression) ?? null;
    },
  };
}
