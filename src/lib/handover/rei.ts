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
  wabaId: string;
  phoneNumberId: string;
  token: string;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  isCoexistence: boolean;
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
        waba_id: input.wabaId,
        phone_number_id: input.phoneNumberId,
        token: input.token,
        display_phone_number: input.displayPhoneNumber,
        verified_name: input.verifiedName,
        is_coexistence: input.isCoexistence,
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

  return {
    ok: true,
    status: response.status,
    organizationName: typeof body.organization_name === "string" ? body.organization_name : null,
    webhookUrl: typeof body.webhook_url === "string" ? body.webhook_url : null,
    error: null,
  };
}
