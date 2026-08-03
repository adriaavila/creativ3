import { redirect } from "next/navigation";
import EmbeddedSignupClient from "@/components/whatsapp/EmbeddedSignupClient";
import OpsShell from "@/components/ops/OpsShell";
import { authorizeOps } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conectar WhatsApp oficial | allok",
  description: "Conecta tu número de WhatsApp Business con allok mediante Meta Embedded Signup.",
};

export default async function EmbeddedWhatsappPage({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string; client?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const authorization = await authorizeOps();
  if (!authorization.authorized) {
    const next = new URLSearchParams();
    if (params.workspace || params.client) next.set("workspace", params.workspace ?? params.client ?? "");
    if (params.mode) next.set("mode", params.mode);
    redirect(`/ops-login?next=${encodeURIComponent(`/embedded-whatsapp${next.size ? `?${next}` : ""}`)}`);
  }

  const requestedWorkspace = params.workspace ?? params.client;
  const workspace =
    requestedWorkspace && /^[a-zA-Z0-9._-]{1,80}$/.test(requestedWorkspace)
      ? requestedWorkspace
      : authorization.userId;

  // `?mode=cloud_api` onboards a number that is NOT on the WhatsApp Business app.
  // Anything else stays coexistence, the safe default: it never registers a number
  // that is already live in a client's phone.
  const connectionMode = params.mode === "cloud_api" ? "META_CLOUD_API" : "META_COEXISTENCE";

  return (
    <OpsShell>
      <EmbeddedSignupClient workspace={workspace} connectionMode={connectionMode} />
    </OpsShell>
  );
}
