import crypto from "node:crypto";
import { NextResponse } from "next/server";
import {
  META_MESSAGE_ORIGINS,
  META_REQUIRED_PERMISSIONS,
} from "@/lib/meta/embedded-signup";
import {
  getPublicMetaConfig,
  META_SIGNUP_STATE_COOKIE,
} from "@/lib/meta/server";

export async function GET() {
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
  const response = NextResponse.json({
    appId: result.config.appId,
    configId: result.config.configId,
    graphVersion: result.config.graphVersion,
    appUrl: result.config.appUrl,
    state,
    allowedMessageOrigins: META_MESSAGE_ORIGINS,
    requiredPermissions: META_REQUIRED_PERMISSIONS,
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
