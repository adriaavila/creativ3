import { authorizeOps } from "@/lib/ops-auth";
import { getWhatsAppProviderConnectionForStoredChannel } from "@/lib/whatsapp-connections-db";
import { getGraphVersion, listWabaSubscribedApps, safeMetaError } from "@/lib/meta/server";

export const dynamic = "force-dynamic";

const META_ID = /^\d{5,25}$/;

/**
 * Entrega el business token al operador para que lo cargue en la app del
 * cliente. Es la única salida del token que no es servidor-a-servidor, así que
 * es POST (no se prefetchea ni queda en el historial), pide sesión de Ops y
 * deja rastro en el log. Antes de mostrarlo lo prueba contra Meta: un token
 * muerto pegado en otra app es una noche perdida buscando el error ahí.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ phoneNumberId: string }> },
) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const { phoneNumberId } = await params;
  if (!META_ID.test(phoneNumberId)) {
    return Response.json({ error: "Phone number ID inválido." }, { status: 400 });
  }

  const connection = await getWhatsAppProviderConnectionForStoredChannel(phoneNumberId);
  if (!connection) {
    return Response.json(
      { error: "La conexión no tiene un business_token disponible; hay que repetir el onboarding." },
      { status: 409 },
    );
  }

  try {
    await listWabaSubscribedApps({
      wabaId: connection.wabaId,
      businessToken: connection.businessToken,
      graphVersion: getGraphVersion(),
    });
  } catch (error) {
    const metaError = safeMetaError(error);
    return Response.json(
      {
        error:
          metaError && "message" in metaError.body
            ? (metaError.body.message ?? "Meta rechazó el token guardado.")
            : "Meta rechazó el token guardado; hay que repetir el onboarding.",
      },
      { status: 409 },
    );
  }

  console.info(JSON.stringify({
    event: "whatsapp_token_revealed",
    phone_number_id: connection.phoneNumberId,
    waba_id: connection.wabaId,
    user_id: authorization.userId,
    at: new Date().toISOString(),
  }));

  return Response.json({
    waba_id: connection.wabaId,
    phone_number_id: connection.phoneNumberId,
    access_token: connection.businessToken,
  });
}
