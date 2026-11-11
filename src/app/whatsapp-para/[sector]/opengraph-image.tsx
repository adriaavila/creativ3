import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { VERTICALS, seoPath } from "@/lib/seo-pages";

// La imagen al compartir cada página SEO (src/lib/og/card.tsx): su kicker y su H1.
export const alt = "allok";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return VERTICALS.map((page) => ({ sector: page.slug }));
}

export default async function Image({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = await params;
  const page = VERTICALS.find((x) => x.slug === sector);
  if (!page) return ogCard({ label: "allok", title: "allok", path: "/" });
  return ogCard({ label: page.kicker, title: page.h1, path: seoPath(page) });
}
