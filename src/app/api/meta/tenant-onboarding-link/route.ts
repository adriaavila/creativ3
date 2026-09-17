import { NextRequest, NextResponse } from "next/server";
import { bearerMatches } from "@/lib/handover/bearer";
import { buildOnboardingUrl } from "@/lib/meta/onboarding-link";
import { createMetaOnboardingInvite, getPublicMetaConfig } from "@/lib/meta/server";
import type { MetaConnectionMode } from "@/lib/meta/embedded-signup";
import { getDestinationSecrets, parseExternalRef } from "@/lib/handover/destinations";

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
  const input = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const workspace = typeof input?.workspace === "string" ? input.workspace.trim() : "";
  const returnUrl = typeof input?.return_url === "string" ? input.return_url.trim() : undefined;
  const destination = typeof input?.destination === "string"
    ? input.destination.trim().toLowerCase()
    : "vocero";
  const externalRef = input?.external_ref === undefined || input?.external_ref === null || input?.external_ref === ""
    ? null
    : parseExternalRef(input.external_ref);
  const connectionMode: MetaConnectionMode =
    input?.mode === "cloud_api" ? "META_CLOUD_API" : "META_COEXISTENCE";

  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(workspace)) {
    return NextResponse.json({ error: "A valid workspace is required." }, { status: 400 });
  }
  if (!/^[a-z0-9][a-z0-9._-]{1,39}$/.test(destination)) {
    return NextResponse.json({ error: "A valid onboarding destination is required." }, { status: 400 });
  }
  if (input?.external_ref !== undefined && input?.external_ref !== null && input?.external_ref !== "" && !externalRef) {
    return NextResponse.json({ error: "A valid destination reference is required." }, { status: 400 });
  }
  if (connectionMode === "META_CLOUD_API" && !process.env.META_CONFIG_ID_CLOUD_API?.trim()) {
    return NextResponse.json({ error: "Cloud API onboarding is not configured." }, { status: 409 });
  }

  const destinationConfig = await getDestinationSecrets(destination).catch(() => null);
  if (!destinationConfig?.provisionUrl || !destinationConfig.provisionSecret) {
    return NextResponse.json({ error: `Destination ${destination} is not configured for automatic provisioning.` }, { status: 503 });
  }

  const invite = createMetaOnboardingInvite(
    workspace,
    connectionMode,
    secret,
    destination,
    returnUrl,
    externalRef,
  );
  if (!invite) {
    return NextResponse.json({ error: "SaaS onboarding is not configured." }, { status: 503 });
  }

  const origin = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  return NextResponse.json({
    url: buildOnboardingUrl(origin, workspace, connectionMode === "META_CLOUD_API", invite),
    expires_in_seconds: 7 * 24 * 60 * 60,
  });
}
