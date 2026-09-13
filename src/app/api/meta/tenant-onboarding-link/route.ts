import { NextRequest, NextResponse } from "next/server";
import { bearerMatches } from "@/lib/handover/bearer";
import { buildOnboardingUrl } from "@/lib/meta/onboarding-link";
import { createMetaOnboardingInvite, getPublicMetaConfig } from "@/lib/meta/server";
import type { MetaConnectionMode } from "@/lib/meta/embedded-signup";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.ALLOK_SAAS_LINK_SECRET?.trim();
  if (!bearerMatches(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const config = getPublicMetaConfig();
  if (!config.config) {
    return NextResponse.json(
      { error: "Meta Embedded Signup is not configured.", missing_env: config.missing },
      { status: 503 },
    );
  }
  if (
    !process.env.ALLOK_SAAS_PROVISION_URL?.trim() ||
    !process.env.ALLOK_SAAS_PROVISION_SECRET?.trim() ||
    !process.env.ALLOK_SAAS_WEBHOOK_VERIFY_TOKEN?.trim()
  ) {
    return NextResponse.json({ error: "SaaS WhatsApp provisioning is not configured." }, { status: 503 });
  }

  const input = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const workspace = typeof input?.workspace === "string" ? input.workspace.trim() : "";
  const returnUrl = typeof input?.return_url === "string" ? input.return_url.trim() : undefined;
  const connectionMode: MetaConnectionMode =
    input?.mode === "cloud_api" ? "META_CLOUD_API" : "META_COEXISTENCE";

  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(workspace)) {
    return NextResponse.json({ error: "A valid workspace is required." }, { status: 400 });
  }
  if (connectionMode === "META_CLOUD_API" && !process.env.META_CONFIG_ID_CLOUD_API?.trim()) {
    return NextResponse.json({ error: "Cloud API onboarding is not configured." }, { status: 409 });
  }

  const invite = createMetaOnboardingInvite(workspace, connectionMode, secret, "vocero", returnUrl);
  if (!invite) {
    return NextResponse.json({ error: "SaaS onboarding is not configured." }, { status: 503 });
  }

  const origin = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  return NextResponse.json({
    url: buildOnboardingUrl(origin, workspace, connectionMode === "META_CLOUD_API", invite),
    expires_in_seconds: 7 * 24 * 60 * 60,
  });
}
