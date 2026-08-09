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
  const title = `Sistema comercial para ${label} en ${city.label}`;
  const description = `Allok organiza consultas, seguimiento y oportunidades por WhatsApp para ${label} en ${city.label}, Venezuela.`;
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
  const title = `Sistema comercial para ${label} en ${city.label}`;
  const description = `Allok organiza consultas, seguimiento y oportunidades por WhatsApp para ${label} en ${city.label}, Venezuela.`;

  // Two levels only — there is no `/paginas-web/{city}` listing route to
  // point an intermediate breadcrumb node at.
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: title, item: `${SITE_URL}${path}` },
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
