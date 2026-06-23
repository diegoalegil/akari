// Shared helpers for the ingestion pipeline: cached downloads + decompression.
import { createReadStream, createWriteStream, existsSync, realpathSync, statSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { list as tarList, x as untar } from "tar";
import bz2 from "unbzip2-stream";
import unzipper from "unzipper";

/** True when a module is the process entry point. Robust to spaces in the path
 *  (import.meta.url URL-encodes them, argv[1] does not). */
export function isMain(importMetaUrl: string): boolean {
  if (!process.argv[1]) return false;
  const self = fileURLToPath(importMetaUrl);
  try {
    return realpathSync(self) === realpathSync(process.argv[1]);
  } catch {
    return self === path.resolve(process.argv[1]);
  }
}

export const ROOT = process.cwd();
export const RAW_DIR = path.join(ROOT, "data", "raw");
export const DB_PATH = path.join(ROOT, "data", "app.db");
export const PUBLIC_AUDIO = path.join(ROOT, "public", "audio");

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export function fileExistsNonEmpty(p: string): boolean {
  return existsSync(p) && statSync(p).size > 0;
}

const UA = { "User-Agent": "akari-seed/0.1 (+https://github.com/akari)" };

// Authenticated GitHub API requests get 5000 req/hr vs 60/hr unauthenticated.
// The seed resolves 4 `releases/latest` endpoints per run; on a *shared* CI
// build IP the unauthenticated pool is easily exhausted (HTTP 403), which would
// red the whole deploy. Use a token when the CI env provides one — harmless when
// absent (only attached to api.github.com).
const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const ghAuth = (url: string): Record<string, string> =>
  GH_TOKEN && url.startsWith("https://api.github.com/") ? { Authorization: `Bearer ${GH_TOKEN}` } : {};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Honor a server's Retry-After / X-RateLimit-Reset hint, but the caller caps it:
// a hard hour-long rate-limit should fail the build fast, not hang on it.
function retryHintMs(res: Response): number | undefined {
  const ra = res.headers.get("retry-after");
  if (ra && /^\d+$/.test(ra)) return Number(ra) * 1000;
  const reset = res.headers.get("x-ratelimit-reset");
  if (reset && /^\d+$/.test(reset)) {
    const ms = Number(reset) * 1000 - Date.now();
    if (ms > 0) return ms;
  }
  return undefined;
}

/** fetch with bounded retry on *transient* failures (rate-limit 403/429, 5xx,
 *  network resets) so a flaky upstream doesn't red the deploy. Non-transient
 *  statuses (404, etc.) throw immediately; the per-attempt wait is capped so a
 *  hard rate-limit fails fast instead of hanging the build. */
async function fetchRetry(url: string, headers: Record<string, string>, attempts = 4): Promise<Response> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    let res: Response;
    try {
      res = await fetch(url, { headers });
    } catch (err) {
      lastErr = err;
      if (i >= attempts) throw err;
      await sleep(Math.min(2000 * 2 ** (i - 1), 20_000));
      continue;
    }
    if (res.ok) return res;
    const retryable = res.status === 403 || res.status === 429 || res.status >= 500;
    if (!retryable || i >= attempts) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
    const wait = Math.min(retryHintMs(res) ?? 2000 * 2 ** (i - 1), 20_000);
    console.warn(`  retry ${i}/${attempts - 1} (${res.status}) ${url.replace(/\?.*/, "")} — waiting ${Math.round(wait / 1000)}s`);
    await sleep(wait);
  }
  throw lastErr ?? new Error(`GET ${url} failed after ${attempts} attempts`);
}

/** Download `url` to `dest`, skipping if a non-empty file already exists. */
export async function download(url: string, dest: string): Promise<string> {
  if (fileExistsNonEmpty(dest)) {
    console.log(`  cache hit  ${path.basename(dest)}`);
    return dest;
  }
  await ensureDir(path.dirname(dest));
  console.log(`  download   ${url}`);
  const res = await fetchRetry(url, { ...UA, ...ghAuth(url) });
  const buf = Buffer.from(await res.arrayBuffer());
  await import("node:fs/promises").then((fs) => fs.writeFile(dest, buf));
  console.log(`  saved      ${path.basename(dest)} (${(buf.length / 1e6).toFixed(1)} MB)`);
  return dest;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchRetry(url, { ...UA, Accept: "application/vnd.github+json", ...ghAuth(url) });
  return (await res.json()) as T;
}

export type ReleaseAsset = { name: string; url: string; tag: string };

