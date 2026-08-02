import { redirect } from "next/navigation";
import CrmWorkspaceClient from "@/components/ops/CrmWorkspaceClient";
import type { CrmChannel } from "@/lib/crm-types";
import { getGrowthLeads, isGrowthDatabaseConfigured } from "@/lib/growth-db";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";
import { listConversations, listWahaConnections } from "@/lib/whatsapp-inbox-db";
import { listWhatsAppConnections } from "@/lib/whatsapp-connections-db";
import { buildCrmChannels } from "@/lib/crm-channels";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CRM | allok Ops",
  description: "Leads, conversaciones y canales de WhatsApp de allok.",
};

export default async function OpsCrmPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  if (!isOpsAuthConfigured() || !isGrowthDatabaseConfigured()) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#08090a] p-6 text-white">
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#c5f04a]">Setup requerido</div>
          <h1 className="mt-4 font-display text-5xl leading-[0.9]">CRM listo para conectar.</h1>
          <p className="mt-5 text-sm leading-6 text-white/50">Configura OPS_ACCESS_PASSWORD, OPS_SESSION_SECRET y DATABASE_URL, ejecuta las migraciones y vuelve a cargar esta ruta.</p>
        </div>
      </main>
    );
  }

  const authorization = await authorizeOps();
  if (!authorization.authorized) redirect("/ops-login?next=/ops/crm");

  const [leads, conversations, metaConnections, wahaConnections] = await Promise.all([
    getGrowthLeads(100),
    listConversations(100).catch(() => []),
    listWhatsAppConnections().catch(() => []),
    listWahaConnections().catch(() => []),
  ]);

  const channels: CrmChannel[] = buildCrmChannels(metaConnections, wahaConnections);

  const params = searchParams ? await searchParams : {};
  return (
    <CrmWorkspaceClient
      initialLeads={leads}
      initialConversations={conversations}
      channels={channels}
      initialView={params.view === "connections" ? "connections" : "workspace"}
    />
  );
}
