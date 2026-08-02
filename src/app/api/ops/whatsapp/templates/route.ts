import { MetaGraphRequestError, listMessageTemplates } from "@/lib/meta/server";
import { authorizeOps } from "@/lib/ops-auth";
import { getWhatsAppProviderConnection } from "@/lib/whatsapp-connections-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const connectionId = new URL(request.url).searchParams.get("connectionId")?.trim();
  if (!connectionId) {
    return Response.json(
      { templates: [], reason: "connectionId es obligatorio." },
      { status: 400, headers: noStore },
    );
  }

  const connection = await getWhatsAppProviderConnection(connectionId);
  if (!connection) {
    return Response.json(
      { templates: [], reason: "No hay una conexión oficial de WhatsApp activa." },
      { headers: noStore },
    );
  }

  try {
    const templates = await listMessageTemplates({
      wabaId: connection.wabaId,
      businessToken: connection.businessToken,
    });
    return Response.json({ templates }, { headers: noStore });
  } catch (error) {
    if (error instanceof MetaGraphRequestError) {
      return Response.json(
        { templates: [], reason: "No se pudieron cargar las plantillas aprobadas." },
        { headers: noStore },
      );
    }

    return Response.json(
      { error: "No se pudieron cargar las plantillas de WhatsApp." },
      { status: 500, headers: noStore },
    );
  }
}
