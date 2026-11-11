import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/card";
import { PORTFOLIO_PROJECTS } from "@/lib/projects";

// La imagen al compartir cada proyecto (src/lib/og/card.tsx): su nombre y su frase.
export const alt = "A system by Adrian Avila Molina";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return PORTFOLIO_PROJECTS.map((project) => ({ slug: project.id }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = PORTFOLIO_PROJECTS.find((p) => p.id === slug);
  return ogCard({ label: "Work", title: project?.name ?? "Work", accent: project?.kind, path: `/work/${slug}` });
}
