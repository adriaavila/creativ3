/**
 * Las piezas puras de la prospección en frío por correo (`scripts/outreach.ts`):
 * qué correos del CSV se pueden escribir, en qué país y zona horaria vive cada
 * negocio, cuándo toca el siguiente paso, la ventana de envío, el token de baja
 * y la firma de los webhooks de Resend. Nada aquí toca la red ni la base.
 *
 * Reglas que esta capa hace cumplir:
 * - Solo correos de negocio publicados en su web: el dominio del correo es el
 *   de la web, o el CSV dice en qué página de esa web se encontró.
 * - Webmail gratuito (gmail, hotmail…) fuera, salvo que se pida explícitamente.
 * - Nada de casillas que no lee nadie (noreply, postmaster…) ni direcciones rotas.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { slugify } from "@/lib/demo-agent";
import { countryName, normalizeUrl, parseCsv } from "@/lib/demo-profile-build";

// ─── Estados y secuencia ──────────────────────────────────────

export const OUTREACH_STATUSES = ["queued", "sent", "replied", "bounced", "complained", "unsubscribed", "signed_up"] as const;
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

/** Los estados que se marcan a mano (`pnpm outreach mark`): no podemos leer el buzón. */
export const MANUAL_STATUSES = ["replied", "signed_up"] as const;
export type ManualStatus = (typeof MANUAL_STATUSES)[number];

/** Día de cada paso, contado desde el primer envío: 0, 3 y 8. */
export const SEQUENCE_DAYS = [0, 3, 8] as const;
export const SEQUENCE_STEPS = SEQUENCE_DAYS.length;

/** Solo estos dominios pueden firmar los envíos: la reputación de allok.fun queda aparte. */
export const OUTREACH_SENDING_DOMAIN = "hola.allok.fun";
export const SITE_URL = "https://allok.fun";
export const DEFAULT_REPLY_TO = "hi@allok.fun";
export const DEFAULT_DAILY_CAP = 20;
/** Si más de este porcentaje de los últimos envíos rebotó, el envío entero se detiene. */
export const MAX_BOUNCE_RATE = 0.03;
export const BOUNCE_WINDOW_SENDS = 100;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Cuándo toca el paso siguiente a `stepJustSent` (1-based), o `null` si la
 * secuencia terminó. Se cuenta desde el envío que acaba de salir: el paso 2
 * sale 3 días después del 1 y el 3, 5 días después del 2 (día 8).
 */
export function nextSendAt(stepJustSent: number, sentAt: Date): Date | null {
  if (stepJustSent >= SEQUENCE_STEPS) return null;
  const gap = SEQUENCE_DAYS[stepJustSent] - SEQUENCE_DAYS[stepJustSent - 1];
  return new Date(sentAt.getTime() + gap * DAY_MS);
}

// ─── País y ventana de envío ──────────────────────────────────

export type CountryCode = "MX" | "CO";

export const COUNTRY_TIMEZONES: Record<CountryCode, string> = {
  MX: "America/Mexico_City",
  CO: "America/Bogota",
};

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * MX o CO, por la columna de país o, si viene vacía, por el dominio de la web
 * (`.mx`, `.com.co`…). `null` si no se sabe: sin país no hay zona horaria y
 * no se le escribe.
 */
export function countryCode(country: string, website?: string | null): CountryCode | null {
  const c = stripAccents(countryName(country)).trim().toLowerCase();
  if (c === "mexico" || c === "mx" || c === "mex") return "MX";
  if (c === "colombia" || c === "co" || c === "col") return "CO";
  if (c) return null;
  const host = website ? hostOf(website) : "";
  if (/\.mx$/.test(host)) return "MX";
  if (/\.co$/.test(host)) return "CO";
  return null;
}

/** La hora local del negocio: día de la semana (0 = domingo) y hora 0–23. */
export function localTime(now: Date, timeZone: string): { weekday: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(now);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? NaN);
  return { weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd), hour };
}

/** Lunes a viernes, de 9:00 a 16:59 en la hora del negocio. */
export function inSendWindow(now: Date, country: CountryCode): boolean {
  const { weekday, hour } = localTime(now, COUNTRY_TIMEZONES[country]);
  return weekday >= 1 && weekday <= 5 && hour >= 9 && hour < 17;
}

// ─── Correos ──────────────────────────────────────────────────

