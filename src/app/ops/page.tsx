import { redirect } from "next/navigation";
import HoyClient from "@/components/ops/HoyClient";
import { getGrowthLeads, isGrowthDatabaseConfigured } from "@/lib/growth-db";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";
import { localDate } from "@/lib/sales-queue";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hoy | allok Ops",
  description: "A quién hablarle hoy, qué pedirle, y cómo va la semana.",
};

export default async function OpsTodayPage() {
  if (!isOpsAuthConfigured() || !isGrowthDatabaseConfigured()) redirect("/ops/growth");
  const authorization = await authorizeOps();
  if (!authorization.authorized) redirect("/ops-login?next=/ops");

  // ponytail: todos los leads en memoria; hoy son 13. Filtrar en SQL cuando pasen de ~2.000.
  const leads = await getGrowthLeads(2000);
  return <HoyClient initialLeads={leads} today={localDate(new Date())} />;
}
