import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";

// La imagen al compartir /agencia (src/lib/og/card.tsx). El texto es el de la página.
export const alt = "allok agencia: más clientes, menos trabajo manual.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ label: "Agencia", title: "Más clientes.", accent: "Menos trabajo manual.", path: "/agencia" });
}
