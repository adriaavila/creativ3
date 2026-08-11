import { NextRequest, NextResponse } from "next/server";
import { authorizeOps } from "@/lib/ops-auth";
import { HANDOVER_BLOCKER_LABELS, handoverBlocker } from "@/lib/clients";
import { listClients, recordHandover } from "@/lib/clients-db";
import { getWhatsAppProviderConnectionForStoredChannel } from "@/lib/whatsapp-connections-db";
import { getDestinationSecrets } from "@/lib/handover/destinations";
import { pushCredentials } from "@/lib/handover/provision";
import { getGraphVersion, safeMetaError, subscribeWabaToApp } from "@/lib/meta/server";

export const dynamic = "force-dynamic";

/**
 * Entrega el número de un cliente a la app donde va a trabajar.
 *
 * Es una acción explícita del operador y no un paso automático del Embedded
 * Signup: la ruta de alta ya es el momento frágil del onboarding (el cliente
 * está mirando la pantalla), y la entrega necesita datos que viven fuera de
 * Meta. Al ser explícita también es reintentable, y sirve para los clientes
 * que ya estaban conectados desde antes.
 *
 * El destino sale del registro del cliente; el resto lo hace igual que la
 * entrega por número. Idempotente: Meta acepta el mismo override_callback_uri
 * las veces que haga falta.
 */
export async function POST(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const { slug } = await context.params;
  const client = (await listClients().catch(() => [])).find((entry) => entry.slug === slug);
  if (!client) return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });

  const blocker = handoverBlocker(client);
  if (blocker) {
    return NextResponse.json({ error: HANDOVER_BLOCKER_LABELS[blocker] }, { status: 409 });
  }

  const destination = await getDestinationSecrets(client.destination);
  if (!destination) {
    return NextResponse.json(
      { error: `El destino ${client.destination} no está configurado.` },
      { status: 503 },
    );
  }
  if (destination.provisionUrl && !client.destinationRef) {
    return NextResponse.json(
      { error: `${destination.label} necesita la referencia del cliente en su sistema.` },
      { status: 409 },
    );
  }

  // El token descifrado sólo existe dentro de esta petición.
  const connection = await getWhatsAppProviderConnectionForStoredChannel(client.phoneNumberId!);
  if (!connection) {
    return NextResponse.json(
      { error: "La conexión ya no tiene token guardado; hay que reconectar el número." },
      { status: 409 },
    );
  }

  let organizationName = destination.label;
  let webhookUri = destination.webhookUrl;

  if (destination.provisionUrl && destination.provisionSecret) {
    const provisioned = await pushCredentials({
      url: destination.provisionUrl,
      secret: destination.provisionSecret,
      externalRef: client.destinationRef,
      client: client.slug,
      businessId: null,
      wabaId: connection.wabaId,
      phoneNumberId: connection.phoneNumberId,
      token: connection.businessToken,
      displayPhoneNumber: client.displayPhoneNumber,
      verifiedName: client.name,
      connectionMode: connection.mode,
      status: client.connectionStatus ?? "connected",
    });
    if (!provisioned.ok) {
      return NextResponse.json(
        { error: provisioned.error, step: "credenciales" },
        { status: provisioned.status >= 400 && provisioned.status < 600 ? provisioned.status : 502 },
      );
    }
    organizationName = provisioned.organizationName ?? destination.label;
    webhookUri = provisioned.webhookUrl ?? destination.webhookUrl;
  }

  // Recién ahora se mueve el webhook: si esto falla, la app destino ya tiene el
  // token y el operador puede reintentar sin dejar mensajes cayendo en el vacío.
  try {
    await subscribeWabaToApp(connection.wabaId, connection.businessToken, getGraphVersion(), {
      callbackUri: webhookUri,
      verifyToken: destination.verifyToken,
    });
  } catch (error) {
    const metaError = safeMetaError(error);
    return NextResponse.json(
      {
        error:
          metaError && "message" in metaError.body
            ? (metaError.body.message ?? "Meta rechazó la redirección del webhook.")
            : "Meta rechazó la redirección del webhook.",
        step: "webhook",
        credentials_delivered: Boolean(destination.provisionUrl),
      },
      { status: 502 },
    );
  }

  await recordHandover({
    slug,
    wabaId: connection.wabaId,
    phoneNumberId: connection.phoneNumberId,
    webhookUri,
  });

  return NextResponse.json({
    ok: true,
    destination: destination.slug,
    organization_name: organizationName,
    webhook_url: webhookUri,
    credentials_delivered: Boolean(destination.provisionUrl),
  });
}
