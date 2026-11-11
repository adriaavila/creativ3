import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";

// La imagen al compartir /vocero (src/lib/og/card.tsx). El texto es el de la página.
export const alt = "Vocero: tu operación, contestando sola.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ label: "Vocero · agente de WhatsApp a medida", title: "Tu operación,", accent: "contestando sola.", path: "/vocero" });
}
