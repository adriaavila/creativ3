import { NextRequest, NextResponse } from "next/server";
import { MetaCloudWhatsAppProvider } from "@/lib/meta/cloud-whatsapp-provider";
import { safeMetaError } from "@/lib/meta/server";
import {
  getWhatsAppProviderConnection,
  markWhatsAppConnectionDisconnected,
} from "@/lib/whatsapp-connections-db";
import { authorizeOps } from "@/lib/ops-auth";

export async function POST(request: NextRequest) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const phoneNumberId = stringField(input?.phone_number_id);
  const requestedWorkspace = stringField(input?.workspace);
  const workspace =
    requestedWorkspace && /^[a-zA-Z0-9._-]{1,80}$/.test(requestedWorkspace)
      ? requestedWorkspace
      : authorization.userId;
  if (!phoneNumberId) {
    return NextResponse.json({ error: "phone_number_id is required." }, { status: 400 });
  }

  const connection = await getWhatsAppProviderConnection(phoneNumberId, workspace);
  if (!connection) {
    return NextResponse.json({ error: "Connection not found." }, { status: 404 });
  }

  try {
    const provider = new MetaCloudWhatsAppProvider(async () => connection);
    await provider.disconnect(connection.id);
    await markWhatsAppConnectionDisconnected(connection.wabaId, connection.phoneNumberId);
    return NextResponse.json({ ok: true, mode: connection.mode });
  } catch (error) {
    const metaError = safeMetaError(error);
    return NextResponse.json(
      metaError
        ? { error: "Meta Graph API request failed.", ...metaError }
        : { error: error instanceof Error ? error.message : "Disconnect failed." },
      { status: 502 },
    );
  }
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
