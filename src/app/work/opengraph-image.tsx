import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";

// La imagen al compartir /work (src/lib/og/card.tsx). El texto es el de la página.
export const alt = "Work: every system, nothing staged.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({ label: "Work", title: "Every system,", accent: "nothing staged.", path: "/work" });
}
