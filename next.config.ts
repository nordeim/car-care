import type { NextConfig } from "next";

/**
 * Security headers (audit cycle 3, finding C1/C2 — live responses previously
 * carried none). Set at the app level so they survive any proxy (Cloudflare →
 * Caddy → Next in production).
 *
 * CSP notes:
 *  - `script-src 'unsafe-inline'` is required by Next's inline hydration
 *    flight script; `application/ld+json` blocks are non-executing data and
 *    unaffected. No third-party scripts exist (PRD non-goal), so the policy
 *    is otherwise locked to 'self'.
 *  - `img-src 'self' data:` — all six photos are local WebP assets.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Type errors fail the build — keep this ON. Local `tsc --noEmit` must
    // be clean before every commit (see AGENTS.md gates).
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Audit cycle 3 (C2): stop advertising the framework version.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
