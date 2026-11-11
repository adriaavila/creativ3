import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";

// La imagen al compartir /lab (src/lib/og/card.tsx). El texto es el de la página.
export const alt = "Lab: working toys, not screenshots.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ label: "Lab", title: "Working toys,", accent: "not screenshots.", path: "/lab" });
}
