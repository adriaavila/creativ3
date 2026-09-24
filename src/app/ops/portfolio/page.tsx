import { redirect } from "next/navigation";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";
import { ALL_PORTFOLIO_PROJECTS, PROJECTS_LAST_SYNCED_AT } from "@/lib/projects";
import OpsPortfolioClient from "@/components/ops/OpsPortfolioClient";

export const metadata = {
  title: "Portafolio | allok Ops",
};

export default async function OpsPortfolioPage() {
  if (!isOpsAuthConfigured()) {
    return (
      <main className="on-ink flex min-h-screen items-center justify-center bg-[var(--ink-fill)] p-6 text-white">
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--st-atencion-ink)]">Setup requerido</div>
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
    <OpsPortfolioClient projects={ALL_PORTFOLIO_PROJECTS} lastSyncedAt={PROJECTS_LAST_SYNCED_AT} />
  );
}
