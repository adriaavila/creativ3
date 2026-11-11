import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";

export const alt = "Juanete × allok — que empiece la función";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// La placa de la casa (src/lib/og/card.tsx), con el copy del proyecto: el link se comparte por WhatsApp.
export default function Image() {
  return ogCard({ label: "allok × juanete · comedia musical", title: "Que empiece", accent: "la función.", path: "/pago/juanete" });
}
