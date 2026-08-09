import { redirect } from "next/navigation";
import ClientsClient from "@/components/ops/ClientsClient";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";
import { listClients } from "@/lib/clients-db";
import type { ClientRow } from "@/lib/clients";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clientes | allok Ops",
  description: "Qué clientes tiene allok, en qué app trabaja cada uno y su estado de alta.",
};

export default async function OpsClientsPage() {
  if (!isOpsAuthConfigured()) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f7f8fa] p-6 text-[#142b4b]">
        <div className="max-w-xl rounded-xl border border-[#e2e7ed] bg-white p-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a8797]">Setup requerido</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">Registro de clientes.</h1>
          <p className="mt-4 text-sm leading-6 text-[#68778a]">
            Configura OPS_ACCESS_PASSWORD, OPS_SESSION_SECRET y DATABASE_URL para cargarlo.
          </p>
        </div>
      </main>
    );
  }

  const authorization = await authorizeOps();
  if (!authorization.authorized) redirect("/ops-login?next=/ops/clientes");

  let clients: ClientRow[] = [];
  let loadError: string | null = null;
  try {
    clients = await listClients();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "No se pudo leer el registro.";
  }

  return <ClientsClient initialClients={clients} loadError={loadError} />;
}
