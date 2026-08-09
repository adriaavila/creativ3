import { NextRequest, NextResponse } from "next/server";
import {
  buildTokenMetadata,
  debugBusinessToken,
  exchangeCodeForBusinessToken,
  generateRegistrationPin,
  getExchangeEnv,
  getMissingTokenPermissions,
  getWhatsAppPhoneCoexistenceStatus,
  META_SIGNUP_STATE_COOKIE,
  registerPhoneNumber,
  requestBusinessAppDataSync,
  resolveMetaSignupConnection,
  safeMetaError,
  subscribeWabaToApp,
  validateSignupPayload,
  verifyMetaSignupState,
} from "@/lib/meta/server";
import {
  claimWhatsAppCoexistenceSync,
  getStoredRegistrationPin,
  recordWhatsAppCoexistenceSync,
  upsertWhatsAppConnection,
} from "@/lib/whatsapp-connections-db";
import { authorizeOps } from "@/lib/ops-auth";

export async function POST(req: NextRequest) {
  const authorization = await authorizeOps();

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
  const signupState = verifyMetaSignupState(expectedState);
  if (!expectedState || payload.state !== expectedState || !signupState) {
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

    const ownedPayload = {
      ...payload,
      client: signupState.workspace,
      connection_mode: signupState.connection_mode,
      user_id: authorization.authorized ? authorization.userId : undefined,
      team_id: undefined,
      account_id: undefined,
    };
    const resolved = await resolveMetaSignupConnection({
      payload: ownedPayload,
      debugData,
      businessToken,
      graphVersion: exchangeEnv.env.graphVersion,
    });

    if (!resolved) {
      return NextResponse.json(
        {
          error:
            "Meta authorized the account, but the connected phone number could not be identified automatically.",
        },
        { status: 409 },
      );
    }

    const connectedPayload = resolved.payload;
    const phoneProfile = resolved.phoneProfile;
    const connectedAt = new Date().toISOString();
    const tokenMetadata = buildTokenMetadata(tokenExchange, debugData);
    const connectionMode = connectedPayload.connection_mode ?? "META_COEXISTENCE";

    // Coexistence numbers are already registered by the client's WhatsApp Business
    // app, and POST /{phone_number_id}/register would take the number off it.
    // A plain Cloud API number is the opposite: PENDING and unusable until this
    // call succeeds. Reuse the stored pin when the number was onboarded before —
    // Meta rejects any other value once two-step verification exists.
    let registration: { registered: boolean; alreadyRegistered: boolean } | null = null;
    let registrationError: string | null = null;
    let registrationPin: string | null = null;

    if (connectionMode === "META_CLOUD_API") {
      registrationPin =
        (await getStoredRegistrationPin(
          connectedPayload.waba_id,
          connectedPayload.phone_number_id,
        ).catch(() => null)) ?? generateRegistrationPin();
    }

    // Persist credentials, identifiers and the Cloud API PIN before any Graph
    // mutation. If subscribe/register succeeds but a later database write
    // fails, the operator can still recover using the original encrypted PIN.
    try {
      await upsertWhatsAppConnection({
        payload: connectedPayload,
        businessToken,
        tokenMetadata,
        phoneProfile,
        status:
          connectionMode === "META_CLOUD_API"
            ? "pending_registration"
            : "pending_subscription",
        connectedAt,
        connectionMode,
        onboardingNonce: connectionMode === "META_COEXISTENCE" ? signupState.nonce : null,
        registrationPin,
        registeredAt: null,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            "Meta authorized the number, but the secure connection record could not be stored. No subscription or registration was attempted; retry once storage is back.",
          waba_id: connectedPayload.waba_id,
          phone_number_id: connectedPayload.phone_number_id,
          waba_subscribe_succeeded: false,
          database: { ok: false, error: errorText(error) },
        },
        { status: 502 },
      );
    }

    const subscribeResult = await subscribeWabaToApp(
      connectedPayload.waba_id,
      businessToken,
      exchangeEnv.env.graphVersion,
    );

    if (connectionMode === "META_CLOUD_API" && registrationPin) {
      try {
        registration = await registerPhoneNumber({
          phoneNumberId: connectedPayload.phone_number_id,
          businessToken,
          pin: registrationPin,
          graphVersion: exchangeEnv.env.graphVersion,
        });
      } catch (error) {
        const metaError = safeMetaError(error);
        registrationError =
          metaError && "message" in metaError.body
            ? (metaError.body.message ?? "Meta rejected the registration.")
            : errorText(error);
      }
    }

    const status = registrationError
      ? "pending_registration"
      : subscribeResult.success
        ? "subscribed"
        : "connected";

    try {
      await upsertWhatsAppConnection({
        payload: connectedPayload,
        businessToken,
        tokenMetadata,
        phoneProfile,
        status,
        connectedAt,
        connectionMode,
        onboardingNonce: connectionMode === "META_COEXISTENCE" ? signupState.nonce : null,
        registrationPin,
        registeredAt: registration?.registered ? connectedAt : null,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            "Meta accepted the connection and the recovery credentials are stored, but its final database status could not be updated. Retry safely.",
          waba_id: connectedPayload.waba_id,
          phone_number_id: connectedPayload.phone_number_id,
          waba_subscribe_succeeded: subscribeResult.success === true,
          database: { ok: false, credentials_stored: true, error: errorText(error) },
        },
        { status: 502 },
      );
    }

    let coexistence: Record<string, unknown> | null = null;
    let finalStatus = status;
    if (connectionMode === "META_COEXISTENCE") {
      const requestedAt = new Date().toISOString();
      const claim = await claimWhatsAppCoexistenceSync({
        wabaId: connectedPayload.waba_id,
        phoneNumberId: connectedPayload.phone_number_id,
        onboardingNonce: signupState.nonce,
        requestedAt,
      });

      if (!claim.claimed) {
        coexistence = claim.metadata;
        finalStatus = claim.status;
      } else {
        const [phoneState, contactSync, historySync] = await Promise.allSettled([
          getWhatsAppPhoneCoexistenceStatus({
            phoneNumberId: connectedPayload.phone_number_id,
            businessToken,
            graphVersion: exchangeEnv.env.graphVersion,
          }),
          requestBusinessAppDataSync({
            phoneNumberId: connectedPayload.phone_number_id,
            businessToken,
            syncType: "smb_app_state_sync",
            graphVersion: exchangeEnv.env.graphVersion,
          }),
          requestBusinessAppDataSync({
            phoneNumberId: connectedPayload.phone_number_id,
            businessToken,
            syncType: "history",
            graphVersion: exchangeEnv.env.graphVersion,
          }),
        ]);

        const phoneStateResult = settledMetaResult(phoneState);
        const contactSyncResult = settledMetaResult(contactSync);
        const historySyncResult = settledMetaResult(historySync);
        const confirmed =
          phoneState.status === "fulfilled" &&
          phoneState.value.is_on_biz_app === true &&
          phoneState.value.platform_type === "CLOUD_API";
        const syncAccepted =
          contactSync.status === "fulfilled" && contactSync.value.success !== false &&
          historySync.status === "fulfilled" && historySync.value.success !== false;

        finalStatus = syncAccepted
          ? confirmed
            ? "coexistence_sync_requested"
            : "coexistence_sync_requested_unverified"
          : "coexistence_sync_action_required";
        coexistence = {
          onboarding_nonce: signupState.nonce,
          requested_at: requestedAt,
          state: "finished",
          final_status: finalStatus,
          confirmed,
          phone_state: phoneStateResult,
          contact_sync: contactSyncResult,
          history_sync: historySyncResult,
        };
        await recordWhatsAppCoexistenceSync({
          wabaId: connectedPayload.waba_id,
          phoneNumberId: connectedPayload.phone_number_id,
          status: finalStatus,
          metadata: coexistence,
        });
      }
    }

    const response = NextResponse.json({
      ok: true,
      connected_account: {
        waba_id: connectedPayload.waba_id,
        phone_number_id: connectedPayload.phone_number_id,
        business_id: connectedPayload.business_id,
        display_phone_number: phoneProfile.display_phone_number,
        verified_name: phoneProfile.verified_name,
        connected_at: connectedAt,
        status: finalStatus,
        connection_mode: connectionMode,
      },
      token_metadata: tokenMetadata,
      waba_subscribe_succeeded: subscribeResult.success === true,
      // Coexistence never registers, so `skipped` there is the healthy state.
      registration:
        connectionMode === "META_CLOUD_API"
          ? {
              required: true,
              registered: registration?.registered === true,
              already_registered: registration?.alreadyRegistered === true,
              error: registrationError,
            }
          : { required: false, registered: false, already_registered: false, error: null },
      coexistence,
      database: { ok: true },
      test_message: {
        endpoint: "/api/meta/embedded-signup/test-message",
        mode: "server-side provider using the encrypted stored connection",
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

    return NextResponse.json({ error: errorText(error) }, { status: 500 });
  }
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Unknown exchange error.";
}

function settledMetaResult<T extends Record<string, unknown>>(
  result: PromiseSettledResult<T>,
) {
  if (result.status === "fulfilled") return { ok: result.value.success !== false, ...result.value };
  const metaError = safeMetaError(result.reason);
  return metaError
    ? {
        ok: false,
        request: metaError.meta_request,
        status: metaError.status,
        code: "code" in metaError.body ? metaError.body.code : undefined,
        message: "message" in metaError.body ? metaError.body.message : undefined,
      }
    : { ok: false, message: errorText(result.reason).slice(0, 300) };
}
