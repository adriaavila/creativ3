import GrowthOpsClient from "@/components/ops/GrowthOpsClient";
import {
  getGrowthLeads,
  getGrowthRuns,
  getOutreachDraftById,
  getOutreachDrafts,
  isGrowthDatabaseConfigured,
} from "@/lib/growth-db";
import { getMarketingSnapshot } from "@/lib/postiz";
import { redirect } from "next/navigation";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Growth | allok Ops",
  description: "Investigación, pipeline, marketing y borradores comerciales de allok.",
};

export default async function GrowthOpsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; draft?: string | string[] }>;
}) {
  if (!isOpsAuthConfigured() || !isGrowthDatabaseConfigured()) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f7f8fa] p-6 text-[#172238]">
        <div className="max-w-xl rounded-2xl border border-[#dfe5eb] bg-white p-8 shadow-[0_16px_40px_rgba(20,43,75,0.06)]">
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#71842f]">Setup requerido</div>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.04em]">Growth está listo para conectarse.</h1>
          <p className="mt-5 text-sm leading-6 text-[#68778a]">
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
  const [runs, leads, listedDrafts, marketing, requestedDraft] = await Promise.all([
    getGrowthRuns(),
    getGrowthLeads(),
    getOutreachDrafts(),
    getMarketingSnapshot(),
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
  return <GrowthOpsClient key={`${initialTab}:${initialDraftId ?? "none"}`} initialRuns={runs} initialLeads={leads} initialDrafts={drafts} initialTab={initialTab} initialDraftId={initialDraftId} marketing={marketing} />;
}
