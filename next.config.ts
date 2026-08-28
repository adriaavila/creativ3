import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted Docker image; Vercel did this packaging itself.
  output: "standalone",
  // `postgres` uses Node APIs that must not be bundled.
  serverExternalPackages: ["postgres"],
  async redirects() {
    return [
      { source: "/privacidad", destination: "/es/privacidad", permanent: true },
      { source: "/terminos", destination: "/es/terminos", permanent: true },
      { source: "/pago/exito", destination: "/es/pago/exito", permanent: true },
      { source: "/pago/cancelado", destination: "/es/pago/cancelado", permanent: true },
    ];
  },
  outputFileTracingIncludes: {
    // Only the prose: tracing a .ts here makes Next parse it and resolve `eve`,
    // which this image deliberately does not install. The Dockerfile copies the
    // whole agent directory into the runner instead, for eve-agent-catalog.ts.
    "/ops": ["./apps/growth-agent/agent/**/*.md"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.convex.cloud",
        pathname: "/api/storage/**",
      },
    ],
  },
};

export default nextConfig;
