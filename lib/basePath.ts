// GitHub Pages serves this repo at /akari/, not domain root — set at build time
// via NEXT_PUBLIC_BASE_PATH (see next.config.ts) so every hardcoded absolute
// asset/API path (manifest, service worker, seed DB fetch) still resolves.
// Empty locally/in dev, where the app is served from root.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a root-relative asset path (as stored in the DB, e.g. "audio/x.mp3")
 *  with BASE_PATH so it resolves under the GitHub Pages subpath too. */
export function assetUrl(path: string): string {
  return `${BASE_PATH}/${path}`;
}
