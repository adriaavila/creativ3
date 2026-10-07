/**
 * Arma las demos de la prospección en frío (`allok.fun/demo/<slug>`).
 *
 *   pnpm demo:build --csv /mnt/project-files/leads/2026-10-mx-co-clinicas-academias.csv
 *   pnpm demo:build --csv leads.csv --limit 5 --dry-run
 *   pnpm demo:build --url https://clinica.mx --name "Clínica Sonrisa" --sector "Clínica dental" --city CDMX --country México
 *
 * Por negocio: lee su web pública (la portada y hasta tres páginas obvias:
 * servicios, precios, contacto), le pide al modelo un perfil estructurado,
 * PODA lo que no se puede rastrear al texto de la web (`groundProfile`) y lo
 * guarda en `demo_agent`. Imprime la URL de cada demo.
 *
 * Necesita `DATABASE_URL` (salvo con --dry-run) y `AI_GATEWAY_API_KEY`
 * (o `VERCEL_OIDC_TOKEN`). `pnpm demo:build` lee `.env.local` si existe.
 */
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { demoSlugBase, uniqueSlug } from "../src/lib/demo-agent";
import { buildProfile } from "../src/lib/demo-builder";
import { ensureDemoAgentTable, getDemoSlugOwners, upsertDemoAgent } from "../src/lib/demo-db";
import { isDemoLlmConfigured } from "../src/lib/demo-llm";
import { countryName, leadsFromCsv, normalizeUrl, type LeadInput } from "../src/lib/demo-profile-build";

const { values } = parseArgs({
  options: {
    csv: { type: "string" },
    url: { type: "string" },
    name: { type: "string" },
    sector: { type: "string", default: "" },
    city: { type: "string", default: "" },
    country: { type: "string", default: "" },
    limit: { type: "string" },
    concurrency: { type: "string", default: "3" },
    "dry-run": { type: "boolean", default: false },
    "base-url": { type: "string" },
  },
});

const dryRun = values["dry-run"] ?? false;
const baseUrl = (values["base-url"] ?? "https://allok.fun").replace(/\/+$/, "");

type Outcome = { lead: LeadInput; url?: string; reason?: string; dropped?: string[] };

async function buildOne(lead: LeadInput, owners: Map<string, string | null>): Promise<Outcome> {
  const built = await buildProfile(lead);
  if (!built.ok) {
    const reason = { unreadable: "no se pudo leer la web", model: "el modelo no devolvió un perfil válido", empty: "la web no dice servicios, horario ni dirección" }[built.reason];
    return { lead, reason, dropped: built.dropped };
  }
  const { profile, dropped } = built;

  const slug = uniqueSlug(demoSlugBase(lead.name, lead.city), lead.website, owners);
  owners.set(slug, lead.website);
  if (dryRun) {
    console.log(JSON.stringify({ slug, ...lead, profile }, null, 2));
  } else {
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
  return { lead, url: `${baseUrl}/demo/${slug}`, dropped };
}

async function loadLeads(): Promise<LeadInput[]> {
  if (values.csv) {
    const raw = await readFile(values.csv, "utf8");
    const { leads, skipped, columns } = leadsFromCsv(raw);
    const missing = Object.entries(columns)
      .filter(([, i]) => i === null)
      .map(([k]) => k);
    if (missing.includes("name") || missing.includes("website")) {
      throw new Error(`El CSV no trae columna de nombre o de web. Columnas que faltan: ${missing.join(", ")}`);
    }
    if (missing.length) console.warn(`Columnas no encontradas (quedan vacías): ${missing.join(", ")}`);
    if (skipped) console.warn(`${skipped} filas sin nombre o sin web, saltadas.`);
    const limit = values.limit ? Number(values.limit) : Infinity;
    return leads.slice(0, Number.isFinite(limit) && limit > 0 ? limit : undefined);
  }
  const website = normalizeUrl(values.url ?? "");
  if (!website || !values.name) throw new Error("Usa --csv <archivo> o --url <web> --name <nombre> [--sector --city --country].");
  return [{ name: values.name, website, sector: values.sector ?? "", city: values.city ?? "", country: countryName(values.country ?? "") }];
}

async function main() {
  if (!isDemoLlmConfigured()) throw new Error("Falta AI_GATEWAY_API_KEY (o VERCEL_OIDC_TOKEN).");
  if (!dryRun && !process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL (o usa --dry-run).");

  const leads = await loadLeads();
  console.log(`${leads.length} negocio(s) por armar${dryRun ? " (dry-run: no se guarda nada)" : ""}.`);
  if (!dryRun) await ensureDemoAgentTable();
  const owners = dryRun ? new Map<string, string | null>() : await getDemoSlugOwners();

  const outcomes: Outcome[] = [];
  const concurrency = Math.max(1, Math.min(8, Number(values.concurrency) || 3));
  let next = 0;
  // Los slugs se reservan en `owners` dentro de buildOne, antes de cualquier await posterior: dos
  // workers no se llevan el mismo.
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < leads.length) {
        const lead = leads[next++];
        console.log(`→ ${lead.name} (${lead.website})`);
        const outcome = await buildOne(lead, owners).catch((error: Error) => ({ lead, reason: error.message }) as Outcome);
        if (outcome.dropped?.length) console.log(`  podado (no está en la web): ${outcome.dropped.join("; ")}`);
        console.log(outcome.url ? `  ✓ ${outcome.url}` : `  ✗ ${outcome.reason}`);
        outcomes.push(outcome);
      }
    }),
  );

  const ok = outcomes.filter((o) => o.url);
  console.log(`\n${ok.length}/${outcomes.length} demos listas:`);
  for (const o of ok) console.log(`${o.lead.name}\t${o.url}`);
  const failed = outcomes.filter((o) => !o.url);
  if (failed.length) {
    console.log(`\nSin demo (${failed.length}):`);
    for (const o of failed) console.log(`${o.lead.name}\t${o.lead.website}\t${o.reason}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
