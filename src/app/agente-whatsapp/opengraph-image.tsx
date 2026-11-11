import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";

// La imagen al compartir /agente-whatsapp (src/lib/og/card.tsx). El texto es el de la página.
export const alt = "allok: te fuiste a dormir, tu WhatsApp no.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ label: "Agente de WhatsApp con IA", title: "Te fuiste a dormir.", accent: "Tu WhatsApp no.", path: "/agente-whatsapp" });
}
