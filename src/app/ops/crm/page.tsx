import { redirect } from "next/navigation";
import CrmWorkspaceClient from "@/components/ops/CrmWorkspaceClient";
import type { CrmChannel } from "@/lib/crm-types";
import { getGrowthLeadById, getGrowthLeads, isGrowthDatabaseConfigured } from "@/lib/growth-db";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";
import { listWahaConnections } from "@/lib/whatsapp-inbox-db";
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
  searchParams?: Promise<{ view?: string; lead?: string | string[] }>;
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

  const params = searchParams ? await searchParams : {};
  const rawLeadId = typeof params.lead === "string" ? params.lead : "";
  const requestedLeadId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawLeadId) ? rawLeadId : null;
  const [listedLeads, metaConnections, wahaConnections, requestedLead] = await Promise.all([
    getGrowthLeads(100),
    listWhatsAppConnections().catch(() => []),
    listWahaConnections().catch(() => []),
    requestedLeadId ? getGrowthLeadById(requestedLeadId).catch(() => null) : null,
  ]);
  const leads = requestedLead && !listedLeads.some(({ id }) => id === requestedLead.id)
    ? [requestedLead, ...listedLeads]
    : listedLeads;

  const channels: CrmChannel[] = buildCrmChannels(metaConnections, wahaConnections);

  return (
    <CrmWorkspaceClient
      key={`${params.view ?? "workspace"}:${requestedLead?.id ?? "none"}`}
      initialLeads={leads}
      channels={channels}
      initialView={params.view === "connections" ? "connections" : "workspace"}
      initialLeadId={requestedLead?.id ?? null}
      cloudApiOnboardingAvailable={Boolean(process.env.META_CONFIG_ID_CLOUD_API?.trim())}
    />
  );
}
