import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  META_MESSAGE_ORIGINS,
  META_REQUIRED_PERMISSIONS,
} from "@/lib/meta/embedded-signup";
import {
  getPublicMetaConfig,
  META_SIGNUP_STATE_COOKIE,
} from "@/lib/meta/server";
import { authorizeOps } from "@/lib/ops-auth";
import { getLatestWhatsAppConnectionForClient } from "@/lib/whatsapp-connections-db";

export async function GET(request: NextRequest) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

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

  const state = crypto.randomUUID();
  const requestedWorkspace = request.nextUrl.searchParams.get("workspace");
  const workspace =
    requestedWorkspace && /^[a-zA-Z0-9._-]{1,80}$/.test(requestedWorkspace)
      ? requestedWorkspace
      : authorization.userId;
  const connection = await getLatestWhatsAppConnectionForClient(workspace).catch(() => null);
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
