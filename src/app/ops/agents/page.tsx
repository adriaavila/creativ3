import { redirect } from "next/navigation";
import AgentsClient from "@/components/ops/AgentsClient";
import { getEveAgentCatalog } from "@/lib/eve-agent-catalog";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agentes | allok Ops",
  description: "Catálogo de agentes Eve de allok, sus herramientas, canales y guardrails.",
};

export default async function OpsAgentsPage() {
  if (!isOpsAuthConfigured()) {
    return <AgentsClient catalog={null} />;
  }

  const authorization = await authorizeOps();
  if (!authorization.authorized) redirect("/ops-login?next=/ops/agents");

  return <AgentsClient catalog={await getEveAgentCatalog()} />;
}