/** Webmail gratuito: no es un correo «del negocio» aunque el negocio lo use. */
export const FREEMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.es", "hotmail.com.mx", "hotmail.co",
  "outlook.com", "outlook.es", "outlook.com.mx", "live.com", "live.com.mx", "msn.com",
  "yahoo.com", "yahoo.com.mx", "yahoo.es", "yahoo.com.co", "ymail.com", "rocketmail.com",
  "icloud.com", "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me", "gmx.com",
  "zoho.com", "mail.com", "yandex.com", "prodigy.net.mx", "infinitummail.com", "une.net.co",
]);

/** Casillas que no lee una persona, o que piden expresamente no escribirles. */
const NON_PERSON_LOCALS = /^(no-?reply|do-?not-?reply|donotreply|noresponder|no-?responder|mailer-daemon|postmaster|abuse|bounces?|unsubscribe|root|hostmaster|devnull|null|test|example|privacy|privacidad|dpo)$/;

/** Dominios de plantilla o de proveedores que se cuelan al raspar una web. */
const JUNK_DOMAINS = /(^|\.)(example\.(com|org|net)|domain\.com|email\.com|tudominio\.com|sudominio\.com|dominio\.com|sentry\.io|sentry-next\.wixpress\.com|wixpress\.com|wix\.com|godaddy\.com|squarespace\.com|mysite\.com|test\.com)$/;

const EMAIL_SHAPE = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

/** `" Info@Clinica.MX "` → `info@clinica.mx`; quita un `mailto:` y lo que siga a `?`. */
export function normalizeEmail(value: string): string {
  return value.trim().replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase();
}

export function emailDomain(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1);
}

export function isFreemail(email: string): boolean {
  return FREEMAIL_DOMAINS.has(emailDomain(normalizeEmail(email)));
}

/**
 * ¿Es una dirección a la que tiene sentido escribir? Forma válida, sin
 * archivos raspados por error (`logo@2x.png`), sin dominios de plantilla y sin
 * casillas que nadie lee.
 */
export function emailProblem(email: string): string | null {
  const e = normalizeEmail(email);
  if (!EMAIL_SHAPE.test(e) || e.includes("..")) return "correo inválido";
  if (/\.(png|jpe?g|gif|webp|svg|css|js|pdf)$/.test(e)) return "correo inválido";
  if (JUNK_DOMAINS.test(emailDomain(e))) return "dominio de plantilla";
  const local = e.slice(0, e.indexOf("@")).replace(/\+.*$/, "");
  if (NON_PERSON_LOCALS.test(local)) return "casilla que nadie lee";
  return null;
}

/** El host sin `www.`: `https://www.clinica.com.mx/x` → `clinica.com.mx`. */
export function hostOf(url: string): string {
  const u = normalizeUrl(url);
  if (!u) return "";
  return new URL(u).hostname.toLowerCase().replace(/^www\./, "");
}

