import { NextRequest, NextResponse } from "next/server";
import { MetaCloudWhatsAppProvider } from "@/lib/meta/cloud-whatsapp-provider";
import { safeMetaError } from "@/lib/meta/server";
import { getWhatsAppProviderConnection } from "@/lib/whatsapp-connections-db";
import { authorizeOps } from "@/lib/ops-auth";

export async function POST(req: NextRequest) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  let input: unknown;

  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!input || typeof input !== "object") {
    return NextResponse.json({ error: "Payload must be an object." }, { status: 400 });
  }

  const value = input as Record<string, unknown>;
  const phoneNumberId = stringField(value.phone_number_id);
  const to = stringField(value.to);
  const requestedWorkspace = stringField(value.workspace);
  const workspace =
    requestedWorkspace && /^[a-zA-Z0-9._-]{1,80}$/.test(requestedWorkspace)
      ? requestedWorkspace
      : authorization.userId;
  const body = stringField(value.body) ?? "WhatsApp test message from Servicios Creativos.";

  if (!phoneNumberId || !to) {
    return NextResponse.json(
      {
        error: "phone_number_id and to are required.",
      },
      { status: 400 },
    );
  }

  try {
    const connection = await getWhatsAppProviderConnection(phoneNumberId, workspace);
    if (!connection) {
      return NextResponse.json({ error: "Connection not found." }, { status: 404 });
    }
    const provider = new MetaCloudWhatsAppProvider(async () => connection);
    const result = await provider.sendText({
      connectionId: connection.id,
      to,
      body,
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    const metaError = safeMetaError(error);
    if (metaError) {
      return NextResponse.json(
        {
          error: "Meta Graph API request failed.",
          meta_request: metaError.meta_request,
          status: metaError.status,
          body: metaError.body,
        },
        { status: 502 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown test message error.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
