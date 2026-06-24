import { neon } from "@neondatabase/serverless";
import OpsDashboardClient from "@/components/ops/OpsDashboardClient";
import { isGrowthDatabaseConfigured } from "@/lib/growth-db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ops Central | Creativv",
  description: "Panel de administración y diagnóstico de sistemas creativv.",
};

export default async function OpsPage() {
  // ponytail: auth gate removed for now — open to anyone with the link. Re-add Clerk when locking down.
  if (!isGrowthDatabaseConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1711] p-6 text-white">
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#a9c989]">
            Setup requerido
          </div>
          <h1 className="mt-4 font-display text-5xl leading-[0.9]">
            Ops Dashboard está listo para conectarse.
          </h1>
          <p className="mt-5 text-sm leading-6 text-white/50">
            Configura Clerk y DATABASE_URL, ejecuta la migración de crecimiento y vuelve a cargar esta ruta.
          </p>
        </div>
      </main>
    );
  }

  let leadsCount = 0;
  let draftsCount = 0;
  let runsCount = 0;

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [leads, drafts, runs] = await Promise.all([
      sql`SELECT count(*)::int as count FROM leads`,
      sql`SELECT count(*)::int as count FROM outreach_drafts WHERE status = 'pending'`,
      sql`SELECT count(*)::int as count FROM growth_runs`,
    ]);

    leadsCount = leads[0]?.count ?? 0;
    draftsCount = drafts[0]?.count ?? 0;
    runsCount = runs[0]?.count ?? 0;
  } catch (error) {
    console.error("Could not fetch database stats for ops page", error);
  }

  return (
    <OpsDashboardClient
      stats={{
        leadsCount,
        draftsCount,
        runsCount,
      }}
    />
  );
}
