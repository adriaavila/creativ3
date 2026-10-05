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
import { demoSlugBase, uniqueSlug, type DemoProfile } from "../src/lib/demo-agent";
import { ensureDemoAgentTable, getDemoSlugOwners, upsertDemoAgent } from "../src/lib/demo-db";
import { chatCompletion, isDemoLlmConfigured, type LlmMessage } from "../src/lib/demo-llm";
import {
  countryName,
  extractionPrompt,
  groundProfile,
  htmlToText,
  isUsableProfile,
  leadsFromCsv,
  normalizeUrl,
  parseProfileResponse,
  pickUsefulLinks,
  type LeadInput,
} from "../src/lib/demo-profile-build";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 1_500_000;
const MAX_PAGE_CHARS = 20_000;
const MAX_TOTAL_CHARS = 55_000;
const USER_AGENT = "Mozilla/5.0 (compatible; allok-demo-builder/1.0; +https://allok.fun)";

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

/** El HTML de una página, con tope de tiempo y de tamaño. `null` si no es HTML o falla. */
async function fetchHtml(url: string): Promise<{ url: string; html: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml", "accept-language": "es-MX,es;q=0.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok || !res.body) return null;
    const type = res.headers.get("content-type") ?? "";
    if (type && !/html|xml/i.test(type)) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    const html = new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks).subarray(0, MAX_HTML_BYTES));
    return { url: res.url || url, html };
  } catch {
    return null;
  }
}

async function readSite(website: string): Promise<{ url: string; text: string }[]> {
  const home = await fetchHtml(website);
  if (!home) return [];
  const pages = [{ url: home.url, text: htmlToText(home.html).slice(0, MAX_PAGE_CHARS) }];
  const extra = await Promise.all(pickUsefulLinks(home.html, home.url, 3).map(fetchHtml));
  let total = pages[0].text.length;
  for (const page of extra) {
    if (!page) continue;
    const text = htmlToText(page.html).slice(0, MAX_PAGE_CHARS);
    if (total + text.length > MAX_TOTAL_CHARS) break;
    total += text.length;
    pages.push({ url: page.url, text });
  }
  return pages;
}

const SYSTEM = "Extraes datos de negocios a partir del texto de su web. Respondes solo JSON válido. Nunca inventas un dato que el texto no diga.";

/** El perfil según el modelo: JSON validado con zod, con un reintento si no sirve. */
async function extractProfile(lead: LeadInput, pages: { url: string; text: string }[]): Promise<DemoProfile | null> {
  const prompt = extractionPrompt({ name: lead.name, sector: lead.sector, city: lead.city, country: lead.country, pages });
  const messages: LlmMessage[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: prompt },
  ];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const reply = await chatCompletion(messages, { maxTokens: 2000, temperature: 0, timeoutMs: 60_000, json: true });
      const profile = parseProfileResponse(reply);
      if (profile) return profile;
      messages.push(
        { role: "assistant", content: reply },
        { role: "user", content: "Esa respuesta no es un JSON válido con la forma pedida. Responde SOLO el objeto JSON, sin texto alrededor." },
      );
    } catch (error) {
      console.warn(`  modelo, intento ${attempt + 1}: ${(error as Error).message}`);
    }
  }
  return null;
}

type Outcome = { lead: LeadInput; url?: string; reason?: string; dropped?: string[] };

async function buildOne(lead: LeadInput, owners: Map<string, string | null>): Promise<Outcome> {
  const pages = await readSite(lead.website);
  if (pages.length === 0) return { lead, reason: "no se pudo leer la web" };
  const extracted = await extractProfile(lead, pages);
  if (!extracted) return { lead, reason: "el modelo no devolvió un perfil válido" };
  const { profile, dropped } = groundProfile(extracted, pages.map((p) => p.text).join("\n"));
  profile.sourceUrls = pages.map((p) => p.url).slice(0, 10);
  if (!isUsableProfile(profile)) return { lead, reason: "la web no dice servicios, horario ni dirección", dropped };

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
