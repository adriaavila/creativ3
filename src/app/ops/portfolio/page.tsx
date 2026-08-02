import { redirect } from "next/navigation";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";
import { PORTFOLIO_PROJECTS, PROJECTS_LAST_SYNCED_AT } from "@/lib/projects";
import OpsPortfolioClient from "@/components/ops/OpsPortfolioClient";

export const metadata = {
  title: "Portafolio | allok Ops",
};

export default async function OpsPortfolioPage() {
  if (!isOpsAuthConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090a] p-6 text-white">
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#c5f04a]">Setup requerido</div>
          <h1 className="mt-4 font-display text-5xl leading-[0.9]">Ops está listo para conectarse.</h1>
          <p className="mt-5 text-sm leading-6 text-white/50">
            Configura OPS_ACCESS_PASSWORD y OPS_SESSION_SECRET, y vuelve a cargar esta ruta.
          </p>
        </div>
      </main>
    );
  }

  const authorization = await authorizeOps();
  if (!authorization.authorized) redirect("/ops-login");

  return (
    <OpsPortfolioClient projects={PORTFOLIO_PROJECTS} lastSyncedAt={PROJECTS_LAST_SYNCED_AT} />
  );
}
