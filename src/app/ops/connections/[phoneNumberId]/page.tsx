import { notFound, redirect } from "next/navigation";
import ConnectionAutomationClient from "@/components/ops/ConnectionAutomationClient";
import type { AutomationConnectionView } from "@/components/ops/ConnectionAutomationClient";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";
import { getTenantBotConfig } from "@/lib/tenant-bot-config";
import { getWahaConnection } from "@/lib/whatsapp-inbox-db";
import {
  getWhatsAppConnectionActivity,
  getWhatsAppConnectionByPhoneNumberId,
} from "@/lib/whatsapp-connections-db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Automatización de WhatsApp | allok Ops",
  description: "Configuración por canal de WhatsApp.",
};

export default async function OpsConnectionPage({
  params,
}: {
  params: Promise<{ phoneNumberId: string }>;
}) {
  if (!isOpsAuthConfigured()) redirect("/ops-login?next=/ops/crm?view=connections");
  const authorization = await authorizeOps();
  if (!authorization.authorized) redirect("/ops-login?next=/ops/crm?view=connections");

  const { phoneNumberId } = await params;
  if (!/^[a-zA-Z0-9._-]{2,64}$/.test(phoneNumberId)) notFound();

  const [meta, waha, config] = await Promise.all([
    getWhatsAppConnectionByPhoneNumberId(phoneNumberId),
    getWahaConnection(phoneNumberId),
    getTenantBotConfig(phoneNumberId),
  ]);
  if (!meta && !waha) notFound();

  const provider = meta ? "meta" : "waha";
  const activity = await getWhatsAppConnectionActivity(phoneNumberId, provider === "meta" ? "cloud_api" : "waha");
  const connection: AutomationConnectionView = meta
    ? {
        provider,
        key: meta.phoneNumberId,
        label: meta.verifiedName || meta.client || "WhatsApp oficial",
        phone: meta.displayPhoneNumber,
        status: meta.status,
        client: meta.client,
        connectedAt: meta.connectedAt,
        lastSyncedAt: meta.lastSyncedAt,
        connectionMode: meta.connectionMode,
        qualityRating: meta.qualityRating,
        nameStatus: meta.nameStatus,
        wabaId: meta.wabaId,
        businessId: meta.businessId,
        businessTokenStored: meta.businessTokenStored,
        registeredAt: meta.registeredAt,
        webhookOverrideUri: meta.webhookOverrideUri,
        crmOrganizationId: meta.crmOrganizationId,
        crmOrganizationName: meta.crmOrganizationName,
        crmConnectedAt: meta.crmConnectedAt,
      }
    : {
        provider,
        key: waha!.wahaSessionId,
        label: waha!.phoneDisplay || waha!.client || waha!.wahaSessionId,
        phone: waha!.phoneDisplay,
        status: waha!.status,
        client: waha!.client,
        connectedAt: waha!.connectedAt,
        lastSyncedAt: waha!.lastSyncedAt,
      };

  return (
    <ConnectionAutomationClient
      connection={connection}
      activity={activity}
      pilotMode={process.env.WHATSAPP_OUTBOUND_MODE === "pilot"}
      initialConfig={config ?? {
        phoneNumberId,
        systemPrompt: null,
        businessFacts: null,
        handoffNote: null,
        autoReplies: {},
        enabled: false,
        operatingMode: "off",
        modelTier: "balanced",
      }}
    />
  );
}
