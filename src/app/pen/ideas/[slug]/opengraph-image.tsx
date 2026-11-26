import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { penHomeCard, penIdeaCard } from "@/lib/og/pen-card";
import { IDEAS, findIdea, ideaNumber, ideaPath } from "@/lib/pen-ideas";

// La imagen al compartir cada idea: la línea tacha lo que se suele creer,
// dibuja y subraya la idea. Es lo que se ve en WhatsApp, X o LinkedIn.
export const alt = "A note by Adrián Ávila";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return IDEAS.map((idea) => ({ slug: idea.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = findIdea(slug);
  if (!idea) return penHomeCard();
  return penIdeaCard({ n: ideaNumber(idea), belief: idea.belief, title: idea.title, glyph: idea.glyph, path: ideaPath(idea) });
}
