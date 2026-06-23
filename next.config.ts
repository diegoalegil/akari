import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
