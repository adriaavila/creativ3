import type { VerticalSlug } from "@/lib/verticals";

// Main metro markets. Add a city here and every vertical page for it
// is generated + sitemapped automatically.
export const CITIES = [
  { slug: "caracas", label: "Caracas" },
  { slug: "maracaibo", label: "Maracaibo" },
  { slug: "valencia", label: "Valencia" },
  { slug: "barquisimeto", label: "Barquisimeto" },
  { slug: "maracay", label: "Maracay" },
] as const;

export type CitySlug = (typeof CITIES)[number]["slug"];

export const VERTICAL_LABELS: Record<VerticalSlug, string> = {
  clinicas: "clínicas",
  inmobiliarias: "inmobiliarias",
  ecommerce: "ecommerce",
  academias: "academias",
};

export function cityBySlug(slug: string) {
  return CITIES.find((c) => c.slug === slug);
}

export function cityVerticalPath(citySlug: string, verticalSlug: VerticalSlug) {
  return `/paginas-web/${citySlug}/${verticalSlug}`;
}
