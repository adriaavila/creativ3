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
      // The agency site became the portfolio; these had live inbound links.
      { source: "/projects", destination: "/work", permanent: true },
      { source: "/whatsapp", destination: "/agente-whatsapp", permanent: true },
      // `/crm` y la página del producto vendían lo mismo con dos rejillas de
      // precio. Desde 2026-10 el producto vive en /agente-whatsapp y la
      // portada vende proyectos; esto se queda por los enlaces vivos.
      { source: "/crm", destination: "/agente-whatsapp", permanent: true },
      { source: "/cotizar", destination: "/#diagnostico", permanent: false },
      // allok Desk fue el producto anterior; /desk daba 404 y /es/desk seguía vivo.
      { source: "/desk", destination: "/agente-whatsapp", permanent: true },
      { source: "/:locale(es|en)/desk", destination: "/agente-whatsapp", permanent: true },
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
