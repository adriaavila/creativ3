import { MetaGraphRequestError, listMessageTemplates } from "@/lib/meta/server";
import { authorizeOps, resolveOpsWorkspace } from "@/lib/ops-auth";
import {
  getWhatsAppProviderConnection,
  getWhatsAppProviderConnectionForStoredChannel,
} from "@/lib/whatsapp-connections-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const params = new URL(request.url).searchParams;
  const connectionId = params.get("connectionId")?.trim();
  if (!connectionId) {
    return Response.json(
      { templates: [], reason: "connectionId es obligatorio." },
      { status: 400, headers: noStore },
    );
  }

  // A caller that knows its workspace gets a tenant-scoped lookup. One that does not
  // falls back to session-wide, which is what the single shared ops gate already
  // allows today. ponytail: real isolation arrives with org membership, not here.
  const requestedWorkspace = params.get("workspace");
  const connection = requestedWorkspace
    ? await getWhatsAppProviderConnection(
        connectionId,
        resolveOpsWorkspace(requestedWorkspace, authorization.userId),
      )
    : await getWhatsAppProviderConnectionForStoredChannel(connectionId);
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
