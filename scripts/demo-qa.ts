/**
 * Prueba las demos ANTES de subir los leads a /ops/outreach: cada correo lleva
 * a una demo armada con la web del negocio, y una demo que contesta mal quema
 * el lead. Usa el mismo código que la demo real (readSite, extractionPrompt,
 * groundProfile, buildSystemPrompt, suggestedQuestions) con Claude por la Batch
 * API (mitad de precio), en tres rondas:
 *
 *   1. extraer el perfil de la web (Haiku, el par de gpt-4.1-mini);
 *   2. contestar las preguntas sugeridas con el prompt real de la demo (Haiku);
 *   3. un juez (Sonnet) marca cada demo ok / floja / mala.
 *
 * ponytail: la demo de verdad corre en gpt-4.1-mini por el AI Gateway; esto
 * prueba el perfil y el prompt, no ese modelo. Si un lead pasa aquí y falla
 * allá, el problema es el modelo.
 *
 *   pnpm demo:qa              # todos los importable.csv de marketing/leads/
 *   pnpm demo:qa <dir> ...    # solo esas carpetas
 *
 * Escribe `importable-ok.csv` (las filas con demo ok) junto a cada
 * `importable.csv`, y el detalle en `marketing/leads/qa-<fecha>.csv`.
 * Nada se sube ni se envía.
 */
import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, greeting, suggestedQuestions, type DemoProfile } from "../src/lib/demo-agent";
import { readSite, type SitePage } from "../src/lib/demo-builder";
import { extractionPrompt, groundProfile, isUsableProfile, parseCsv, parseProfileResponse } from "../src/lib/demo-profile-build";
import { hostOf } from "../src/lib/outreach";

const ROOT = join(import.meta.dirname, "..");
const LEADS_DIR = join(ROOT, "marketing", "leads");
const DEMO_MODEL = "claude-haiku-5-5";
const JUDGE_MODEL = "claude-sonnet-5-5";
const EXTRACT_SYSTEM = "Extraes datos de negocios a partir del texto de su web. Respondes solo JSON válido. Nunca inventas un dato que el texto no diga.";

const client = new Anthropic();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const csvCell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

type Lead = { dir: string; header: string[]; row: string[]; name: string; website: string; city: string; country: string; sector: string };
type Qa = { lead: Lead; pages: SitePage[]; profile?: DemoProfile; questions: string[]; answers: string[]; verdict: string; reason: string };

async function loadLeads(dirs: string[]): Promise<Lead[]> {
  const seen = new Set<string>();
  const out: Lead[] = [];
  for (const dir of dirs) {
    const file = join(dir, "importable.csv");
    if (!existsSync(file)) continue;
    const [header = [], ...rows] = parseCsv(await readFile(file, "utf8"));
    const col = (n: string) => header.indexOf(n);
    for (const row of rows) {
      const website = row[col("website")] ?? "";
      const host = hostOf(website);
      if (!host || seen.has(host)) continue;
      seen.add(host);
      out.push({ dir, header, row, website, name: row[col("business_name")] ?? "", city: row[col("city")] ?? "", country: row[col("country")] ?? "", sector: row[col("sector")] ?? "" });
    }
  }
  return out;
}

