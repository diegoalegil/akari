// Rasterize the lantern SVG into the PNG icons iOS and Android need for
// "Add to Home Screen" (iOS Safari does not accept SVG apple-touch-icons).
// Run once with `npm run gen:icons`; the PNGs are committed to public/.
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pub = resolve(process.cwd(), "public");

async function png(srcSvg: string, out: string, size: number) {
  const svg = readFileSync(resolve(pub, srcSvg));
  // High density → render the vector large, then downscale for crisp edges.
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(resolve(pub, out));
  console.log(`✓ ${out} (${size}×${size})`);
}

await png("icon.svg", "icon-192.png", 192);
await png("icon.svg", "icon-512.png", 512);
await png("icon.svg", "apple-touch-icon.png", 180);
await png("icon-maskable.svg", "icon-512-maskable.png", 512);
console.log("Icons generated.");
