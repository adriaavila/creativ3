import { NextRequest, NextResponse } from "next/server";
import { deregisterPhoneNumber, getExchangeEnv, safeMetaError } from "@/lib/meta/server";

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

  if (!phoneNumberId || !businessToken) {
    return NextResponse.json(
      {
        error: "phone_number_id and business_token are required.",
      },
      { status: 400 },
    );
  }

  const exchangeEnv = getExchangeEnv();
  const graphVersion = exchangeEnv.env?.graphVersion;

  try {
    const result = await deregisterPhoneNumber({
      phoneNumberId,
      businessToken,
      graphVersion,
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

    const message = error instanceof Error ? error.message : "Unknown deregister error.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
