import GrowthOpsClient from "@/components/ops/GrowthOpsClient";
import {
  getGrowthLeads,
  getGrowthRuns,
  getOutreachDraftById,
  getOutreachDrafts,
  isGrowthDatabaseConfigured,
} from "@/lib/growth-db";
import { getMarketingSnapshot } from "@/lib/postiz";
import { getWahaSnapshot } from "@/lib/waha";
import { redirect } from "next/navigation";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export default async function GrowthOpsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; draft?: string | string[] }>;
}) {
  if (!isOpsAuthConfigured() || !isGrowthDatabaseConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090a] p-6 text-white">
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#c5f04a]">Setup requerido</div>
          <h1 className="mt-4 font-display text-5xl leading-[0.9]">Growth OS está listo para conectarse.</h1>
          <p className="mt-5 text-sm leading-6 text-white/50">
            Configura OPS_ACCESS_PASSWORD, OPS_SESSION_SECRET y DATABASE_URL, ejecuta las migraciones y vuelve a cargar esta ruta.
          </p>
        </div>
      </main>
    );
  }

  const authorization = await authorizeOps();
  if (!authorization.authorized) redirect("/ops-login");

  const params = searchParams ? await searchParams : {};
  const rawDraftId = typeof params.draft === "string" ? params.draft : "";
  const requestedDraftId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawDraftId) ? rawDraftId : null;
  const [runs, leads, listedDrafts, marketing, waha, requestedDraft] = await Promise.all([
    getGrowthRuns(),
    getGrowthLeads(),
    getOutreachDrafts(),
    getMarketingSnapshot(),
    getWahaSnapshot(),
    requestedDraftId ? getOutreachDraftById(requestedDraftId).catch(() => null) : null,
  ]);
  const drafts = requestedDraft && !listedDrafts.some(({ id }) => id === requestedDraft.id)
    ? [requestedDraft, ...listedDrafts]
    : listedDrafts;
  const initialDraftId = requestedDraft?.id ?? null;
  const initialTab = initialDraftId || params.tab === "drafts"
    ? "drafts"
    : params.tab === "runs" || params.tab === "leads" || params.tab === "marketing"
      ? params.tab
      : "hoy";
  return <GrowthOpsClient key={`${initialTab}:${initialDraftId ?? "none"}`} initialRuns={runs} initialLeads={leads} initialDrafts={drafts} initialTab={initialTab} initialDraftId={initialDraftId} marketing={marketing} waha={waha} />;
}
