import GrowthOpsClient from "@/components/ops/GrowthOpsClient";
import {
  getGrowthLeads,
  getGrowthRuns,
  getOutreachDrafts,
  isGrowthDatabaseConfigured,
} from "@/lib/growth-db";
import { getMarketingSnapshot } from "@/lib/postiz";
import { getWahaSnapshot } from "@/lib/waha";
import { redirect } from "next/navigation";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export default async function GrowthOpsPage() {
  if (!isOpsAuthConfigured() || !isGrowthDatabaseConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1711] p-6 text-white">
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#a9c989]">Setup requerido</div>
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

  const [runs, leads, drafts, marketing, waha] = await Promise.all([
    getGrowthRuns(),
    getGrowthLeads(),
    getOutreachDrafts(),
    getMarketingSnapshot(),
    getWahaSnapshot(),
  ]);
  return <GrowthOpsClient initialRuns={runs} initialLeads={leads} initialDrafts={drafts} marketing={marketing} waha={waha} />;
}
