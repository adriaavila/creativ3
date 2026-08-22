import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empaqueta el servidor y sólo las dependencias que realmente usa, para
  // correr con `node server.js` sin node_modules. Es lo que hace viable una
  // imagen chica en el VPS; `next start` exigiría instalar todo el árbol.
  output: "standalone",
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
