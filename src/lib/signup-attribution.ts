/**
 * De dónde vino quien se registra. El alta pasa en el CRM
 * (`CRM_APP_URL/register`), en otro dominio: lo que trajo a la persona a
 * allok.fun (los utm de un anuncio, el `fbclid`, la página donde aterrizó) se
 * pierde en el salto si este sitio no lo reenvía en la URL del registro, que
 * es de donde el CRM lo lee.
 *
 * Aquí viven las piezas puras; `SignupAttribution` las conecta al navegador
 * (localStorage y el clic).
 */
import { CRM_APP_URL } from "@/lib/plans";

/** Lo que se toma de la URL de llegada. Nada fuera de esta lista. */
export const ATTRIBUTION_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
  "fbclid",
  "gclid",
] as const;

/** Lo que viaja al registro: lo de la URL más lo que calcula este sitio. */
export const FORWARDED_PARAMS = [...ATTRIBUTION_PARAMS, "landing", "referrer"] as const;

export type ForwardedParam = (typeof FORWARDED_PARAMS)[number];
export type Origen = Partial<Record<ForwardedParam, string>>;

/** La llave del primer toque en localStorage. */
export const STORAGE_KEY = "allok_origen";

// Un utm_content de 2 KB no es atribución, es basura en la URL del registro.
const MAX_VALUE_LENGTH = 200;

function clean(value: string | null | undefined): string | undefined {
  const trimmed = (value ?? "").trim().slice(0, MAX_VALUE_LENGTH);
  return trimmed ? trimmed : undefined;
}

/** Los parámetros de atribución presentes en un query string, y solo esos. */
export function pickAttribution(search: string | URLSearchParams): Origen {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const out: Origen = {};
  for (const key of ATTRIBUTION_PARAMS) {
    const value = clean(params.get(key));
    if (value) out[key] = value;
  }
  return out;
}

function isOwnHost(host: string, currentHost?: string): boolean {
  return host === "allok.fun" || host.endsWith(".allok.fun") || (!!currentHost && host === currentHost);
}

/**
 * El hostname del referrer cuando es de fuera (Google, Instagram…). Una
 * navegación dentro de allok.fun, o del propio CRM, no es un origen.
 */
export function externalReferrerHost(referrer: string, currentHost?: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (!host || isOwnHost(host, currentHost?.toLowerCase())) return undefined;
    return host;
  } catch {
    return undefined;
  }
}

/**
 * El primer toque de esta visita, o null si la URL no trae nada de la lista
 * blanca: una visita directa no pisa ni crea un origen.
 */
export function buildFirstTouch(input: {
  search: string;
  pathname: string;
  referrer: string;
  currentHost?: string;
}): Origen | null {
  const picked = pickAttribution(input.search);
  if (Object.keys(picked).length === 0) return null;
  const origen: Origen = { ...picked };
  const landing = clean(input.pathname);
  if (landing) origen.landing = landing;
  const referrer = externalReferrerHost(input.referrer, input.currentHost);
  if (referrer) origen.referrer = referrer;
  return origen;
}

/** Lee lo guardado sin confiar en ello: JSON roto o llaves ajenas se ignoran. */
export function parseStoredOrigen(raw: string | null): Origen {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    const out: Origen = {};
    for (const key of FORWARDED_PARAMS) {
      const value = (data as Record<string, unknown>)[key];
      const cleaned = typeof value === "string" ? clean(value) : undefined;
      if (cleaned) out[key] = cleaned;
    }
    return out;
  } catch {
    return {};
  }
}

const REGISTER_PREFIX = `${CRM_APP_URL}/register`;

/** ¿Este href lleva al registro del CRM? (`/register`, `/register?…`, no `/registered`). */
export function isRegisterHref(href: string): boolean {
  if (!href.startsWith(REGISTER_PREFIX)) return false;
  const next = href.charAt(REGISTER_PREFIX.length);
  return next === "" || next === "?" || next === "#" || next === "/";
}

/**
 * Agrega el origen a la URL del registro. Lo que el enlace ya trae gana
 * (`plan=` y cualquier utm puesto a mano no se pisan).
 */
export function mergeIntoRegisterUrl(href: string, origen: Origen): string {
  if (!isRegisterHref(href)) return href;
  const url = new URL(href);
  for (const key of FORWARDED_PARAMS) {
    const value = origen[key];
    if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return url.toString();
}
