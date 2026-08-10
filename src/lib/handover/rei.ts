/**
 * Entrega de un número conectado a REI CRM (residente).
 *
 * allok es dueño de la app de Meta, así que el alta siempre pasa por acá aunque
 * el cliente después no trabaje en esta bandeja. Entregar significa dos cosas,
 * y las dos tienen que pasar o el cliente queda a medias:
 *
 *   1. REI guarda el token cifrado en su propia tabla (`meta_credentials`), y
 *   2. Meta manda los webhooks de ese WABA al webhook de REI.
 *
 * El orden importa: primero las credenciales. Si se redirige el webhook antes,
 * los mensajes llegan a una app que todavía no conoce ese número y se pierden.
 */

export type ReiHandoverResult = {
  ok: boolean;
  status: number;
  organizationName: string | null;
  /** URL del webhook de REI confirmada por la propia app. */
  webhookUrl: string | null;
  error: string | null;
};

const REI_ORGANIZATION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseReiOrganizationId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const organizationId = value.trim();
  return REI_ORGANIZATION_ID.test(organizationId) ? organizationId : null;
}

export function normalizeCrmWebhookUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getReiHandoverEnv() {
  const baseUrl = process.env.REI_PROVISION_URL?.trim();
  const secret = process.env.REI_PROVISION_SECRET?.trim();
  const verifyToken = process.env.REI_WEBHOOK_VERIFY_TOKEN?.trim();
  const missing = [
    !baseUrl && "REI_PROVISION_URL",
    !secret && "REI_PROVISION_SECRET",
    !verifyToken && "REI_WEBHOOK_VERIFY_TOKEN",
  ].filter(Boolean) as string[];
  return { baseUrl, secret, verifyToken, missing };
}

export async function provisionReiConnection(input: {
  organizationId: string;
  client: string;
  businessId: string | null;
  wabaId: string;
  phoneNumberId: string;
  token: string;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  connectionMode: "META_CLOUD_API" | "META_COEXISTENCE";
  status: string;
}): Promise<ReiHandoverResult> {
  const env = getReiHandoverEnv();
  if (!env.baseUrl || !env.secret) {
    return {
      ok: false,
      status: 503,
      organizationName: null,
      webhookUrl: null,
      error: `Falta configurar ${env.missing.join(", ")}.`,
    };
  }

  let response: Response;
  try {
    response = await fetch(env.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organization_id: input.organizationId,
        client: input.client,
        business_id: input.businessId,
        waba_id: input.wabaId,
        phone_number_id: input.phoneNumberId,
        token: input.token,
        display_phone_number: input.displayPhoneNumber,
        verified_name: input.verifiedName,
        connection_mode: input.connectionMode,
        status: input.status,
        is_coexistence: input.connectionMode === "META_COEXISTENCE",
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    return {
      ok: false,
      status: 502,
      organizationName: null,
      webhookUrl: null,
      error: error instanceof Error ? error.message : "REI no respondió.",
    };
  }

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      organizationName: null,
      webhookUrl: null,
      // El mensaje de REI es útil ("esa organización no existe"); el token nunca
      // viaja de vuelta, así que se puede mostrar tal cual en Ops.
      error: typeof body.message === "string" ? body.message : `REI respondió ${response.status}.`,
    };
  }

  const webhookUrl = body.webhook_url === undefined
    ? null
    : normalizeCrmWebhookUrl(body.webhook_url);
  if (body.webhook_url !== undefined && !webhookUrl) {
    return {
      ok: false,
      status: 502,
      organizationName: null,
      webhookUrl: null,
      error: "El CRM devolvió una URL de webhook inválida; debe usar HTTPS.",
    };
  }

  return {
    ok: true,
    status: response.status,
    organizationName: typeof body.organization_name === "string" ? body.organization_name : null,
    webhookUrl,
    error: null,
  };
}
