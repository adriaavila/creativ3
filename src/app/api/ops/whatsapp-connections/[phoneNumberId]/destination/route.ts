import { authorizeOps } from "@/lib/ops-auth";
import {
  clearWhatsAppCrmHandover,
  getWhatsAppConnectionByPhoneNumberId,
  getWhatsAppProviderConnectionForStoredChannel,
  recordWhatsAppCrmHandover,
} from "@/lib/whatsapp-connections-db";
import {
  DESTINATION_ALLOK,
  getDestinationSecrets,
  normalizeWebhookUrl,
  parseExternalRef,
} from "@/lib/handover/destinations";
import { pushCredentials } from "@/lib/handover/provision";
import {
  getGraphVersion,
  listWabaSubscribedApps,
  safeMetaError,
  subscribeWabaToApp,
} from "@/lib/meta/server";

export const dynamic = "force-dynamic";

const META_ID = /^\d{5,25}$/;
const SLUG = /^[a-z0-9][a-z0-9._-]{1,39}$/;

/**
 * Entrega este número a un destino: mueve sus webhooks a la app donde el
 * cliente trabaja.
 *
 * Un solo camino para todos los destinos. Lo único que cambia entre uno y otro
 * es si la app tiene endpoint de provisión: con él allok le empuja el token
 * antes de mover el webhook; sin él, el operador lo entrega desde `/token`.
 *
 * Idempotente: Meta acepta el mismo override_callback_uri las veces que haga
 * falta, así que reentregar es seguro.
 */
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

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const slug = typeof body?.destination === "string" ? body.destination.trim().toLowerCase() : "";
  if (!SLUG.test(slug)) return Response.json({ error: "Elegí un destino válido." }, { status: 400 });

  const externalRef = body?.external_ref === undefined || body?.external_ref === null || body?.external_ref === ""
    ? null
    : parseExternalRef(body.external_ref);
  if (body?.external_ref && !externalRef) {
    return Response.json({ error: "La referencia del cliente en esa app no es válida." }, { status: 400 });
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

  const destination = await getDestinationSecrets(slug);
  if (!destination) {
    return Response.json({ error: "Ese destino no está configurado." }, { status: 404 });
  }
  if (destination.provisionUrl && !externalRef) {
    return Response.json(
      { error: `${destination.label} necesita la referencia del cliente en su sistema.` },
      { status: 400 },
    );
  }

  // Preflight: evita entregar un token vencido y descubrirlo después de mover el webhook.
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

  let organizationName: string | null = destination.label;
  let webhookUri = destination.webhookUrl;
  let credentialsDelivered = false;

  if (destination.provisionUrl && destination.provisionSecret) {
    const provisioned = await pushCredentials({
      url: destination.provisionUrl,
      secret: destination.provisionSecret,
      externalRef,
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
    credentialsDelivered = true;
    organizationName = provisioned.organizationName ?? destination.label;
    webhookUri = provisioned.webhookUrl ?? destination.webhookUrl;
  }

  try {
    const result = await subscribeWabaToApp(provider.wabaId, provider.businessToken, getGraphVersion(), {
      callbackUri: webhookUri,
      verifyToken: destination.verifyToken,
    });
    if (result.success !== true) throw new Error("subscription_not_confirmed");
  } catch (error) {
    return Response.json(
      {
        error: metaErrorMessage(error, `Meta rechazó el webhook de ${destination.label}.`),
        step: "webhook",
        credentials_delivered: credentialsDelivered,
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
        credentials_delivered: credentialsDelivered,
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
        error: `Meta aceptó la operación, pero el GET de verificación no confirmó el callback de ${destination.label}.`,
        step: "verificacion",
        credentials_delivered: credentialsDelivered,
        webhook_configured: true,
      },
      { status: 502 },
    );
  }

  const connectedAt = new Date().toISOString();
  const restored = destination.slug === DESTINATION_ALLOK;
  try {
    // Volver a la bandeja de allok no es una entrega: se borra el registro en
    // vez de escribir uno que diga que el número está en otra parte.
    await (restored
      ? clearWhatsAppCrmHandover({ wabaId: provider.wabaId, phoneNumberId: provider.phoneNumberId })
      : recordWhatsAppCrmHandover({
        wabaId: provider.wabaId,
        phoneNumberId: provider.phoneNumberId,
        provider: destination.slug,
        organizationId: externalRef,
        organizationName,
        webhookUri,
        connectedAt,
      }));
  } catch {
    return Response.json(
      {
        error: "El destino y Meta quedaron configurados, pero Allok no pudo guardar el resultado. Reintenta la entrega.",
        step: "persistencia",
        credentials_delivered: credentialsDelivered,
        webhook_configured: true,
        webhook_verified: true,
      },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    restored,
    crm: {
      provider: destination.slug,
      organization_id: restored ? null : externalRef,
      organization_name: restored ? null : organizationName,
      webhook_url: webhookUri,
      connected_at: restored ? null : connectedAt,
      credentials_delivered: credentialsDelivered,
    },
  });
}

function sameUrl(left: unknown, right: string) {
  return normalizeWebhookUrl(left) === normalizeWebhookUrl(right);
}

function metaErrorMessage(error: unknown, fallback: string) {
  const metaError = safeMetaError(error);
  return metaError && "message" in metaError.body
    ? (metaError.body.message ?? fallback)
    : fallback;
}
