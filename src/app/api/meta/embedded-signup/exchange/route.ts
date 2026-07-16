import { NextRequest, NextResponse } from "next/server";
import {
  buildTokenMetadata,
  debugBusinessToken,
  exchangeCodeForBusinessToken,
  forwardConnectedAccountToN8n,
  getExchangeEnv,
  getMissingTokenPermissions,
  getWhatsAppPhoneProfile,
  META_SIGNUP_STATE_COOKIE,
  safeMetaError,
  subscribeWabaToApp,
  validateSignupPayload,
} from "@/lib/meta/server";
import { upsertWhatsAppConnection } from "@/lib/whatsapp-connections-db";

export async function POST(req: NextRequest) {
  let input: unknown;

  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { payload, errors } = validateSignupPayload(input);
  if (!payload) {
    return NextResponse.json({ error: "Invalid signup payload.", details: errors }, { status: 400 });
  }

  const expectedState = req.cookies.get(META_SIGNUP_STATE_COOKIE)?.value;
  if (!expectedState || payload.state !== expectedState) {
    return NextResponse.json(
      { error: "The Embedded Signup session is missing or expired. Reload and try again." },
      { status: 403 },
    );
  }

  const exchangeEnv = getExchangeEnv();
  if (!exchangeEnv.env) {
    return NextResponse.json(
      {
        error: "Meta Embedded Signup server environment is incomplete.",
        missing_env: exchangeEnv.missing,
      },
      { status: 500 },
    );
  }

  try {
    const tokenExchange = await exchangeCodeForBusinessToken(payload.code, exchangeEnv.env);
    const businessToken = tokenExchange.access_token as string;
    const debugData = await debugBusinessToken(businessToken, exchangeEnv.env);

    if (debugData.is_valid === false) {
      return NextResponse.json(
        {
          error: "Meta returned an invalid business token.",
          token_metadata: buildTokenMetadata(tokenExchange, debugData),
        },
        { status: 502 },
      );
    }

    const missingPermissions = getMissingTokenPermissions(debugData);
    if (missingPermissions.length > 0) {
      return NextResponse.json(
        {
          error: "Meta business token is missing required permissions.",
          missing_permissions: missingPermissions,
          token_metadata: buildTokenMetadata(tokenExchange, debugData),
        },
        { status: 403 },
      );
    }

    const subscribeResult = await subscribeWabaToApp(
      payload.waba_id,
      businessToken,
      exchangeEnv.env.graphVersion,
    );

    // Coexistence: the number is already registered by the WhatsApp Business app.
    // Calling POST /{phone-number-id}/register here would take it off the app.
    const connectedAt = new Date().toISOString();
    const tokenMetadata = buildTokenMetadata(tokenExchange, debugData);
    const phoneProfile = await getWhatsAppPhoneProfile(
      payload.phone_number_id,
      businessToken,
      exchangeEnv.env.graphVersion,
    );
    const n8nResult = await forwardConnectedAccountToN8n({
      payload,
      businessToken,
      tokenMetadata,
      subscribeResult,
      env: exchangeEnv.env,
      connectedAt,
    });

    if (!n8nResult.ok) {
      return NextResponse.json(
        {
          error: "Connected account was authorized, but n8n storage failed.",
          waba_subscribe_succeeded: subscribeResult.success === true,
          n8n: {
            reached: true,
            status: n8nResult.status,
            body: n8nResult.body,
          },
        },
        { status: 502 },
      );
    }

    await upsertWhatsAppConnection({
      payload,
      businessToken,
      tokenMetadata,
      phoneProfile,
      status: subscribeResult.success ? "subscribed" : "connected",
      connectedAt,
    });

    const response = NextResponse.json({
      ok: true,
      connected_account: {
        waba_id: payload.waba_id,
        phone_number_id: payload.phone_number_id,
        business_id: payload.business_id,
        display_phone_number: phoneProfile.display_phone_number,
        verified_name: phoneProfile.verified_name,
        connected_at: connectedAt,
        status: subscribeResult.success ? "subscribed" : "connected",
      },
      token_metadata: tokenMetadata,
      waba_subscribe_succeeded: subscribeResult.success === true,
      n8n: {
        reached: true,
        status: n8nResult.status,
      },
      test_message: {
        endpoint: "/api/meta/embedded-signup/test-message",
        mode: "server-side only; supply a stored business token from your secure backend or n8n",
      },
    });
    response.cookies.set(META_SIGNUP_STATE_COOKIE, "", {
      maxAge: 0,
      path: "/api/meta/embedded-signup",
    });
    return response;
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

    const message = error instanceof Error ? error.message : "Unknown exchange error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
