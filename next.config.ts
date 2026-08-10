import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/privacidad", destination: "/es/privacidad", permanent: true },
      { source: "/terminos", destination: "/es/terminos", permanent: true },
      { source: "/pago/exito", destination: "/es/pago/exito", permanent: true },
      { source: "/pago/cancelado", destination: "/es/pago/cancelado", permanent: true },
    ];
  },
  outputFileTracingIncludes: {
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
