/**
 * Las piezas puras de `scripts/demo-build.ts`: leer el CSV de leads, pasar el
 * HTML de una web a texto, elegir qué otras páginas leer, sacar el JSON de lo
 * que conteste el modelo y —lo más importante— **podar del perfil lo que la
 * web no dice**. El modelo extrae; esta capa desconfía de él.
 */
import { demoProfileSchema, type DemoProfile } from "@/lib/demo-agent";

// ─── CSV ──────────────────────────────────────────────────────

/** RFC 4180 lo justo: comillas, comillas dobladas, comas y saltos dentro de comillas. */
export function parseCsv(raw: string): string[][] {
  const text = raw.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  // Separador: coma, salvo que la cabecera venga con punto y coma (Excel en español).
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && field === "") quoted = true;
    else if (ch === sep) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

export type LeadInput = { name: string; website: string; city: string; country: string; sector: string };

/** Los nombres de columna que se aceptan, en orden de preferencia. */
const COLUMN_ALIASES: Record<keyof LeadInput, string[]> = {
  name: ["business_name", "name", "nombre", "negocio", "empresa", "razon_social", "company", "business"],
  website: ["website", "website_url", "url", "web", "sitio", "sitio_web", "pagina_web", "site", "domain", "dominio"],
  city: ["city", "ciudad", "municipio", "localidad", "location", "ubicacion"],
  country: ["country", "pais", "country_code"],
  sector: ["sector", "vertical", "category", "categoria", "rubro", "tipo", "industry", "industria", "giro"],
};

const normHeader = (h: string) =>
  h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

/** Qué columna es cada campo. `null` si la cabecera no trae ninguno de sus nombres. */
export function mapLeadColumns(header: string[]): Record<keyof LeadInput, number | null> {
  const norm = header.map(normHeader);
  const out = {} as Record<keyof LeadInput, number | null>;
  for (const key of Object.keys(COLUMN_ALIASES) as (keyof LeadInput)[]) {
    const idx = COLUMN_ALIASES[key].map((a) => norm.indexOf(a)).find((i) => i >= 0);
    out[key] = idx ?? null;
  }
  return out;
}

const COUNTRY_NAMES: Record<string, string> = { mx: "México", mex: "México", co: "Colombia", col: "Colombia" };

/** El país como se lee en una frase: «MX» → «México». */
export function countryName(value: string): string {
  const v = value.trim();
  return COUNTRY_NAMES[v.toLowerCase()] ?? v;
}

/**
 * Los leads del CSV con sitio web. Una fila sin nombre o sin web no sirve
 * para una demo (no hay de dónde aprender) y se cuenta como saltada.
 */
export function leadsFromCsv(raw: string): { leads: LeadInput[]; skipped: number; columns: Record<keyof LeadInput, number | null> } {
  const [header, ...rows] = parseCsv(raw);
  if (!header) return { leads: [], skipped: 0, columns: mapLeadColumns([]) };
  const columns = mapLeadColumns(header);
  const at = (row: string[], key: keyof LeadInput) => {
    const i = columns[key];
    return i === null ? "" : (row[i] ?? "").trim();
  };
  const leads: LeadInput[] = [];
  let skipped = 0;
  for (const row of rows) {
    const name = at(row, "name");
    const website = normalizeUrl(at(row, "website"));
    if (!name || !website) {
      skipped++;
      continue;
    }
    leads.push({ name, website, city: at(row, "city"), country: countryName(at(row, "country")), sector: at(row, "sector") });
  }
  return { leads, skipped, columns };
}

/** `clinica.mx` → `https://clinica.mx/`. `null` si no es una URL http(s). */
export function normalizeUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

// ─── HTML → texto ─────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ",
  Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ",
  uuml: "ü", iexcl: "¡", iquest: "¿", euro: "€", middot: "·", ndash: "–", mdash: "—",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e] ?? m;
  });
}

/**
 * El texto legible de una página, más sus datos estructurados (JSON-LD de
 * LocalBusiness: horario, dirección y teléfono suelen estar ahí y en ningún
 * otro lado). Scripts, estilos y navegación repetida fuera.
 */
