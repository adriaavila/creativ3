import { notFound, redirect } from "next/navigation";
import ConnectionAutomationClient from "@/components/ops/ConnectionAutomationClient";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";
import { getTenantBotConfig } from "@/lib/tenant-bot-config";
import {
  getWhatsAppConnectionActivity,
  getWhatsAppConnectionByPhoneNumberId,
} from "@/lib/whatsapp-connections-db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Automatización de WhatsApp | allok Ops",
  description: "Configuración por número de WhatsApp oficial.",
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
  if (!/^\d{5,32}$/.test(phoneNumberId)) notFound();

  const [connection, config, activity] = await Promise.all([
    getWhatsAppConnectionByPhoneNumberId(phoneNumberId),
    getTenantBotConfig(phoneNumberId),
    getWhatsAppConnectionActivity(phoneNumberId),
  ]);
  if (!connection) notFound();

  return (
    <ConnectionAutomationClient
      connection={connection}
      activity={activity}
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
