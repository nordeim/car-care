import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Type errors fail the build — keep this ON. Local `tsc --noEmit` must
    // be clean before every commit (see AGENTS.md gates).
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
};

export default nextConfig;