export function htmlToText(html: string): string {
  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1].trim())
    .filter(Boolean)
    .map((s) => s.slice(0, 4000));
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  const description = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(html)?.[1];
  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|iframe|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section|\/article|\/header|\/footer)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const text = decodeEntities(body)
    .split("\n")
    .map((l) => l.replace(/[ \t\f\v ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
  return [
    title ? `TÍTULO: ${decodeEntities(title).trim()}` : "",
    description ? `DESCRIPCIÓN: ${decodeEntities(description).trim()}` : "",
    text,
    ...jsonLd.map((j) => `DATOS ESTRUCTURADOS: ${j}`),
  ]
    .filter(Boolean)
    .join("\n");
}

const USEFUL_PATH = /(servicio|tratamiento|precio|tarifa|costo|contacto|contact|horario|ubicacion|sucursal|nosotros|about|curso|programa|clase|inscripcion|admision|especialidad|faq|preguntas)/i;

/**
 * Las otras páginas del mismo sitio que vale la pena leer (servicios,
 * precios, contacto…), las más obvias primero. Nada de otro dominio.
 */
export function pickUsefulLinks(html: string, baseUrl: string, max = 3): string[] {
  const base = new URL(baseUrl);
  const host = base.hostname.replace(/^www\./, "");
  const seen = new Set<string>([stripUrl(base)]);
  const scored: { url: string; score: number }[] = [];
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let url: URL;
    try {
      url = new URL(decodeEntities(m[1]), base);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(url.protocol) || url.hostname.replace(/^www\./, "") !== host) continue;
    if (/\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|mp4)$/i.test(url.pathname)) continue;
    const key = stripUrl(url);
    if (seen.has(key)) continue;
    const label = m[2].replace(/<[^>]+>/g, " ");
    const hit = `${decodeURIComponent(url.pathname)} ${label}`.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (!USEFUL_PATH.test(hit)) continue;
    seen.add(key);
    // Precios y servicios primero; contacto después; lo demás al final.
    const score = /(precio|tarifa|costo)/i.test(hit) ? 3 : /(servicio|tratamiento|curso|programa)/i.test(hit) ? 2 : /(contact|horario|ubicacion)/i.test(hit) ? 1 : 0;
    scored.push({ url: key, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.url);
}

function stripUrl(url: URL): string {
  const u = new URL(url.toString());
  u.hash = "";
  u.search = "";
  return u.toString().replace(/\/$/, "");
}

// ─── La respuesta del modelo ──────────────────────────────────

/**
 * El primer objeto JSON de una respuesta: tolera ```json, texto antes y
 * después y comas colgantes. `null` si no hay uno legible.
 */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)?.[1];
  const source = fenced ?? text;
  const start = source.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) {
      const candidate = source.slice(start, i + 1);
      for (const attempt of [candidate, candidate.replace(/,\s*([}\]])/g, "$1")]) {
        try {
          return JSON.parse(attempt);
        } catch {
          // siguiente intento
        }
      }
      return null;
    }
  }
  return null;
}

/** Quita `null`, `""` y listas vacías antes de validar: el modelo los manda en vez de omitir. */
function dropEmpty(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(dropEmpty).filter((v) => v !== undefined);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const cleaned = dropEmpty(v);
      if (cleaned === undefined) continue;
      if (Array.isArray(cleaned) && cleaned.length === 0 && !["services", "hours", "payment", "faqs", "sourceUrls"].includes(k)) continue;
      out[k] = cleaned;
    }
    return out;
  }
  if (value === null) return undefined;
  if (typeof value === "string" && !value.trim()) return undefined;
  return value;
}

/** Lo que conteste el modelo, validado. `null` si no sirve (y toca reintentar). */
export function parseProfileResponse(text: string): DemoProfile | null {
  const raw = extractJson(text);
  if (!raw) return null;
  const parsed = demoProfileSchema.safeParse(dropEmpty(raw));
  return parsed.success ? parsed.data : null;
}

// ─── No inventar ──────────────────────────────────────────────

const digits = (s: string) => s.replace(/\D+/g, "");
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** ¿Las cifras de este precio aparecen en la web? «$1,200» vale contra «1.200» o «1200». */
function numbersAppear(value: string, sourceDigits: string): boolean {
  const nums = value.match(/\d[\d.,\s]*\d|\d/g) ?? [];
  if (nums.length === 0) return false;
  return nums.every((n) => {
    const d = digits(n);
    if (!d) return true;
    return new RegExp(`(^|\\D)${d}(\\D|$)`).test(sourceDigits);
  });
}

/** ¿Al menos la mitad de las palabras con peso de este texto están en la web? */
function wordsAppear(value: string, sourceFolded: string): boolean {
  const words = fold(value).match(/[a-z0-9]{4,}/g) ?? [];
  if (words.length === 0) return true;
  const hits = words.filter((w) => sourceFolded.includes(w)).length;
  return hits / words.length >= 0.5;
}

/**
 * Poda del perfil lo que no se puede rastrear al texto de la web:
 *
 * - un precio cuyas cifras no aparecen se borra (el servicio se queda);
 * - teléfono o WhatsApp cuyos dígitos no aparecen, fuera;
 * - correo que no aparece literal, fuera;
 * - servicio, dirección o tramo de horario cuyas palabras no están, fuera.
 *
 * Devuelve el perfil podado y qué se quitó, para que el script lo muestre.
 */
