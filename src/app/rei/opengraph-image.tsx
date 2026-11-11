import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";

// La imagen al compartir /rei (src/lib/og/card.tsx). El texto es el de la página.
export const alt = "REI: cada consulta, atendida y contada.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ label: "REI · CRM de WhatsApp para inmobiliarias", title: "Cada consulta,", accent: "atendida y contada.", path: "/rei" });
}
