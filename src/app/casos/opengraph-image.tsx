import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";

// La imagen al compartir /casos (src/lib/og/card.tsx). El texto es el de la página.
export const alt = "Casos de allok: el trabajo habla primero.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ label: "Casos", title: "El trabajo", accent: "habla primero.", path: "/casos" });
}
