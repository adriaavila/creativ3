/**
 * Los destinos a los que allok entrega un número: la app donde el cliente va a
 * recibir sus mensajes.
 *
 * Un destino es una fila, no una rama en el código ni una variable de entorno.
 * Todos se entregan igual: allok mueve el webhook de esa WABA en Meta y, si el
 * destino tiene endpoint de provisión, le empuja las credenciales antes. REI
 * CRM no es especial; es la primera fila.
 */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { decryptToken, encryptToken } from "@/lib/crypto/token-cipher";

let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for handover destinations.");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

/** Lo que Ops puede ver: nunca incluye el verify token ni el secreto. */
export type DestinationView = {
  slug: string;
  label: string;
  webhookUrl: string;
  provisionUrl: string | null;
  updatedAt: string | null;
};

export type DestinationSecrets = DestinationView & {
  verifyToken: string;
  provisionSecret: string | null;
};

export type DestinationInput = {
  slug: string;
  label: string;
  webhookUrl: string;
  verifyToken: string;
  provisionUrl: string | null;
  provisionSecret: string | null;
};

/**
 * La bandeja de allok es un destino como cualquier otro: entregarle un número
 * es devolverle los webhooks. Sale del entorno, así que existe siempre.
 */
export const DESTINATION_ALLOK = "allok";

const SLUG = /^[a-z0-9][a-z0-9._-]{1,39}$/;
/** Meta lo manda como query param en el GET de verificación: nada de espacios. */
const VERIFY_TOKEN = /^[\w.~-]{8,200}$/;

/** Sólo HTTPS: Meta rechaza cualquier otra cosa, y un token no viaja en claro. */
export function normalizeWebhookUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Meta puede omitir el app id; la URL efectiva sigue siendo verificable. */
export function matchesDestinationSubscription(
  subscription: { id?: string; override_callback_uri?: string | null },
  appId: string | undefined,
  webhookUrl: string,
) {
  return (!subscription.id || !appId || subscription.id === appId)
    && normalizeWebhookUrl(subscription.override_callback_uri) === normalizeWebhookUrl(webhookUrl);
}

/**
 * La referencia del número dentro de la app destino (en REI, su
 * `organization_id`). Opaca para allok: sólo viaja en el paquete de provisión.
 */
export function parseExternalRef(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const ref = value.trim();
  return /^[\w.:-]{1,80}$/.test(ref) ? ref : null;
}

export function parseDestinationInput(body: unknown): { input: DestinationInput } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Cuerpo inválido." };
  const raw = body as Record<string, unknown>;

  const slug = typeof raw.slug === "string" ? raw.slug.trim().toLowerCase() : "";
  if (!SLUG.test(slug)) return { error: "El identificador debe ser a-z, 0-9, punto, guion o guion bajo." };

  const label = typeof raw.label === "string" ? raw.label.trim().slice(0, 80) : "";
  if (!label) return { error: "El destino necesita un nombre." };

  const webhookUrl = normalizeWebhookUrl(raw.webhook_url);
  if (!webhookUrl) return { error: "La URL del webhook debe ser HTTPS." };

  const verifyToken = typeof raw.verify_token === "string" ? raw.verify_token.trim() : "";
  if (!VERIFY_TOKEN.test(verifyToken)) {
    return { error: "El verify token debe tener entre 8 y 200 caracteres, sin espacios." };
  }

  const provisionUrl = raw.provision_url === undefined || raw.provision_url === null || raw.provision_url === ""
    ? null
    : normalizeWebhookUrl(raw.provision_url);
  if (raw.provision_url && !provisionUrl) return { error: "La URL de provisión debe ser HTTPS." };

  const provisionSecret = typeof raw.provision_secret === "string" && raw.provision_secret.trim()
    ? raw.provision_secret.trim()
    : null;
  if (provisionUrl && !provisionSecret) {
    return { error: "Un destino con provisión necesita su secreto para autenticarse." };
  }

  return { input: { slug, label, webhookUrl, verifyToken, provisionUrl, provisionSecret } };
}

