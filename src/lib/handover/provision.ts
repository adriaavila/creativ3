/**
 * Empuje de credenciales a la app destino.
 *
 * Opcional: sólo las apps que exponen un endpoint de provisión lo usan. Las
 * demás reciben el token a mano desde Ops. En los dos casos el orden es el
 * mismo y no es negociable: primero las credenciales, después el webhook. Si
 * se redirige el webhook antes, los mensajes llegan a una app que todavía no
 * conoce ese número y se pierden.
 */
import { normalizeWebhookUrl } from "./destinations";

export type ProvisionResult = {
  ok: boolean;
  status: number;
  /** Nombre con el que la app destino conoce a este cliente, si lo devuelve. */
  organizationName: string | null;
  /** La app puede corregir a qué URL quiere sus webhooks. */
  webhookUrl: string | null;
  error: string | null;
};

export async function pushCredentials(input: {
  url: string;
  secret: string;
  /** La referencia del número dentro de esa app (en REI, su organization_id). */
  externalRef: string | null;
  client: string;
  businessId: string | null;
  wabaId: string;
  phoneNumberId: string;
  token: string;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  connectionMode: "META_CLOUD_API" | "META_COEXISTENCE";
  status: string;
}): Promise<ProvisionResult> {
  let response: Response;
  try {
    response = await fetch(input.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organization_id: input.externalRef,
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
      error: error instanceof Error ? error.message : "La app destino no respondió.",
    };
  }

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    // El mensaje de la app destino es útil ("esa organización no existe"); el
    // token nunca viaja de vuelta, así que se puede mostrar tal cual en Ops.
    return {
      ok: false,
      status: response.status,
      organizationName: null,
      webhookUrl: null,
      error: typeof body.message === "string" ? body.message : `La app destino respondió ${response.status}.`,
    };
  }

  const webhookUrl = body.webhook_url === undefined ? null : normalizeWebhookUrl(body.webhook_url);
  if (body.webhook_url !== undefined && !webhookUrl) {
    return {
      ok: false,
      status: 502,
      organizationName: null,
      webhookUrl: null,
      error: "La app destino devolvió una URL de webhook inválida; debe usar HTTPS.",
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
