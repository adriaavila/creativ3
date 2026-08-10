import { authorizeOps } from "@/lib/ops-auth";
import {
  getWhatsAppConnectionByPhoneNumberId,
  getWhatsAppProviderConnectionForStoredChannel,
  recordWhatsAppCrmHandover,
} from "@/lib/whatsapp-connections-db";
import {
  getReiHandoverEnv,
  normalizeCrmWebhookUrl,
  parseReiOrganizationId,
  provisionReiConnection,
} from "@/lib/handover/rei";
import {
  getGraphVersion,
  listWabaSubscribedApps,
  safeMetaError,
  subscribeWabaToApp,
} from "@/lib/meta/server";

export const dynamic = "force-dynamic";

const META_ID = /^\d{5,25}$/;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ phoneNumberId: string }> },
) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const { phoneNumberId } = await params;
  if (!META_ID.test(phoneNumberId)) {
    return Response.json({ error: "Phone number ID inválido." }, { status: 400 });
  }

  const body: unknown = await request.json().catch(() => null);
  const organizationId = parseReiOrganizationId(
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).organization_id
      : null,
  );
  if (!organizationId) {
    return Response.json({ error: "El organization_id del CRM debe ser un UUID válido." }, { status: 400 });
  }

  const connection = await getWhatsAppConnectionByPhoneNumberId(phoneNumberId);
  if (!connection) return Response.json({ error: "Conexión no encontrada." }, { status: 404 });
  if (connection.status === "deauthorized") {
    return Response.json({ error: "El número está desautorizado; hay que repetir el onboarding." }, { status: 409 });
  }

  const provider = await getWhatsAppProviderConnectionForStoredChannel(connection.phoneNumberId);
  if (!provider) {
    return Response.json(
      { error: "La conexión no tiene un business_token disponible; hay que repetir el onboarding." },
      { status: 409 },
    );
  }

  const env = getReiHandoverEnv();
  if (env.missing.length > 0) {
    return Response.json({ error: `Falta configurar ${env.missing.join(", ")}.` }, { status: 503 });
  }

  // Preflight: evita entregar al CRM un token vencido y descubrirlo después de mover el webhook.
  try {
    await listWabaSubscribedApps({
      wabaId: provider.wabaId,
      businessToken: provider.businessToken,
      graphVersion: getGraphVersion(),
    });
  } catch (error) {
    return Response.json(
      { error: metaErrorMessage(error, "Meta rechazó el token del cliente; hay que repetir el onboarding."), step: "token" },
      { status: 409 },
    );
  }

  const provisioned = await provisionReiConnection({
    organizationId,
    client: connection.client ?? connection.verifiedName ?? connection.phoneNumberId,
    businessId: connection.businessId,
    wabaId: provider.wabaId,
    phoneNumberId: provider.phoneNumberId,
    token: provider.businessToken,
    displayPhoneNumber: connection.displayPhoneNumber,
    verifiedName: connection.verifiedName,
    connectionMode: connection.connectionMode,
    status: connection.status,
  });
  if (!provisioned.ok) {
    return Response.json(
      { error: provisioned.error, step: "credenciales" },
      { status: provisioned.status >= 400 && provisioned.status < 600 ? provisioned.status : 502 },
    );
  }

  const webhookUri = provisioned.webhookUrl
    ?? normalizeCrmWebhookUrl(new URL("/api/whatsapp/webhook", env.baseUrl!).toString());
  if (!webhookUri) {
    return Response.json(
      { error: "El CRM no tiene una URL HTTPS válida para recibir webhooks.", step: "webhook" },
      { status: 502 },
    );
  }

  try {
    const result = await subscribeWabaToApp(provider.wabaId, provider.businessToken, getGraphVersion(), {
      callbackUri: webhookUri,
      verifyToken: env.verifyToken!,
    });
    if (result.success !== true) throw new Error("subscription_not_confirmed");
  } catch (error) {
    return Response.json(
      {
        error: metaErrorMessage(error, "Meta rechazó el webhook del CRM."),
        step: "webhook",
        credentials_delivered: true,
      },
      { status: 502 },
    );
  }

  let subscriptions;
  try {
    subscriptions = await listWabaSubscribedApps({
      wabaId: provider.wabaId,
      businessToken: provider.businessToken,
      graphVersion: getGraphVersion(),
    });
  } catch (error) {
    return Response.json(
      {
        error: metaErrorMessage(error, "No se pudo verificar la suscripción en Meta."),
        step: "verificacion",
        credentials_delivered: true,
        webhook_configured: true,
      },
      { status: 502 },
    );
  }

  const appId = process.env.META_APP_ID?.trim();
  const verified = subscriptions.some((subscription) =>
    (!appId || subscription.id === appId)
      && sameUrl(subscription.override_callback_uri, webhookUri),
  );
  if (!verified) {
    return Response.json(
      {
        error: "Meta aceptó la operación, pero el GET de verificación no confirmó el callback del CRM.",
        step: "verificacion",
        credentials_delivered: true,
        webhook_configured: true,
      },
      { status: 502 },
    );
  }

  const connectedAt = new Date().toISOString();
  try {
    await recordWhatsAppCrmHandover({
      wabaId: provider.wabaId,
      phoneNumberId: provider.phoneNumberId,
      organizationId,
      organizationName: provisioned.organizationName,
      webhookUri,
      connectedAt,
    });
  } catch {
    return Response.json(
      {
        error: "El CRM y Meta quedaron configurados, pero Allok no pudo guardar el resultado. Reintenta la entrega.",
        step: "persistencia",
        credentials_delivered: true,
        webhook_configured: true,
        webhook_verified: true,
      },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    crm: {
      organization_id: organizationId,
      organization_name: provisioned.organizationName,
      webhook_url: webhookUri,
      connected_at: connectedAt,
    },
  });
}

function sameUrl(left: unknown, right: string) {
  return normalizeCrmWebhookUrl(left) === normalizeCrmWebhookUrl(right);
}

function metaErrorMessage(error: unknown, fallback: string) {
  const metaError = safeMetaError(error);
  return metaError && "message" in metaError.body
    ? (metaError.body.message ?? fallback)
    : fallback;
}
