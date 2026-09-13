import { NextRequest, NextResponse } from "next/server";
import { bearerMatches } from "@/lib/handover/bearer";
import { handoverSaaSTenant } from "@/lib/handover/tenant";
import {
  getLatestWhatsAppConnectionForClient,
  getWhatsAppProviderConnection,
} from "@/lib/whatsapp-connections-db";

export const dynamic = "force-dynamic";

/**
 * Reintenta la entrega de un número ya conectado a su espacio de Vocero.
 *
 * El alta pública hace la entrega dentro del intercambio del Embedded Signup,
 * que es el peor momento para fallar: el número ya quedó conectado en Meta y el
 * cliente está mirando una pantalla que dice que algo salió mal. Sin este
 * reintento la única salida era reconectar el número, que es justo lo que no
 * hay que hacer.
 *
 * Es idempotente por construcción — `handoverSaaSTenant` vuelve a empujar las
 * mismas credenciales y Meta acepta el mismo `override_callback_uri` las veces
 * que haga falta — así que repetirlo no rompe nada.
 */
export async function POST(request: NextRequest) {
  if (!bearerMatches(request.headers.get("authorization"), process.env.ALLOK_SAAS_LINK_SECRET?.trim())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const input = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const workspace = typeof input?.workspace === "string" ? input.workspace.trim() : "";
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(workspace)) {
    return NextResponse.json({ error: "A valid workspace is required." }, { status: 400 });
  }

  const connection = await getLatestWhatsAppConnectionForClient(workspace);
  if (!connection) {
    return NextResponse.json(
      { error: "Ese espacio no tiene ningún número conectado en Allok.", step: "config" },
      { status: 404 },
    );
  }

  // El token descifrado sólo existe dentro de esta petición, y se busca acotado
  // al workspace: el `phone_number_id` sale de la fila, pero el espacio lo dijo
  // quien llama.
  const provider = await getWhatsAppProviderConnection(connection.phoneNumberId, workspace);
  if (!provider) {
    return NextResponse.json(
      { error: "La conexión ya no tiene token guardado; hay que reconectar el número.", step: "credentials" },
      { status: 409 },
    );
  }

  const result = await handoverSaaSTenant({
    workspace,
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
    return NextResponse.json({ error: result.error, step: result.step }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    webhook_url: result.webhookUrl,
    organization_name: result.organizationName,
  });
}
