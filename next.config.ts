import type { NextConfig } from "next";

// Set to "/akari" in the GitHub Pages build (this repo isn't <user>.github.io,
// so the site is served from a subpath, not domain root); empty everywhere else
// so local dev/build:static keep working at "/". See lib/basePath.ts for the
// runtime-code counterpart of this same value.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Static hosts (GitHub Pages included) serve a requested directory's
  // index.html only when the URL ends in "/" — without this, next export emits
  // `route.html` files that 404 on any link/refresh that doesn't hit them by
  // exact filename.
  trailingSlash: true,
  images: { unoptimized: true },
  // better-sqlite3 is a native addon used only by the seed scripts — keep it
  // external so Next doesn't try to bundle the .node binary.
  serverExternalPackages: ["better-sqlite3"],
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // sql.js (SQLite WASM, runs in the browser) has a Node code path that
      // references node:fs / node:path. Strip the node: scheme and stub the
      // modules out of the client bundle.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:(fs|path|crypto)$/, (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false };
    }
    return config;
  },
};

export default nextConfig;
