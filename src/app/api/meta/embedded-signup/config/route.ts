import { NextResponse } from "next/server";
import {
  META_MESSAGE_ORIGINS,
  META_REQUIRED_PERMISSIONS,
} from "@/lib/meta/embedded-signup";
import { getPublicMetaConfig } from "@/lib/meta/server";

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

  return NextResponse.json({
    appId: result.config.appId,
    configId: result.config.configId,
    graphVersion: result.config.graphVersion,
    allowedMessageOrigins: META_MESSAGE_ORIGINS,
    requiredPermissions: META_REQUIRED_PERMISSIONS,
  });
}
