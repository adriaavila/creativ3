import { NextRequest, NextResponse } from "next/server";
import { safeMetaError, sendPreparedTextMessage } from "@/lib/meta/server";

export async function POST(req: NextRequest) {
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
  const businessToken = stringField(value.business_token);
  const to = stringField(value.to);
  const body = stringField(value.body) ?? "WhatsApp test message from Servicios Creativos.";

  if (!phoneNumberId || !businessToken || !to) {
    return NextResponse.json(
      {
        error: "phone_number_id, business_token, and to are required.",
        mode: "Use this only from a secure server-side tool or n8n workflow. Do not call it from the browser.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await sendPreparedTextMessage({
      phoneNumberId,
      businessToken,
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
