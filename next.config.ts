import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native addon — keep it external so Next/Turbopack
  // doesn't try to bundle the .node binary into server chunks.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
