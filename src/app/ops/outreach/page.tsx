import { redirect } from "next/navigation";
import OutreachClient from "@/components/ops/OutreachClient";
import { authorizeOps } from "@/lib/ops-auth";
import { loadOutreachOps, type OutreachOpsData } from "@/lib/outreach-ops";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Correo en frío | allok Ops",
  description: "Leads, demos y envíos de la prospección en frío por correo.",
};

export default async function OutreachOpsPage() {
  const authorization = await authorizeOps();
  if (!authorization.authorized) redirect("/ops-login?next=/ops/outreach");

  let data: OutreachOpsData;
  try {
    data = await loadOutreachOps();
  } catch (error) {
    console.error("Could not load /ops/outreach", error);
    data = {
      mode: "no-db",
      warnings: ["No se pudo leer la base. Revisa DATABASE_URL y los logs de Vercel."],
      switch: { dbEnabled: false, effectiveOn: false, reason: "sin base", forcedOff: false, changedAt: null },
      resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
      dailyCap: 20,
      counters: null,
      bounceStopped: false,
      lastRun: null,
      contacts: [],
      error: (error as Error).message,
    };
  }
  return <OutreachClient data={data} />;
}
