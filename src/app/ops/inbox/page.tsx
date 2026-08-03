import { redirect } from "next/navigation";
import { authorizeOps, isOpsAuthConfigured } from "@/lib/ops-auth";
import { getConversationById, listConversations } from "@/lib/whatsapp-inbox-db";
import InboxClient from "@/components/ops/InboxClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inbox WhatsApp | allok Ops",
  description: "Bandeja unificada de conversaciones de WhatsApp (Cloud API + WAHA).",
};

export default async function OpsInboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ conversation?: string | string[] }>;
}) {
  if (!isOpsAuthConfigured() || !process.env.DATABASE_URL) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090a] p-6 text-white">
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#c5f04a]">
            Setup requerido
          </div>
          <h1 className="mt-4 font-display text-5xl leading-[0.9]">
            El inbox está listo para conectarse.
          </h1>
          <p className="mt-5 text-sm leading-6 text-white/50">
            Configura OPS_ACCESS_PASSWORD, OPS_SESSION_SECRET y DATABASE_URL, corre la migración
            006 y vuelve a cargar esta ruta.
          </p>
        </div>
      </main>
    );
  }

  const authorization = await authorizeOps();
  if (!authorization.authorized) redirect("/ops-login?next=/ops/inbox");

  const query = searchParams ? await searchParams : {};
  const rawId = typeof query.conversation === "string" ? query.conversation : "";
  const requestedId = /^\d+$/.test(rawId) && Number(rawId) > 0 ? Number(rawId) : null;
  const [listed, requested] = await Promise.all([
    listConversations().catch(() => []),
    requestedId ? getConversationById(requestedId).catch(() => null) : null,
  ]);
  const conversations = requested && !listed.some(({ id }) => id === requested.id)
    ? [requested, ...listed]
    : listed;
  const initialSelectedId = requested?.id ?? conversations[0]?.id ?? null;

  return <InboxClient key={initialSelectedId ?? "empty"} initialConversations={conversations} initialSelectedId={initialSelectedId} />;
}
