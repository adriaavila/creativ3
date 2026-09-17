import { authorizeOps } from "@/lib/ops-auth";
import {
  getWhatsAppConnectionByPhoneNumberId,
  getWhatsAppProviderConnectionForStoredChannel,
} from "@/lib/whatsapp-connections-db";
import { parseExternalRef } from "@/lib/handover/destinations";
import { handoverConnectionToDestination } from "@/lib/handover/execute";

export const dynamic = "force-dynamic";

const META_ID = /^\d{5,25}$/;
const SLUG = /^[a-z0-9][a-z0-9._-]{1,39}$/;

/** Entrega un número al destino elegido, con el mismo handover que Embedded Signup. */
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
  const destination = typeof body?.destination === "string" ? body.destination.trim().toLowerCase() : "";
  if (!SLUG.test(destination)) return Response.json({ error: "Elegí un destino válido." }, { status: 400 });

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

  const result = await handoverConnectionToDestination({
    destinationSlug: destination,
    externalRef,
    client: connection.client,
    wabaId: provider.wabaId,
    phoneNumberId: provider.phoneNumberId,
    businessId: connection.businessId,
    businessToken: provider.businessToken,
    connectionMode: provider.mode,
    status: connection.status,
    displayPhoneNumber: connection.displayPhoneNumber,
    verifiedName: connection.verifiedName,
  });

  if (!result.ok) {
    return Response.json(
      { error: result.error, step: result.step, credentials_delivered: result.credentialsDelivered },
      { status: result.status && result.status >= 400 ? result.status : 502 },
    );
  }

  const restored = destination === "allok";
  return Response.json({
    ok: true,
    restored,
    crm: {
      provider: restored ? "allok" : destination,
      organization_id: restored ? null : externalRef,
      organization_name: restored ? null : result.organizationName,
      webhook_url: result.webhookUrl,
      connected_at: restored ? null : new Date().toISOString(),
      credentials_delivered: result.credentialsDelivered,
    },
  });
}
