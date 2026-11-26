import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { penHomeCard } from "@/lib/og/pen-card";

// La imagen al compartir /pen: el titular y la línea, en papel blanco.
export const alt = "I never lift the pen. Adrián Ávila: websites, systems and AI agents.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return penHomeCard();
}