/** ¿El dominio del correo es el de la web (o un subdominio de él, o al revés)? */
export function sameSite(emailOrHost: string, website: string): boolean {
  const a = (emailOrHost.includes("@") ? emailDomain(normalizeEmail(emailOrHost)) : emailOrHost).toLowerCase().replace(/^www\./, "");
  const b = hostOf(website);
  if (!a || !b) return false;
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

// ─── El CSV ───────────────────────────────────────────────────

export type OutreachLead = {
  email: string;
  businessName: string;
  website: string | null;
  sector: string;
  city: string;
  country: CountryCode;
  /** Lo que el negocio ofrece, en una línea (`oferta_1_linea`): el gancho del primer correo. */
  offer: string;
};

type Field = "name" | "website" | "email" | "emailSource" | "city" | "country" | "sector" | "offer";

const ALIASES: Record<Field, string[]> = {
  name: ["business_name", "name", "nombre", "negocio", "empresa", "razon_social", "company", "business"],
  website: ["website", "website_url", "url", "web", "sitio", "sitio_web", "pagina_web", "site", "domain", "dominio"],
  email: ["email", "emails", "correo", "correos", "correo_electronico", "e_mail", "mail", "contact_email", "email_address", "business_email"],
  emailSource: ["email_source", "email_source_url", "email_url", "email_found_on", "email_page", "fuente_email", "fuente_correo", "correo_fuente", "source_url", "fuente_url", "fuente"],
  city: ["city", "ciudad", "municipio", "localidad", "location", "ubicacion"],
  country: ["country", "pais", "country_code"],
  sector: ["sector", "vertical", "category", "categoria", "rubro", "tipo", "industry", "industria", "giro"],
  offer: ["oferta_1_linea", "oferta", "offer", "hook", "gancho", "descripcion", "description"],
};

const normHeader = (h: string) =>
  stripAccents(h)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

export function mapOutreachColumns(header: string[]): Record<Field, number | null> {
  const norm = header.map(normHeader);
  const out = {} as Record<Field, number | null>;
  for (const key of Object.keys(ALIASES) as Field[]) {
    out[key] = ALIASES[key].map((a) => norm.indexOf(a)).find((i) => i >= 0) ?? null;
  }
  return out;
}

export type ImportSkip = { row: number; name: string; email: string; reason: string };

/**
 * Los contactos escribibles del CSV, ya filtrados y sin repetidos. Una celda
 * puede traer varios correos (`a@x.mx; b@x.mx`): se toma el primero que pase.
 *
 * Que el correo sea «de la web» se comprueba así: si el CSV trae la página
 * donde se encontró (`email_source`…), esa página tiene que ser de la web del
 * negocio; si no la trae, el dominio del correo tiene que ser el de la web.
 */
export function outreachLeadsFromCsv(
  raw: string,
  opts: { allowFreemail?: boolean; suppressed?: ReadonlySet<string> } = {},
): { leads: OutreachLead[]; skipped: ImportSkip[]; columns: Record<Field, number | null> } {
  const [header, ...rows] = parseCsv(raw);
  const columns = mapOutreachColumns(header ?? []);
  const at = (row: string[], key: Field) => {
    const i = columns[key];
    return i === null ? "" : (row[i] ?? "").trim();
  };
  const leads: OutreachLead[] = [];
  const skipped: ImportSkip[] = [];
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const rowNo = index + 2;
    const name = at(row, "name");
    const website = normalizeUrl(at(row, "website"));
    const source = at(row, "emailSource");
    const candidates = at(row, "email").split(/[\s,;|]+/).map(normalizeEmail).filter(Boolean);
    const skip = (reason: string, email = candidates[0] ?? "") => skipped.push({ row: rowNo, name, email, reason });

    if (!name) return skip("sin nombre");
    if (candidates.length === 0) return skip("sin correo");
    const country = countryCode(at(row, "country"), website);
    if (!country) return skip("país fuera de MX/CO o desconocido");

    const rejection = (email: string): string | null => {
      const problem = emailProblem(email);
      if (problem) return problem;
      const free = isFreemail(email);
      if (free && !opts.allowFreemail) return "webmail gratuito";
      if (!website) return "sin web de donde salga el correo";
      if (source) {
        if (!sameSite(hostOf(source), website)) return "la fuente del correo no es la web del negocio";
      } else if (!free && !sameSite(email, website)) {
        return "el dominio del correo no es el de la web";
      }
      if (opts.suppressed?.has(email)) return "en la lista de supresión";
      if (seen.has(email)) return "repetido";
      return null;
    };
    let lastReason = "";
    const chosen = candidates.find((email) => {
      const reason = rejection(email);
      if (reason) lastReason = reason;
      return reason === null;
    });
    if (!chosen) return skip(lastReason);
    seen.add(chosen);
    leads.push({ email: chosen, businessName: name, website, sector: at(row, "sector"), city: at(row, "city"), country, offer: at(row, "offer") });
  });
  return { leads, skipped, columns };
}

// ─── La demo de cada negocio ──────────────────────────────────

/**
 * El slug de la demo de ese negocio, si ya se armó: misma web (sin `www.` ni
 * ruta) o, si no, mismo nombre. `null` si no hay demo.
 */
export function matchDemoSlug(
  lead: Pick<OutreachLead, "businessName" | "website">,
  demos: readonly { slug: string; businessName: string; website: string | null }[],
): string | null {
  const host = lead.website ? hostOf(lead.website) : "";
  if (host) {
    const bySite = demos.find((d) => d.website && hostOf(d.website) === host);
    if (bySite) return bySite.slug;
  }
  const name = slugify(lead.businessName);
  return (name && demos.find((d) => slugify(d.businessName) === name)?.slug) || null;
}

// ─── Configuración del envío ──────────────────────────────────

export type SendConfig = { apiKey: string; from: string; replyTo: string; secret: string; dailyCap: number };

/**
 * La configuración para enviar de verdad, o la lista de lo que falta. El
 * interruptor `OUTREACH_ENABLED=true` es obligatorio: sin él no sale nada.
 */
