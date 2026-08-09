import { NextRequest, NextResponse } from "next/server";
import { authorizeOps } from "@/lib/ops-auth";
import { createMetaOnboardingInvite } from "@/lib/meta/server";
import { buildOnboardingUrl } from "@/lib/meta/onboarding-link";
import type { MetaConnectionMode } from "@/lib/meta/embedded-signup";

export async function POST(request: NextRequest) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const workspace = typeof input?.workspace === "string" ? input.workspace.trim() : "";
  const connectionMode: MetaConnectionMode =
    input?.mode === "cloud_api" ? "META_CLOUD_API" : "META_COEXISTENCE";

  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(workspace)) {
    return NextResponse.json({ error: "A valid workspace is required." }, { status: 400 });
  }
  if (connectionMode === "META_CLOUD_API" && !process.env.META_CONFIG_ID_CLOUD_API?.trim()) {
    return NextResponse.json(
      { error: "Cloud API onboarding is not configured." },
      { status: 409 },
    );
  }

  const invite = createMetaOnboardingInvite(workspace, connectionMode);
  if (!invite) {
    return NextResponse.json(
      { error: "Meta onboarding invitations are not configured." },
      { status: 503 },
    );
  }

  const origin = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  return NextResponse.json({
    url: buildOnboardingUrl(origin, workspace, connectionMode === "META_CLOUD_API", invite),
    expires_in_seconds: 7 * 24 * 60 * 60,
  });
}
