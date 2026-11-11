import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";

// La imagen al compartir /portfolio (src/lib/og/card.tsx). El texto es el de la página.
export const alt = "Adrian Avila Molina, industrial engineer.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ label: "Portfolio · Adrian Avila Molina", title: "Industrial", accent: "engineer.", path: "/portfolio" });
}
