/**
 * Dos semanas de contenido en borrador por la Batch API (mitad de precio):
 * una idea central por día hábil, adaptada a LinkedIn, carrusel de Instagram,
 * Estado de WhatsApp y un hilo corto, en varias variantes para elegir.
 *
 *   pnpm content:batch submit [--days 10] [--variants 3] [--start 2026-11-19]
 *   pnpm content:batch collect [batch_id]   # espera a que termine y escribe los borradores
 *
 * Los borradores quedan en `marketing/content/drafts/` con estado «pendiente
 * aprobación humana». Nada se publica desde aquí.
 *
 * Necesita ANTHROPIC_API_KEY (en `.env.local`).
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import Anthropic from "@anthropic-ai/sdk";
import { INVITE_URL, MARKETS, OFFER } from "../apps/growth-agent/lib/offer";

const ROOT = join(import.meta.dirname, "..");
const DRAFTS = join(ROOT, "marketing", "content", "drafts");
const LAST_BATCH = join(ROOT, "marketing", "content", ".last-batch");
const MODEL = "claude-opus-5-5";

const client = new Anthropic();

const PILLARS = [
  "fuga: una forma concreta en que un WhatsApp sin atender pierde clientes",
  "cómo funciona: qué contesta el agente, cómo califica y cómo agenda, con un ejemplo de conversación",
  "objeción: una duda real del dueño (¿suena a robot?, ¿y si contesta mal?, ¿pierdo el control?) y la respuesta honesta",
  "detrás de escena: cómo se construye y se prueba el agente, contado por el fundador",
  "prueba tú mismo: invitación a escribirle al agente o a probar 7 días gratis",
];
const VERTICALS = ["clínica dental", "clínica estética o spa", "academia de idiomas", "estudio jurídico", "inmobiliaria", "academia de danza o música", "clínica médica"];
const COUNTRIES = ["México", "Colombia", ...MARKETS, "Bolivia"];

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["titulo", "idea", "hook", "linkedin", "instagram", "whatsapp_status", "hilo", "cta", "metrica_esperada", "verificar_antes"],
  properties: {
    titulo: { type: "string", description: "Título interno corto, sin fecha" },
    idea: { type: "string", description: "La idea central en una o dos frases" },
    hook: { type: "string" },
    linkedin: { type: "string", description: "Post completo de LinkedIn, 120-220 palabras, primera persona del fundador" },
    instagram: {
      type: "object",
      additionalProperties: false,
      required: ["slides", "caption"],
      properties: {
        slides: { type: "array", items: { type: "string" }, description: "6 a 8 slides; cada una, título y una o dos frases" },
        caption: { type: "string" },
      },
    },
    whatsapp_status: { type: "string", description: "Texto para un Estado de WhatsApp, máximo 250 caracteres" },
    hilo: { type: "array", items: { type: "string" }, description: "Hilo de 3 a 5 mensajes de máximo 270 caracteres" },
    cta: { type: "string" },
    metrica_esperada: { type: "string", description: "Qué contar para saber si funcionó (respuestas, clics, DMs), sin prometer cifras" },
    verificar_antes: {
      type: "array",
      items: { type: "string" },
      description: "Afirmaciones del texto que el fundador debe confirmar antes de publicar (lista vacía si no hay)",
    },
  },
} as const;

type Draft = {
  titulo: string;
  idea: string;
  hook: string;
  linkedin: string;
  instagram: { slides: string[]; caption: string };
  whatsapp_status: string;
  hilo: string[];
  cta: string;
  metrica_esperada: string;
  verificar_antes: string[];
};

async function system(): Promise<string> {
  const read = (p: string) => readFile(join(ROOT, p), "utf8");
  const [positioning, icp] = await Promise.all([read("marketing/context/positioning.md"), read("marketing/context/ideal-customer-profile.md")]);
  return `Escribes contenido para allok (allok.fun), en la voz de Adrián, su fundador. Escribes en español neutro de LATAM, tuteando, sin voseo.

## Qué vende allok HOY (esto manda sobre cualquier documento de contexto)
- ${OFFER.product}.
- Puesta en marcha: USD ${OFFER.setup.price}. Plan ${OFFER.plans[0].name}: USD ${OFFER.plans[0].price}/${OFFER.plans[0].period}. ${OFFER.plans[1].name}: desde USD ${OFFER.plans[1].price}/${OFFER.plans[1].period}.
- 7 días de prueba gratis del plan Completo, sin tarjeta.
- Cualquiera puede escribirle al agente de allok por WhatsApp para probarlo: ${INVITE_URL}
- Página del producto: https://allok.fun/agente-whatsapp ; páginas por rubro: https://allok.fun/whatsapp-para/<rubro> (clinicas-dentales, clinicas-esteticas, academias, inmobiliarias, talleres, tiendas-online).
- Mercados: México, Colombia, Chile, Uruguay, Venezuela, Paraguay y Bolivia.

## Reglas
- Nada de métricas inventadas, clientes, testimonios, logos ni promesas de ROI. Si un dato no está arriba, no lo afirmes; si algo necesita confirmación, ponlo en "verificar_antes".
- Habla de dolores operativos con detalle real (la misma pregunta de precio 40 veces, el mensaje de las 11 de la noche que nadie contesta), no de "transformación digital" ni de "IA" como magia.
- Frases cortas. Emojis: ninguno en LinkedIn y el hilo; como mucho dos en Instagram y en el Estado.
- Un solo CTA por pieza. En enlaces a allok.fun agrega ?utm_source=<canal>&utm_medium=organic&utm_campaign=noviembre-agente (canal: linkedin, instagram, whatsapp, x).

## Contexto (documentos de agosto: úsalos para tono, público y lo prohibido; la oferta de arriba los reemplaza)

<positioning>
${positioning}
</positioning>

<ideal_customer_profile>
${icp}
</ideal_customer_profile>`;
}

/** Los próximos días hábiles desde `start`. */
function weekdays(start: Date, n: number): string[] {
  const out: string[] = [];
  const d = new Date(start);
  while (out.length < n) {
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

async function submit(days: number, variants: number, start: string) {
  const sys = await system();
  const dates = weekdays(new Date(`${start}T12:00:00Z`), days);
  const requests = dates.flatMap((date, i) =>
    Array.from({ length: variants }, (_, v) => {
      const k = i * variants + v;
      const pillar = PILLARS[i % PILLARS.length];
      const vertical = VERTICALS[k % VERTICALS.length];
      const country = COUNTRIES[k % COUNTRIES.length];
      return {
        custom_id: `${date}-v${v + 1}`,
        params: {
          model: MODEL,
          max_tokens: 8000,
          system: [{ type: "text" as const, text: sys, cache_control: { type: "ephemeral" as const } }],
          output_config: { effort: "medium" as const, format: { type: "json_schema" as const, schema: SCHEMA } },
          messages: [
            {
              role: "user" as const,
              content: `Pieza para el ${date}, variante ${v + 1} de ${variants}.\nPilar: ${pillar}.\nEjemplo central: una ${vertical} en ${country} (sin inventar un negocio real con nombre).\nEscribe una idea central y adáptala a cada canal del esquema.`,
            },
          ],
        },
      };
    }),
  );
  const batch = await client.messages.batches.create({ requests });
  await mkdir(DRAFTS, { recursive: true });
  await writeFile(LAST_BATCH, batch.id + "\n");
  console.log(`Batch ${batch.id}: ${requests.length} piezas (${days} días × ${variants} variantes, desde ${dates[0]}).`);
  console.log("Suele terminar en menos de una hora. Luego: pnpm content:batch collect");
}

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

function render(date: string, variant: string, d: Draft): string {
  return `# Borrador — ${d.titulo}

- **Idea:** ${d.idea}
- **Hook:** ${d.hook}
- **CTA:** ${d.cta}
- **Fecha propuesta:** ${date} (variante ${variant}; elige una por día)
- **Métrica esperada:** ${d.metrica_esperada}
- **Estado:** borrador (pendiente aprobación humana). Generado con la Batch API.
${d.verificar_antes.length ? `- **Verificar antes de publicar:**\n${d.verificar_antes.map((v) => `  - ${v}`).join("\n")}\n` : ""}
---

## LinkedIn

${d.linkedin}

## Instagram (carrusel)

${d.instagram.slides.map((s, i) => `**Slide ${i + 1}:** ${s}`).join("\n\n")}

**Caption:** ${d.instagram.caption}

## Estado de WhatsApp

${d.whatsapp_status}

## Hilo (X / Threads)

${d.hilo.map((t, i) => `${i + 1}. ${t}`).join("\n")}
`;
}

async function collect(batchId: string | undefined) {
  const id = batchId ?? (existsSync(LAST_BATCH) ? (await readFile(LAST_BATCH, "utf8")).trim() : "");
  if (!id) throw new Error("Falta el id del batch (o corre submit primero).");
  for (;;) {
    const batch = await client.messages.batches.retrieve(id);
    if (batch.processing_status === "ended") break;
    console.log(`  ${batch.processing_status}: ${batch.request_counts.processing} en proceso, ${batch.request_counts.succeeded} listas`);
    await new Promise((r) => setTimeout(r, 30_000));
  }
  await mkdir(DRAFTS, { recursive: true });
  let written = 0;
  let input = 0;
  let output = 0;
  for await (const result of await client.messages.batches.results(id)) {
    if (result.result.type !== "succeeded") {
      console.log(`  ${result.custom_id}: ${result.result.type}`);
      continue;
    }
    const message = result.result.message;
    input += message.usage.input_tokens + (message.usage.cache_read_input_tokens ?? 0) + (message.usage.cache_creation_input_tokens ?? 0);
    output += message.usage.output_tokens;
    if (message.stop_reason !== "end_turn") {
      console.log(`  ${result.custom_id}: se detuvo (${message.stop_reason}), sin borrador`);
      continue;
    }
    const text = message.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") continue;
    let draft: Draft;
    try {
      draft = JSON.parse(text.text) as Draft;
    } catch {
      console.log(`  ${result.custom_id}: JSON inválido, sin borrador`);
      continue;
    }
    const [date, variant] = [result.custom_id.slice(0, 10), result.custom_id.slice(12)];
    await writeFile(join(DRAFTS, `${date}-v${variant}-${slug(draft.titulo)}.md`), render(date, variant, draft));
    written++;
  }
  // Batch: mitad del precio de lista de Claude Opus 5.5 ($4 / $20 por millón).
  const cost = (input * 2 + output * 10) / 1_000_000;
  console.log(`${written} borradores en marketing/content/drafts/. Tokens: ${input} entrada, ${output} salida (≈ $${cost.toFixed(2)} como máximo; el caché lo baja).`);
}

const [command, ...rest] = process.argv.slice(2);
const { values, positionals } = parseArgs({
  args: rest,
  allowPositionals: true,
  options: {
    days: { type: "string", default: "10" },
    variants: { type: "string", default: "3" },
    start: { type: "string", default: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) },
  },
});

const run =
  command === "submit"
    ? submit(Math.max(1, Math.min(20, Number(values.days))), Math.max(1, Math.min(5, Number(values.variants))), values.start ?? "")
    : command === "collect"
      ? collect(positionals[0])
      : Promise.reject(new Error("Comandos: submit, collect. Ver el encabezado de scripts/content-batch.ts."));

run.catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
