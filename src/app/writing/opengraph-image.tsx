import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";

// La imagen al compartir /writing (src/lib/og/card.tsx). El texto es el de la página.
export const alt = "Writing: notes from the work.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ label: "Writing", title: "Notes", accent: "from the work.", path: "/writing" });
}
