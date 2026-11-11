import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { COMPARISONS, seoPath } from "@/lib/seo-pages";

// La imagen al compartir cada página SEO (src/lib/og/card.tsx): su kicker y su H1.
export const alt = "allok";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return COMPARISONS.map((page) => ({ competidor: page.slug }));
}

export default async function Image({ params }: { params: Promise<{ competidor: string }> }) {
  const { competidor } = await params;
  const page = COMPARISONS.find((x) => x.slug === competidor);
  if (!page) return ogCard({ label: "allok", title: "allok", path: "/" });
  return ogCard({ label: page.kicker, title: page.h1, path: seoPath(page) });
}
