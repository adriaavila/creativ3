import { demoSlugBase, uniqueSlug } from "@/lib/demo-agent";
import { buildProfile } from "@/lib/demo-builder";
import { upsertDemoAgent } from "@/lib/demo-db";
import type { LeadInput } from "@/lib/demo-profile-build";
import type { DemoProfile } from "@/lib/demo-agent";

/**
 * Armar y guardar la demo de un negocio: leer su web, extraer el perfil, podar
 * lo que la web no dice y guardarlo en `demo_agent`. Lo usan
 * `scripts/demo-build.ts` (la carga a mano) y el cron de la prospección
 * (`/api/cron/outreach`), así que vive aquí y no en el script.
 */

export const BUILD_FAILURE_REASON = {
  unreadable: "no se pudo leer la web",
  model: "el modelo no devolvió un perfil válido",
  empty: "la web no dice servicios, horario ni dirección",
} as const;

export type DemoBuildOutcome =
  | { ok: true; slug: string; profile: DemoProfile; dropped: string[] }
  | { ok: false; reason: string; dropped?: string[] };

/**
 * `owners` (slug → web) es el registro de slugs ocupados; se reserva el nuevo
 * antes de cualquier `await` posterior, así dos builds en paralelo no se
 * llevan el mismo. Con `dryRun` no se guarda nada.
 */
export async function buildAndSaveDemo(
  lead: LeadInput,
  owners: Map<string, string | null>,
  { dryRun = false, timeoutMs }: { dryRun?: boolean; timeoutMs?: number } = {},
): Promise<DemoBuildOutcome> {
  const built = await buildProfile(lead, { timeoutMs });
  if (!built.ok) return { ok: false, reason: BUILD_FAILURE_REASON[built.reason], dropped: built.dropped };
  const { profile, dropped } = built;

  const slug = uniqueSlug(demoSlugBase(lead.name, lead.city), lead.website, owners);
  owners.set(slug, lead.website);
  if (!dryRun) {
    await upsertDemoAgent({
      slug,
      businessName: lead.name,
      sector: lead.sector,
      city: lead.city,
      country: lead.country,
      website: lead.website,
      profile,
    });
  }
  return { ok: true, slug, profile, dropped };
}
