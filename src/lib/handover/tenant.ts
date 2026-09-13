import {
  getGraphVersion,
  listWabaSubscribedApps,
  subscribeWabaToApp,
} from "@/lib/meta/server";
import { matchesDestinationSubscription } from "@/lib/handover/destinations";
import { pushCredentials } from "@/lib/handover/provision";
import { recordWhatsAppCrmHandover } from "@/lib/whatsapp-connections-db";

type TenantHandoverInput = {
  workspace: string;
  wabaId: string;
  phoneNumberId: string;
  businessId: string | null;
  businessToken: string;
  connectionMode: "META_CLOUD_API" | "META_COEXISTENCE";
  status: string;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
};

export type TenantHandoverResult =
  | { ok: true; webhookUrl: string; organizationName: string | null }
  | { ok: false; error: string; step: "config" | "credentials" | "webhook" | "verification" | "persistencia" };

/** Completa el último tramo del onboarding público: Allok → Vocero SaaS. */
export async function handoverSaaSTenant(input: TenantHandoverInput): Promise<TenantHandoverResult> {
  const url = process.env.ALLOK_SAAS_PROVISION_URL?.trim();
  const secret = process.env.ALLOK_SAAS_PROVISION_SECRET?.trim();
  const verifyToken = process.env.ALLOK_SAAS_WEBHOOK_VERIFY_TOKEN?.trim();
  if (!url || !secret || !verifyToken) {
    return { ok: false, step: "config", error: "SaaS provisioning is not configured." };
  }

  const provisioned = await pushCredentials({
    url,
    secret,
    externalRef: input.workspace,
    client: input.workspace,
    businessId: input.businessId,
    wabaId: input.wabaId,
    phoneNumberId: input.phoneNumberId,
    token: input.businessToken,
    displayPhoneNumber: input.displayPhoneNumber,
    verifiedName: input.verifiedName,
    connectionMode: input.connectionMode,
    status: input.status,
  });
  if (!provisioned.ok || !provisioned.webhookUrl) {
    return { ok: false, step: "credentials", error: provisioned.error ?? "Vocero did not return a webhook URL." };
  }

  try {
    const subscription = await subscribeWabaToApp(
      input.wabaId,
      input.businessToken,
      getGraphVersion(),
      { callbackUri: provisioned.webhookUrl, verifyToken },
    );
    if (subscription.success !== true) throw new Error("subscription_not_confirmed");
  } catch {
    return { ok: false, step: "webhook", error: "Meta rejected the Vocero webhook." };
  }

  try {
    const subscriptions = await listWabaSubscribedApps({
      wabaId: input.wabaId,
      businessToken: input.businessToken,
      graphVersion: getGraphVersion(),
    });
    if (!subscriptions.some((item) => matchesDestinationSubscription(
      item,
      process.env.META_APP_ID?.trim(),
      provisioned.webhookUrl!,
    ))) {
      return { ok: false, step: "verification", error: "Meta did not confirm the Vocero webhook." };
    }
  } catch {
    return { ok: false, step: "verification", error: "Could not verify the Meta webhook." };
  }

  try {
    await recordWhatsAppCrmHandover({
      wabaId: input.wabaId,
      phoneNumberId: input.phoneNumberId,
      provider: "vocero",
      organizationId: input.workspace,
      organizationName: provisioned.organizationName,
      webhookUri: provisioned.webhookUrl,
      connectedAt: new Date().toISOString(),
    });
  } catch {
    return { ok: false, step: "persistencia", error: "The handover could not be recorded." };
  }

  return {
    ok: true,
    webhookUrl: provisioned.webhookUrl,
    organizationName: provisioned.organizationName,
  };
}
