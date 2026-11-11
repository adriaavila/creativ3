import type { MetadataRoute } from "next";

// Para «Agregar a inicio» en Android y para quien guarde allok.fun como app: el
// ícono del sistema de diseño (src/app/icon.svg) en Ink, con el punto en Blue.
// La versión `maskable` va a sangre, con el símbolo dentro de la zona segura.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "allok",
    short_name: "allok",
    start_url: "/",
    display: "browser",
    background_color: "#0b0d0e",
    theme_color: "#0b0d0e",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
      { src: "/icons/maskable-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
  };
}