export function readSendConfig(env: Record<string, string | undefined>): { config: SendConfig | null; problems: string[] } {
  const problems: string[] = [];
  if (env.OUTREACH_ENABLED !== "true") problems.push("OUTREACH_ENABLED no es «true» (interruptor apagado)");
  const apiKey = env.RESEND_API_KEY?.trim() ?? "";
  if (!apiKey) problems.push("falta RESEND_API_KEY");
  const from = env.OUTREACH_FROM?.trim() ?? "";
  const fromAddress = /<([^>]+)>\s*$/.exec(from)?.[1] ?? from;
  if (!from) problems.push("falta OUTREACH_FROM");
  else if (emailDomain(fromAddress.toLowerCase()) !== OUTREACH_SENDING_DOMAIN) {
    problems.push(`OUTREACH_FROM tiene que ser una dirección de @${OUTREACH_SENDING_DOMAIN} (la del dominio raíz no se arriesga)`);
  }
  const secret = env.OUTREACH_SECRET?.trim() ?? "";
  if (secret.length < 16) problems.push("falta OUTREACH_SECRET (16 caracteres o más)");
  const capRaw = env.OUTREACH_DAILY_CAP?.trim();
  const dailyCap = capRaw ? Number(capRaw) : DEFAULT_DAILY_CAP;
  if (!Number.isInteger(dailyCap) || dailyCap < 0) problems.push("OUTREACH_DAILY_CAP no es un entero ≥ 0");
  const replyTo = env.OUTREACH_REPLY_TO?.trim() || DEFAULT_REPLY_TO;
  return { config: problems.length ? null : { apiKey, from, replyTo, secret, dailyCap }, problems };
}

// ─── El token de baja ─────────────────────────────────────────

const b64url = (buf: Buffer) => buf.toString("base64url");

function unsubscribeMac(email: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(`outreach-unsubscribe:${email}`).digest().subarray(0, 16);
}

/**
 * `<correo en base64url>.<HMAC-SHA256 truncado a 128 bits>`. El correo va en
 * el token porque la ruta de baja tiene que saber a quién dar de baja sin
 * buscar; el HMAC impide dar de baja a otro cambiando el correo.
 */
export function unsubscribeToken(email: string, secret: string): string {
  const e = normalizeEmail(email);
  return `${b64url(Buffer.from(e, "utf8"))}.${b64url(unsubscribeMac(e, secret))}`;
}

/** El correo del token, o `null` si el token no es válido. */
export function verifyUnsubscribeToken(token: string | null | undefined, secret: string): string | null {
  if (!token || token.length > 400 || !secret) return null;
  const m = /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{22})$/.exec(token);
  if (!m) return null;
  const email = Buffer.from(m[1], "base64url").toString("utf8");
  if (email !== normalizeEmail(email) || !EMAIL_SHAPE.test(email)) return null;
  const given = Buffer.from(m[2], "base64url");
  const expected = unsubscribeMac(email, secret);
  return given.length === expected.length && timingSafeEqual(given, expected) ? email : null;
}

export function unsubscribeUrl(email: string, secret: string): string {
  return `${SITE_URL}/api/outreach/baja?t=${unsubscribeToken(email, secret)}`;
}

// ─── Webhooks de Resend (Svix / Standard Webhooks) ────────────

const WEBHOOK_TOLERANCE_S = 5 * 60;

/**
 * Verifica la firma de un webhook de Resend. Resend firma con Svix: HMAC-SHA256
 * de `${svix-id}.${svix-timestamp}.${cuerpo}` con el secreto `whsec_<base64>`;
 * `svix-signature` trae una o más firmas `v1,<base64>` separadas por espacios.
 * Se rechaza un timestamp a más de 5 minutos (repetición).
 */
export function verifySvixSignature(input: {
  rawBody: string;
  id: string | null;
  timestamp: string | null;
  signature: string | null;
  secret: string;
  nowMs?: number;
}): boolean {
  const { rawBody, id, timestamp, signature, secret } = input;
  if (!id || !timestamp || !signature || !secret) return false;
  if (!/^\d{1,12}$/.test(timestamp)) return false;
  const now = Math.floor((input.nowMs ?? Date.now()) / 1000);
  if (Math.abs(now - Number(timestamp)) > WEBHOOK_TOLERANCE_S) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  if (key.length === 0) return false;
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest();
  return signature.split(" ").some((part) => {
    const [version, sig] = part.split(",", 2);
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

/** Rebotes sobre envíos: `bounced / sent`, 0 si no hubo envíos. */
export function bounceRate(sent: number, bounced: number): number {
  return sent > 0 ? bounced / sent : 0;
}

/** ¿Hay que detener el envío? Más del 3 % de rebote en los últimos 100 envíos. */
export function bounceGuardTripped(sent: number, bounced: number): boolean {
  return bounceRate(sent, bounced) > MAX_BOUNCE_RATE;
}