/** Una ronda de la Batch API: manda, espera y devuelve el texto de cada respuesta por custom_id. */
async function batch(label: string, requests: Anthropic.Messages.Batches.BatchCreateParams.Request[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!requests.length) return out;
  const created = await client.messages.batches.create({ requests });
  console.log(`${label}: batch ${created.id}, ${requests.length} pedidos`);
  for (;;) {
    const b = await client.messages.batches.retrieve(created.id);
    if (b.processing_status === "ended") break;
    await sleep(20_000);
  }
  for await (const r of await client.messages.batches.results(created.id)) {
    if (r.result.type !== "succeeded") continue;
    const text = r.result.message.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim();
    if (text) out.set(r.custom_id, text);
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const dirs = args.length
    ? args
    : (await readdir(LEADS_DIR, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => join(LEADS_DIR, d.name));
  const leads = await loadLeads(dirs);
  console.log(`${leads.length} leads (sin repetir dominio).`);

  // Leer las webs como lo hace la demo, de a 8.
  const qa: Qa[] = leads.map((lead) => ({ lead, pages: [], questions: [], answers: [], verdict: "", reason: "" }));
  for (let i = 0; i < qa.length; i += 8) {
    await Promise.all(qa.slice(i, i + 8).map(async (q) => (q.pages = await readSite(q.lead.website).catch(() => []))));
  }
  for (const q of qa) if (!q.pages.length) Object.assign(q, { verdict: "mala", reason: "la web no se pudo leer: la demo no se arma" });

  // 1. Perfil.
  const extracted = await batch(
    "Perfiles",
    qa.flatMap((q, i) =>
      q.pages.length
        ? [{
            custom_id: `p${i}`,
            params: {
              model: DEMO_MODEL,
              max_tokens: 8000,
              system: EXTRACT_SYSTEM,
              messages: [{ role: "user" as const, content: extractionPrompt({ ...q.lead, pages: q.pages }) }],
            },
          }]
        : [],
    ),
  );
  qa.forEach((q, i) => {
    if (q.verdict) return;
    const parsed = parseProfileResponse(extracted.get(`p${i}`) ?? "");
    if (!parsed) return Object.assign(q, { verdict: "sin probar", reason: "el perfil que sacó Claude no pasó el parser (formato, no la web): probar a mano" });
    const { profile } = groundProfile(parsed, q.pages.map((p) => p.text).join("\n"));
    if (!isUsableProfile(profile)) return Object.assign(q, { verdict: "mala", reason: "la web no dice servicios, horario ni dirección" });
    q.profile = profile;
    q.questions = suggestedQuestions(profile, q.lead.sector).slice(0, 3);
  });

  // 2. La demo contesta sus propias preguntas sugeridas, con su prompt real.
  const answers = await batch(
    "Respuestas",
    qa.flatMap((q, i) =>
      q.profile
        ? q.questions.map((question, j) => ({
            custom_id: `a${i}_${j}`,
            params: {
              model: DEMO_MODEL,
              max_tokens: 1500,
              system: buildSystemPrompt({ businessName: q.lead.name, sector: q.lead.sector, city: q.lead.city, country: q.lead.country, profile: q.profile! }),
              messages: [
                { role: "user" as const, content: "Hola" },
                { role: "assistant" as const, content: greeting({ businessName: q.lead.name, sector: q.lead.sector, profile: q.profile! }) },
                { role: "user" as const, content: question },
              ],
            },
          }))
        : [],
    ),
  );
  qa.forEach((q, i) => (q.answers = q.questions.map((_, j) => answers.get(`a${i}_${j}`) ?? "")));

  // 3. Juez.
  const judged = await batch(
    "Juez",
    qa.flatMap((q, i) =>
      q.profile
        ? [{
            custom_id: `j${i}`,
            params: {
              model: JUDGE_MODEL,
              max_tokens: 2000,
              system:
                "Revisas la demo de un asistente de WhatsApp que se le mostrará al dueño del negocio para venderle el producto. Respondes solo JSON: {\"verdict\": \"ok\" | \"floja\" | \"mala\", \"reason\": string}. " +
                "mala: inventa un dato que no está en DATOS, contradice DATOS, habla de otro negocio, o no contesta. " +
                "floja: no inventa nada, pero dos o más respuestas son «lo confirmo con el equipo» o genéricas, y el dueño no vería su negocio reflejado. " +
                "ok: contesta con datos concretos de DATOS en al menos dos respuestas y suena al negocio. " +
                "Por diseño la demo ofrece agendar una cita, valoración o clase de prueba y deriva al equipo lo que no sabe: eso no es inventar. Un tú/usted distinto al de la web es floja, no mala. reason: una frase en español.",
              messages: [
                {
                  role: "user" as const,
                  content: `Negocio: ${q.lead.name} (${q.lead.sector}, ${q.lead.city}, ${q.lead.country})\nDATOS: ${JSON.stringify(q.profile)}\n\n${q.questions
                    .map((question, j) => `Cliente: ${question}\nDemo: ${q.answers[j] || "(sin respuesta)"}`)
                    .join("\n\n")}`,
                },
              ],
            },
          }]
        : [],
    ),
  );
  qa.forEach((q, i) => {
    if (!q.profile) return;
    const raw = judged.get(`j${i}`) ?? "";
    try {
      const v = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as { verdict?: string; reason?: string };
      Object.assign(q, { verdict: v.verdict ?? "floja", reason: v.reason ?? "" });
    } catch {
      Object.assign(q, { verdict: "floja", reason: "el juez no respondió JSON" });
    }
  });

  // Salida: importable-ok.csv por carpeta y el detalle.
  for (const dir of new Set(qa.map((q) => q.lead.dir))) {
    const mine = qa.filter((q) => q.lead.dir === dir);
    const ok = mine.filter((q) => q.verdict === "ok");
    await writeFile(join(dir, "importable-ok.csv"), [mine[0].lead.header, ...ok.map((q) => q.lead.row)].map((r) => r.map(csvCell).join(",")).join("\n") + "\n");
    const count = (v: string) => mine.filter((q) => q.verdict === v).length;
    console.log(`${dir.split("/").pop()}: ${ok.length} ok, ${count("floja")} flojas, ${count("mala")} malas de ${mine.length}`);
  }
  const detail = join(LEADS_DIR, `qa-${new Date().toISOString().slice(0, 10)}.csv`);
  const head = ["carpeta", "business_name", "website", "veredicto", "motivo", "pregunta_1", "respuesta_1", "pregunta_2", "respuesta_2", "pregunta_3", "respuesta_3"];
  const rows = qa.map((q) => [q.lead.dir.split("/").pop() ?? "", q.lead.name, q.lead.website, q.verdict, q.reason, ...[0, 1, 2].flatMap((j) => [q.questions[j] ?? "", q.answers[j] ?? ""])]);
  await writeFile(detail, [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n");
  console.log(`Detalle: ${detail}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
