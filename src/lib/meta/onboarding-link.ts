const SLUG_MAX = 80;

export function toWorkspaceSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX);
}

export function buildOnboardingUrl(
  origin: string,
  slug: string,
  cloudApi: boolean,
  invite: string,
) {
  const url = new URL("/embedded-whatsapp", origin);
  url.searchParams.set("client", slug);
  if (cloudApi) url.searchParams.set("mode", "cloud_api");
  url.searchParams.set("invite", invite);
  return url.toString();
}
