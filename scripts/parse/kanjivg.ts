// Index KanjiVG stroke-order SVGs by codepoint. We keep the raw SVG (with its
// kvg:* stroke metadata) so Phase 5 can animate strokes in order.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { kanjivgName, openZip } from "../lib/util.ts";

export type KanjivgIndex = {
  getSvg(literal: string): string | null;
  count: number;
};

export async function parseKanjivg(zipPath: string, outDir: string): Promise<KanjivgIndex> {
  const dir = await openZip(zipPath);

  // Map 5-hex codepoint -> path inside the archive. Base glyphs only; skip
  // variant files like "05b66-Kaisho.svg".
  const index = new Map<string, string>();
  for (const f of dir.files) {
    const m = /(?:^|\/)([0-9a-f]{5})\.svg$/.exec(f.path);
    if (m) index.set(m[1], f.path);
  }

  // Extract once (cached). If the dir already has content, trust it.
  if (!existsSync(outDir) || readdirSync(outDir).length === 0) {
    await dir.extract({ path: outDir });
  }

  return {
    count: index.size,
    getSvg(literal: string) {
      const hex = kanjivgName(literal).replace(/\.svg$/, "");
      const rel = index.get(hex);
      if (!rel) return null;
      const p = path.join(outDir, rel);
      if (!existsSync(p)) return null;
      return readFileSync(p, "utf8")
        .replace(/<\?xml[^>]*\?>\s*/i, "")
        .replace(/<!DOCTYPE[^>]*>\s*/i, "")
        .trim();
    },
  };
}
