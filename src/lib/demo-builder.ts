import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { DemoProfile } from "@/lib/demo-agent";
import { chatCompletion, type LlmMessage } from "@/lib/demo-llm";
import {
  extractionPrompt,
  groundProfile,
  htmlToText,
  isUsableProfile,
  parseProfileResponse,
  pickUsefulLinks,
  type LeadInput,
} from "@/lib/demo-profile-build";

/**
 * Leer una web y sacar el perfil del negocio: lo comparten la carga en lote
 * (`scripts/demo-build.ts`, webs de una lista de prospectos) y «Arma tu demo»
 * del sitio (`/api/demo/crear`, la web que pega un visitante).
 *
 * Como la segunda lee URLs que escribe cualquiera, cada salto pasa por la
 * misma guarda: solo http(s), DNS que no resuelva a una IP privada, de bucle
 * o de metadatos, y redirecciones seguidas a mano para revisar cada una.
 */

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 1_500_000;
const MAX_PAGE_CHARS = 20_000;
const MAX_TOTAL_CHARS = 55_000;
const MAX_REDIRECTS = 4;
const USER_AGENT = "Mozilla/5.0 (compatible; allok-demo-builder/1.0; +https://allok.fun)";

export type SitePage = { url: string; text: string };

/**
 * ¿Es una IP a la que el servidor no debe ir? Privadas, de bucle, enlace
 * local (incluida la de metadatos de la nube), CGNAT, multicast y reservadas.
 */
export function isPrivateAddress(ip: string): boolean {
  const v4 = ip.toLowerCase().startsWith("::ffff:") ? ip.slice(7) : ip;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) {
    const [a = 0, b = 0] = v4.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = ip.toLowerCase();
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") || v6.startsWith("ff");
}

export type Resolver = (host: string) => Promise<string[]>;

const defaultResolve: Resolver = async (host) => (await lookup(host, { all: true })).map((a) => a.address);

/** ¿Se puede ir a esa URL? http(s), sin credenciales, puerto estándar y DNS público. */
export async function isPublicUrl(url: URL, resolve: Resolver = defaultResolve): Promise<boolean> {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (url.port && url.port !== "80" && url.port !== "443") return false;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) return false;
  try {
    const addresses = isIP(host) ? [host] : await resolve(host);
    return addresses.length > 0 && addresses.every((a) => !isPrivateAddress(a));
  } catch {
    return false;
  }
}

export type FetchDeps = { fetch?: typeof fetch; resolve?: Resolver };

/** El HTML de una página, con tope de tiempo y de tamaño. `null` si no es HTML, falla o va a una red interna. */
export async function fetchHtml(url: string, deps: FetchDeps = {}): Promise<{ url: string; html: string } | null> {
  const doFetch = deps.fetch ?? fetch;
  const resolve = deps.resolve ?? defaultResolve;
  let current: URL;
  try {
    current = new URL(url);
  } catch {
    return null;
  }
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await isPublicUrl(current, resolve))) return null;
      const res = await doFetch(current.toString(), {
        headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml", "accept-language": "es-MX,es;q=0.9" },
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        await res.body?.cancel().catch(() => {});
        if (!location) return null;
        current = new URL(location, current);
        continue;
      }
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
      return { url: current.toString(), html };
    }
    return null;
  } catch {
    return null;
  }
}

/** La portada y hasta `extraPages` páginas obvias (servicios, precios, contacto), con tope total de texto. */
export async function readSite(website: string, deps: FetchDeps = {}, extraPages = 3): Promise<SitePage[]> {
  const home = await fetchHtml(website, deps);
  if (!home) return [];
  const pages = [{ url: home.url, text: htmlToText(home.html).slice(0, MAX_PAGE_CHARS) }];
  const extra = await Promise.all(pickUsefulLinks(home.html, home.url, extraPages).map((u) => fetchHtml(u, deps)));
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
export async function extractProfile(
  lead: Pick<LeadInput, "name" | "sector" | "city" | "country">,
  pages: SitePage[],
  timeoutMs = 60_000,
): Promise<DemoProfile | null> {
  const prompt = extractionPrompt({ name: lead.name, sector: lead.sector, city: lead.city, country: lead.country, pages });
  const messages: LlmMessage[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: prompt },
  ];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const reply = await chatCompletion(messages, { maxTokens: 2000, temperature: 0, timeoutMs, json: true });
      const profile = parseProfileResponse(reply);
      if (profile) return profile;
      messages.push(
        { role: "assistant", content: reply },
        { role: "user", content: "Esa respuesta no es un JSON válido con la forma pedida. Responde SOLO el objeto JSON, sin texto alrededor." },
      );
    } catch (error) {
      console.warn(`Demo profile, attempt ${attempt + 1}: ${(error as Error).message}`);
    }
  }
  return null;
}

export type BuildResult =
  | { ok: true; profile: DemoProfile; dropped: string[]; pages: SitePage[] }
  | { ok: false; reason: "unreadable" | "model" | "empty"; dropped?: string[] };

/** Leer la web, extraer el perfil y podar lo que no está en el texto. Sin guardar nada. */
export async function buildProfile(
  lead: Pick<LeadInput, "name" | "sector" | "city" | "country" | "website">,
  options: { deps?: FetchDeps; extraPages?: number; timeoutMs?: number } = {},
): Promise<BuildResult> {
  const pages = await readSite(lead.website, options.deps, options.extraPages);
  if (pages.length === 0) return { ok: false, reason: "unreadable" };
  const extracted = await extractProfile(lead, pages, options.timeoutMs);
  if (!extracted) return { ok: false, reason: "model" };
  const { profile, dropped } = groundProfile(extracted, pages.map((p) => p.text).join("\n"));
  profile.sourceUrls = pages.map((p) => p.url).slice(0, 10);
  if (!isUsableProfile(profile)) return { ok: false, reason: "empty", dropped };
  return { ok: true, profile, dropped, pages };
}
