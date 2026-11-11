import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { WRITING } from "@/lib/writing";

// La imagen al compartir cada nota (src/lib/og/card.tsx): su título.
export const alt = "A note by Adrian Avila Molina";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return WRITING.map((note) => ({ slug: note.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = WRITING.find((n) => n.slug === slug);
  return ogCard({ label: note ? `Writing · ${note.category}` : "Writing", title: note?.title ?? "Writing", path: `/writing/${slug}` });
}
