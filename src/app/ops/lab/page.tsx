import { redirect } from "next/navigation";
import LabClient from "@/components/ops/LabClient";
import { getEveAgentCatalog } from "@/lib/eve-agent-catalog";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Laboratorio | allok Ops",
  description: "Catálogo de evaluaciones del agente Eve de allok.",
};

export default async function OpsLabPage() {
  if (!isOpsAuthConfigured()) {
    return <LabClient catalog={null} />;
  }

  const authorization = await authorizeOps();
  if (!authorization.authorized) redirect("/ops-login?next=/ops/lab");

  return <LabClient catalog={await getEveAgentCatalog()} />;
}