export function groundProfile(profile: DemoProfile, sourceText: string): { profile: DemoProfile; dropped: string[] } {
  const sourceFolded = fold(sourceText);
  // Los dígitos con separadores conservados como \D: «55 1234 5678» → «55 1234 5678».
  const sourceDigits = sourceText.replace(/(\d)[\s.,-](?=\d)/g, "$1");
  const sourceAllDigits = digits(sourceText);
  const dropped: string[] = [];

  const services = profile.services
    .filter((s) => {
      const ok = wordsAppear(s.name, sourceFolded);
      if (!ok) dropped.push(`servicio «${s.name}»`);
      return ok;
    })
    .map((s) => {
      if (s.price && !numbersAppear(s.price, sourceDigits)) {
        dropped.push(`precio «${s.price}» de ${s.name}`);
        const { price: _price, ...rest } = s;
        void _price;
        return rest;
      }
      return s;
    });

  const phoneOk = (p?: string) => {
    if (!p) return undefined;
    const d = digits(p);
    // Los últimos 8 dígitos bastan: la web puede escribirlo sin lada.
    if (d.length >= 7 && sourceAllDigits.includes(d.slice(-8))) return p;
    dropped.push(`teléfono «${p}»`);
    return undefined;
  };

  const hours = profile.hours.filter((h) => {
    // Con cifras, las horas mandan: «Lunes a viernes 8 a 20» no pasa porque «lunes» esté en la web.
    const ok = /\d/.test(h) ? numbersAppear(h.replace(/[:.]00\b/g, ""), sourceDigits) : wordsAppear(h, sourceFolded);
    if (!ok) dropped.push(`horario «${h}»`);
    return ok;
  });

  let address = profile.address;
  if (address && !wordsAppear(address, sourceFolded)) {
    dropped.push(`dirección «${address}»`);
    address = undefined;
  }
  let email = profile.email;
  if (email && !sourceFolded.includes(fold(email))) {
    dropped.push(`correo «${email}»`);
    email = undefined;
  }
  const faqs = profile.faqs.filter((f) => {
    const ok = wordsAppear(f.a, sourceFolded) && (!/\d/.test(f.a) || numbersAppear(f.a, sourceDigits));
    if (!ok) dropped.push(`pregunta frecuente «${f.q}»`);
    return ok;
  });

  return {
    profile: {
      ...profile,
      services,
      hours,
      address,
      email,
      phone: phoneOk(profile.phone),
      whatsapp: phoneOk(profile.whatsapp),
      faqs,
    },
    dropped,
  };
}

/** ¿Hay con qué hacer una demo? Sin servicios ni horario ni dirección, no. */
export function isUsableProfile(profile: DemoProfile): boolean {
  return profile.services.length > 0 || profile.hours.length > 0 || Boolean(profile.address);
}

/** El prompt de extracción para el modelo. */
export function extractionPrompt(input: { name: string; sector: string; city: string; country: string; pages: { url: string; text: string }[] }): string {
  return [
    `Extrae el perfil del negocio «${input.name}» (${input.sector || "negocio"}, ${[input.city, input.country].filter(Boolean).join(", ")}) a partir del texto de su web pública.`,
    "",
    "Reglas:",
    "- Usa SOLO lo que dice el texto. Si un dato no aparece, OMITE el campo. Nunca supongas, completes ni redondees.",
    "- Precios: cópialos tal cual aparecen, con su moneda si la trae («$650», «desde $1,200 MXN»). Si un servicio no tiene precio escrito, no pongas price.",
    "- Horarios: una línea por tramo, como aparecen.",
    "- tone: una frase sobre cómo le habla la web al cliente (por ejemplo «usted, formal» o «tú, cercano»).",
    "- faqs: solo preguntas y respuestas que estén escritas en la web.",
    "- Escribe en español. No incluyas datos de pacientes ni testimonios.",
    "",
    "Responde SOLO con un objeto JSON con esta forma (los campos opcionales se omiten si no hay dato):",
    '{"summary"?: string, "services": [{"name": string, "price"?: string, "duration"?: string, "notes"?: string}], "hours": string[], "address"?: string, "phone"?: string, "whatsapp"?: string, "email"?: string, "booking"?: string, "payment": string[], "tone"?: string, "faqs": [{"q": string, "a": string}]}',
    "",
    ...input.pages.map((p) => `=== PÁGINA ${p.url} ===\n${p.text}`),
  ].join("\n");
}
