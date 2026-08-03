import { redirect } from "next/navigation";
import OpsDashboardClient from "@/components/ops/OpsDashboardClient";
import { isGrowthDatabaseConfigured } from "@/lib/growth-db";
import { authorizeOps } from "@/lib/ops-auth";
import { getOpsCommandCenter } from "@/lib/ops-command-center";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ops Central | allok",
  description: "Acciones, resultados y salud operativa de allok.",
};

export default async function OpsPage() {
  const authorization = await authorizeOps();
  if (!authorization.authorized) redirect("/ops-login");

  if (!isGrowthDatabaseConfigured()) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f7f8fa] p-6 text-[#142b4b]">
        <div className="max-w-xl rounded-2xl border border-[#dfe5ea] bg-white p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#7a8797]">Setup requerido</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em]">Conecta la base de datos.</h1>
          <p className="mt-4 text-sm leading-6 text-[#68778a]">Configura DATABASE_URL, ejecuta las migraciones y vuelve a cargar esta ruta.</p>
        </div>
      </main>
    );
  }

  return <OpsDashboardClient snapshot={await getOpsCommandCenter()} />;
}
