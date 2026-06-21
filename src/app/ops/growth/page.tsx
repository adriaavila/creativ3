import { auth } from "@clerk/nextjs/server";
import GrowthOpsClient from "@/components/ops/GrowthOpsClient";
import {
  getGrowthLeads,
  getGrowthRuns,
  getOutreachDrafts,
  isGrowthDatabaseConfigured,
} from "@/lib/growth-db";

export const dynamic = "force-dynamic";

export default async function GrowthOpsPage() {
  const clerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
  if (!clerkConfigured || !isGrowthDatabaseConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1711] p-6 text-white">
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#a9c989]">Setup requerido</div>
          <h1 className="mt-4 font-display text-5xl leading-[0.9]">Growth OS está listo para conectarse.</h1>
          <p className="mt-5 text-sm leading-6 text-white/50">
            Configura Clerk y DATABASE_URL, ejecuta la migración de crecimiento y vuelve a cargar esta ruta.
            El sitio público funciona mientras tanto con datos marcados como Demo.
          </p>
        </div>
      </main>
    );
  }

  const { userId } = await auth();
  if (!userId) return null;
  const [runs, leads, drafts] = await Promise.all([
    getGrowthRuns(),
    getGrowthLeads(),
    getOutreachDrafts(),
  ]);
  return <GrowthOpsClient initialRuns={runs} initialLeads={leads} initialDrafts={drafts} />;
}