export async function listDestinations(): Promise<DestinationView[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT slug, label, webhook_url, provision_url, updated_at
    FROM handover_destinations
    ORDER BY label
  `;
  const stored = rows.map((row) => ({
    slug: String(row.slug),
    label: String(row.label),
    webhookUrl: String(row.webhook_url),
    provisionUrl: row.provision_url ? String(row.provision_url) : null,
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : null,
  }));

  // Los destinos de entorno primero: volver a la bandeja de allok tiene que
  // estar a un clic antes de mover un número, no configurarse después de que
  // algo salga mal.
  const builtIn = [DESTINATION_ALLOK, "rei_crm"]
    .filter((slug) => !stored.some((destination) => destination.slug === slug))
    .map(builtInDestination)
    .filter((destination): destination is DestinationSecrets => destination !== null)
    .map((destination) => ({
      slug: destination.slug,
      label: destination.label,
      webhookUrl: destination.webhookUrl,
      provisionUrl: destination.provisionUrl,
      updatedAt: destination.updatedAt,
    }));

  return [...builtIn, ...stored];
}

/**
 * Los secretos descifrados, sólo para la petición que entrega un número.
 *
 * Si no hay fila, se intenta armar el destino desde el entorno: la bandeja de
 * allok siempre, y REI mientras siga configurado por variables. Guardar la fila
 * gana sobre el entorno.
 */
export async function getDestinationSecrets(slug: string): Promise<DestinationSecrets | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT slug, label, webhook_url, verify_token, provision_url, provision_secret, updated_at
    FROM handover_destinations
    WHERE slug = ${slug}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return builtInDestination(slug);

  return {
    slug: String(row.slug),
    label: String(row.label),
    webhookUrl: String(row.webhook_url),
    verifyToken: decryptToken(String(row.verify_token)),
    provisionUrl: row.provision_url ? String(row.provision_url) : null,
    provisionSecret: row.provision_secret ? decryptToken(String(row.provision_secret)) : null,
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : null,
  };
}

function builtInDestination(slug: string): DestinationSecrets | null {
  if (slug === DESTINATION_ALLOK) return allokDestination();
  if (slug !== "rei_crm") return null;
  const baseUrl = process.env.REI_PROVISION_URL?.trim();
  const secret = process.env.REI_PROVISION_SECRET?.trim();
  const verifyToken = process.env.REI_WEBHOOK_VERIFY_TOKEN?.trim();
  if (!baseUrl || !secret || !verifyToken) return null;

  const webhookUrl = normalizeWebhookUrl(new URL("/api/whatsapp/webhook", baseUrl).toString());
  if (!webhookUrl) return null;

  return {
    slug,
    label: "REI CRM",
    webhookUrl,
    verifyToken,
    provisionUrl: baseUrl,
    provisionSecret: secret,
    updatedAt: null,
  };
}

function allokDestination(): DestinationSecrets | null {
  const webhookUrl = normalizeWebhookUrl(process.env.META_WEBHOOK_CALLBACK_URL);
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN?.trim();
  if (!webhookUrl || !verifyToken) return null;

  return {
    slug: DESTINATION_ALLOK,
    label: "Bandeja allok",
    webhookUrl,
    verifyToken,
    provisionUrl: null,
    provisionSecret: null,
    updatedAt: null,
  };
}

export async function upsertDestination(input: DestinationInput): Promise<DestinationView> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO handover_destinations (
      slug, label, webhook_url, verify_token, provision_url, provision_secret, updated_at
    )
    VALUES (
      ${input.slug}, ${input.label}, ${input.webhookUrl}, ${encryptToken(input.verifyToken)},
      ${input.provisionUrl}, ${input.provisionSecret ? encryptToken(input.provisionSecret) : null}, now()
    )
    ON CONFLICT (slug) DO UPDATE SET
      label = EXCLUDED.label,
      webhook_url = EXCLUDED.webhook_url,
      verify_token = EXCLUDED.verify_token,
      provision_url = EXCLUDED.provision_url,
      provision_secret = EXCLUDED.provision_secret,
      updated_at = now()
    RETURNING slug, label, webhook_url, provision_url, updated_at
  `;
  const row = rows[0];
  return {
    slug: String(row.slug),
    label: String(row.label),
    webhookUrl: String(row.webhook_url),
    provisionUrl: row.provision_url ? String(row.provision_url) : null,
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : null,
  };
}
