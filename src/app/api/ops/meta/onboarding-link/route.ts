import { NextRequest, NextResponse } from "next/server";
import { authorizeOps } from "@/lib/ops-auth";
import { createMetaOnboardingInvite } from "@/lib/meta/server";
import { buildOnboardingUrl } from "@/lib/meta/onboarding-link";
import type { MetaConnectionMode } from "@/lib/meta/embedded-signup";
import { getDestinationSecrets, parseExternalRef } from "@/lib/handover/destinations";

export async function POST(request: NextRequest) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const workspace = typeof input?.workspace === "string" ? input.workspace.trim() : "";
  const destination = typeof input?.destination === "string"
    ? input.destination.trim().toLowerCase()
    : undefined;
  const externalRef = input?.external_ref === undefined || input?.external_ref === null || input?.external_ref === ""
    ? null
    : parseExternalRef(input.external_ref);
  const connectionMode: MetaConnectionMode =
    input?.mode === "cloud_api" ? "META_CLOUD_API" : "META_COEXISTENCE";

  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(workspace)) {
    return NextResponse.json({ error: "A valid workspace is required." }, { status: 400 });
  }
  if (destination && !/^[a-z0-9][a-z0-9._-]{1,39}$/.test(destination)) {
    return NextResponse.json({ error: "A valid onboarding destination is required." }, { status: 400 });
  }
  if (input?.external_ref !== undefined && input?.external_ref !== null && input?.external_ref !== "" && !externalRef) {
    return NextResponse.json({ error: "A valid destination reference is required." }, { status: 400 });
  }
  if (connectionMode === "META_CLOUD_API" && !process.env.META_CONFIG_ID_CLOUD_API?.trim()) {
    return NextResponse.json(
      { error: "Cloud API onboarding is not configured." },
      { status: 409 },
    );
  }

  if (destination) {
    const destinationConfig = await getDestinationSecrets(destination).catch(() => null);
    if (!destinationConfig?.provisionUrl || !destinationConfig.provisionSecret) {
      return NextResponse.json({ error: `Destination ${destination} is not configured for automatic provisioning.` }, { status: 503 });
    }
  }

  const invite = createMetaOnboardingInvite(workspace, connectionMode, undefined, destination, undefined, externalRef);
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