/** Resolve a release asset download URL by regex from a GitHub repo's latest
 *  release. `fallback` is a pinned known-good asset (a stable
 *  `releases/download/<tag>/…` URL never expires) used when the API is
 *  unreachable — e.g. the unauthenticated 60/hr limit on a shared CI build IP —
 *  so a rate-limited resolve can't red the deploy. The happy path is unchanged:
 *  whenever the API answers we still take the genuine latest. */
export async function githubLatestAsset(
  repo: string,
  match: RegExp,
  exclude?: RegExp,
  fallback?: ReleaseAsset,
): Promise<ReleaseAsset> {
  type Asset = { name: string; browser_download_url: string };
  type Release = { tag_name: string; assets: Asset[] };
  let rel: Release;
  try {
    rel = await fetchJson<Release>(`https://api.github.com/repos/${repo}/releases/latest`);
  } catch (err) {
    if (fallback) {
      console.warn(`  ⚠ ${repo} releases/latest unreachable (${(err as Error).message}) — using pinned ${fallback.tag}`);
      return fallback;
    }
    throw err;
  }
  const asset = rel.assets.find((a) => match.test(a.name) && (!exclude || !exclude.test(a.name)));
  if (!asset) {
    if (fallback) {
      console.warn(`  ⚠ no asset matching ${match} in ${repo}@${rel.tag_name} — using pinned ${fallback.tag}`);
      return fallback;
    }
    throw new Error(
      `No asset matching ${match} in ${repo}@${rel.tag_name}. Have: ${rel.assets
        .map((a) => a.name)
        .join(", ")}`,
    );
  }
  return { name: asset.name, url: asset.browser_download_url, tag: rel.tag_name };
}

/** Extract a .tgz into `outDir`; returns the path of the extracted JSON file.
 *  The internal name (e.g. jmdict-eng-3.6.2.json) differs from the asset name,
 *  so discover it from the archive rather than guessing. */
export async function extractTgz(tgzPath: string, outDir: string): Promise<string> {
  await ensureDir(outDir);
  const entries: string[] = [];
  await tarList({ file: tgzPath, onentry: (e) => entries.push(e.path) });
  const entry = entries.find((p) => p.endsWith(".json")) ?? entries[0];
  if (!entry) throw new Error(`Empty archive: ${tgzPath}`);
  const expected = path.join(outDir, entry);
  if (fileExistsNonEmpty(expected)) {
    console.log(`  cache hit  ${entry}`);
    return expected;
  }
  await untar({ file: tgzPath, cwd: outDir });
  if (!fileExistsNonEmpty(expected)) {
    throw new Error(`Expected ${expected} after extracting ${tgzPath}`);
  }
  return expected;
}

/** Decompress a .bz2 file to `dest` (skips if present). */
export async function extractBz2(bz2Path: string, dest: string): Promise<string> {
  if (fileExistsNonEmpty(dest)) {
    console.log(`  cache hit  ${path.basename(dest)}`);
    return dest;
  }
  await ensureDir(path.dirname(dest));
  await pipeline(createReadStream(bz2Path), bz2(), createWriteStream(dest));
  return dest;
}

export type ZipDir = Awaited<ReturnType<typeof unzipper.Open.file>>;

export async function openZip(zipPath: string): Promise<ZipDir> {
  return unzipper.Open.file(zipPath);
}

export async function readJsonFile<T>(p: string): Promise<T> {
  return JSON.parse(await readFile(p, "utf8")) as T;
}

/** Strip Anki/HTML noise and furigana brackets to recover clean Japanese text. */
export function cleanJp(s: string): string {
  return s
    .replace(/<[^>]+>/g, "") // HTML tags
    .replace(/\[sound:[^\]]+\]/g, "") // [sound:...]
    .replace(/([一-龯぀-ヿ]+)\[[^\]]+\]/g, "$1") // furigana: 漢字[かんじ] -> 漢字
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain-text English: strip tags/entities but keep punctuation/spacing. */
export function cleanEn(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** kanji literal -> KanjiVG filename (5-char zero-padded lowercase hex codepoint). */
export function kanjivgName(literal: string): string {
  return literal.codePointAt(0)!.toString(16).padStart(5, "0") + ".svg";
}

/** Iterate the unique CJK kanji characters in a string. */
export function kanjiChars(s: string): string[] {
  const out = new Set<string>();
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0x4e00 && cp <= 0x9fff) out.add(ch); // CJK Unified Ideographs
  }
  return [...out];
}
