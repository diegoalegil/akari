// Post-build: rewrite out/sw.js so the offline PWA actually works.
//   1. Precache every hashed _next/static chunk (JS/CSS/fonts) — without these,
//      the cached index.html shell can't boot offline (its <script> tags 404).
//   2. Stamp a per-build CACHE name (hash of the asset set) so a new deploy
//      changes sw.js byte-wise → the browser re-installs and the activate
//      handler evicts the previous cache (no users pinned to stale assets).
// Runs as the last step of `npm run build:static`.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { createHash } from "node:crypto";

const out = resolve(process.cwd(), "out");
const swPath = resolve(out, "sw.js");
const staticDir = resolve(out, "_next", "static");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    files.push(...(statSync(p).isDirectory() ? walk(p) : [p]));
  }
  return files;
}

let sw: string;
try {
  sw = readFileSync(swPath, "utf8");
} catch {
  console.error("postbuild-sw: out/sw.js not found — did `next build` run?");
  process.exit(1);
}

// Every build asset except sourcemaps, as absolute same-origin URLs.
let assets: string[] = [];
try {
  assets = walk(staticDir)
    .filter((p) => !p.endsWith(".map"))
    .map((p) => "/_next/static/" + relative(staticDir, p).split(/[\\/]/).join("/"))
    .sort();
} catch (e) {
  console.warn("postbuild-sw: no _next/static dir — precaching base assets only", e);
}

// Version = short content hash of the asset set: changes only when the build does.
const hash = createHash("sha256").update(assets.join("\n")).digest("hex").slice(0, 12);

const assetLines = assets.map((u) => `  ${JSON.stringify(u)},`).join("\n");
const placeholder = "  // __NEXT_ASSETS__ (replaced at build with the hashed _next/static chunks)";
if (!sw.includes(placeholder)) console.warn("postbuild-sw: asset placeholder not found in sw.js");
sw = sw.replace(placeholder, assetLines);
sw = sw.replace("akari-__BUILD_ID__", `akari-${hash}`);

writeFileSync(swPath, sw);
console.log(`postbuild-sw: cache "akari-${hash}", precaching ${assets.length} build assets`);
