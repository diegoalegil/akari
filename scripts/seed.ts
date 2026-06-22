// Phase 1 entry point — `npm run seed`. Download (cached) -> build DB -> stats.
import { resolveAndDownload } from "./download.ts";
import { buildDb } from "./build-db.ts";
import { printStats } from "./stats.ts";
import { isMain } from "./lib/util.ts";

export async function seed(): Promise<void> {
  const t0 = Date.now();
  console.log("── Akari seed ──\n");
  const manifest = await resolveAndDownload();
  console.log("");
  await buildDb(manifest);
  printStats();
  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
}

if (isMain(import.meta.url)) {
  seed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
