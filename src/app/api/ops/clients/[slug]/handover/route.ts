import { NextRequest, NextResponse } from "next/server";
import { authorizeOps } from "@/lib/ops-auth";
import { HANDOVER_BLOCKER_LABELS, handoverBlocker } from "@/lib/clients";
import { listClients, recordHandover } from "@/lib/clients-db";
import { getWhatsAppProviderConnectionForStoredChannel } from "@/lib/whatsapp-connections-db";
import { getReiHandoverEnv, provisionReiConnection } from "@/lib/handover/rei";
import { getGraphVersion, safeMetaError, subscribeWabaToApp } from "@/lib/meta/server";

export const dynamic = "force-dynamic";

/**
 * Entrega el número de un cliente a la app donde va a trabajar.
 *
 * Es una acción explícita del operador y no un paso automático del Embedded
 * Signup: la ruta de alta ya es el momento frágil del onboarding (el cliente
 * está mirando la pantalla), y la entrega necesita un dato que vive fuera de
 * Meta — el organization_id en REI. Al ser explícita también es reintentable,
 * y sirve para los clientes que ya estaban conectados desde antes.
 *
 * Idempotente: REI hace upsert por organización y Meta acepta el mismo
 * override_callback_uri las veces que haga falta.
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

  const env = getReiHandoverEnv();
  if (env.missing.length > 0) {
    return NextResponse.json(
      { error: `Falta configurar ${env.missing.join(", ")}.` },
      { status: 503 },
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

  const provisioned = await provisionReiConnection({
    organizationId: client.destinationRef!,
    wabaId: connection.wabaId,
    phoneNumberId: connection.phoneNumberId,
    token: connection.businessToken,
    displayPhoneNumber: client.displayPhoneNumber,
    verifiedName: client.name,
    isCoexistence: connection.mode === "META_COEXISTENCE",
  });
  if (!provisioned.ok) {
    return NextResponse.json(
      { error: provisioned.error, step: "credenciales" },
      { status: provisioned.status >= 400 && provisioned.status < 600 ? provisioned.status : 502 },
    );
  }

  // Recién ahora se mueve el webhook: si esto falla, REI ya tiene el token y el
  // operador puede reintentar sin dejar mensajes cayendo en el vacío.
  const webhookUri = provisioned.webhookUrl ?? new URL("/api/whatsapp/webhook", env.baseUrl!).toString();
  try {
    await subscribeWabaToApp(connection.wabaId, connection.businessToken, getGraphVersion(), {
      callbackUri: webhookUri,
      verifyToken: env.verifyToken!,
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
        credentials_delivered: true,
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
    organization_name: provisioned.organizationName,
    webhook_url: webhookUri,
  });
}
