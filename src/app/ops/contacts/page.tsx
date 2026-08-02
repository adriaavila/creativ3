import { redirect } from "next/navigation";
import ContactsClient from "@/components/ops/ContactsClient";
import { getGrowthLeads, isGrowthDatabaseConfigured } from "@/lib/growth-db";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";
import { listConversations } from "@/lib/whatsapp-inbox-db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contactos | allok Ops",
  description: "Directorio real de contactos, leads y conversaciones de WhatsApp.",
};

export default async function OpsContactsPage() {
  if (!isOpsAuthConfigured() || !isGrowthDatabaseConfigured()) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f7f8fa] p-6 text-[#142b4b]">
        <div className="max-w-xl rounded-xl border border-[#e2e7ed] bg-white p-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a8797]">Setup requerido</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">Contactos listos para conectarse.</h1>
          <p className="mt-4 text-sm leading-6 text-[#68778a]">Configura OPS_ACCESS_PASSWORD, OPS_SESSION_SECRET y DATABASE_URL para cargar el directorio real.</p>
        </div>
      </main>
    );
  }

  const authorization = await authorizeOps();
  if (!authorization.authorized) redirect("/ops-login?next=/ops/contacts");

  const [leads, conversations] = await Promise.all([
    getGrowthLeads(200),
    listConversations(200).catch(() => []),
  ]);

  return <ContactsClient initialLeads={leads} initialConversations={conversations} />;
}
