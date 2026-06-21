import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VerticalLandingPage from "@/components/landing/VerticalLandingPage";
import { VERTICALS, VERTICAL_LIST, type VerticalSlug } from "@/lib/verticals";
import { CITIES, VERTICAL_LABELS, cityBySlug, cityVerticalPath } from "@/lib/cities";
import { SITE_URL, serviceJsonLd } from "@/lib/seo";

type Params = { ciudad: string; vertical: string };

export function generateStaticParams() {
  return CITIES.flatMap((c) =>
    VERTICAL_LIST.map((v) => ({ ciudad: c.slug, vertical: v.slug })),
  );
}

function resolve(params: Params) {
  const city = cityBySlug(params.ciudad);
  const vertical = VERTICALS[params.vertical as VerticalSlug];
  if (!city || !vertical) return null;
  return { city, vertical };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const resolved = resolve(await params);
  if (!resolved) return {};
  const { city, vertical } = resolved;
  const label = VERTICAL_LABELS[vertical.slug];
  const title = `Páginas web para ${label} en ${city.label}`;
  const description = `Diseño web, automatización de WhatsApp y agentes IA para ${label} en ${city.label}, Venezuela. Landings que captan, califican y dan seguimiento a leads.`;
  return {
    title,
    description,
    alternates: { canonical: cityVerticalPath(city.slug, vertical.slug) },
  };
}

export default async function CityVerticalPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const resolved = resolve(await params);
  if (!resolved) notFound();
  const { city, vertical } = resolved;
  const label = VERTICAL_LABELS[vertical.slug];
  const path = cityVerticalPath(city.slug, vertical.slug);
  const title = `Páginas web para ${label} en ${city.label}`;
  const description = `Diseño web, automatización de WhatsApp y agentes IA para ${label} en ${city.label}, Venezuela.`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: city.label, item: `${SITE_URL}/paginas-web/${city.slug}` },
      { "@type": "ListItem", position: 3, name: title, item: `${SITE_URL}${path}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([serviceJsonLd(title, description, path), breadcrumb]),
        }}
      />
      <VerticalLandingPage vertical={vertical} city={city.label} />
    </>
  );
}
