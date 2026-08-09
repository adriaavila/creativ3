import { NextRequest, NextResponse } from "next/server";
import {
  META_CONNECTION_MODES,
  META_MESSAGE_ORIGINS,
  META_REQUIRED_PERMISSIONS,
  type MetaConnectionMode,
} from "@/lib/meta/embedded-signup";
import {
  createMetaSignupState,
  getPublicMetaConfig,
  META_SIGNUP_STATE_COOKIE,
  verifyMetaOnboardingInvite,
} from "@/lib/meta/server";
import { authorizeOps } from "@/lib/ops-auth";
import { getLatestWhatsAppConnectionForClient } from "@/lib/whatsapp-connections-db";

export async function GET(request: NextRequest) {
  const authorization = await authorizeOps();

  const result = getPublicMetaConfig();

  if (!result.config) {
    return NextResponse.json(
      {
        error: "Meta Embedded Signup is not configured.",
        missing_env: result.missing,
      },
      { status: 500 },
    );
  }

  const requestedWorkspace =
    request.nextUrl.searchParams.get("workspace") ?? request.nextUrl.searchParams.get("client");
  const workspace =
    requestedWorkspace && /^[a-zA-Z0-9._-]{1,80}$/.test(requestedWorkspace)
      ? requestedWorkspace
      : authorization.authorized
        ? authorization.userId
        : null;
  if (!workspace) {
    return authorization.authorized
      ? NextResponse.json({ error: "A workspace is required for onboarding." }, { status: 400 })
      : authorization.response;
  }

  const requestedMode = request.nextUrl.searchParams.get("mode");
  const connectionMode: MetaConnectionMode =
    requestedMode === "cloud_api" ? "META_CLOUD_API" : "META_COEXISTENCE";
  if (!META_CONNECTION_MODES.includes(connectionMode)) {
    return NextResponse.json({ error: "Invalid connection mode." }, { status: 400 });
  }

  if (!authorization.authorized) {
    const invite = verifyMetaOnboardingInvite(
      request.nextUrl.searchParams.get("invite") ?? undefined,
    );
    if (
      !invite ||
      invite.workspace !== workspace ||
      invite.connection_mode !== connectionMode
    ) {
      return NextResponse.json(
        { error: "This onboarding link is invalid or expired." },
        { status: 403 },
      );
    }
  }

  const state = createMetaSignupState(workspace, connectionMode);
  if (!state) {
    return NextResponse.json(
      { error: "Meta Embedded Signup server environment is incomplete.", missing_env: ["META_APP_SECRET"] },
      { status: 500 },
    );
  }

  const connection = authorization.authorized
    ? await getLatestWhatsAppConnectionForClient(workspace).catch(() => null)
    : null;
  const response = NextResponse.json({
    appId: result.config.appId,
    configId: result.config.configId,
    cloudApiConfigId: result.config.cloudApiConfigId,
    graphVersion: result.config.graphVersion,
    appUrl: result.config.appUrl,
    state,
    allowedMessageOrigins: META_MESSAGE_ORIGINS,
    requiredPermissions: META_REQUIRED_PERMISSIONS,
    connection,
  });

  response.cookies.set(META_SIGNUP_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 15 * 60,
    path: "/api/meta/embedded-signup",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
