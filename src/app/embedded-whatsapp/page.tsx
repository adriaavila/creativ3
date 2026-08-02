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
  searchParams: Promise<{ workspace?: string; client?: string }>;
}) {
  const params = await searchParams;
  const authorization = await authorizeOps();
  if (!authorization.authorized) {
    const next = new URLSearchParams();
    if (params.workspace || params.client) next.set("workspace", params.workspace ?? params.client ?? "");
    redirect(`/ops-login?next=${encodeURIComponent(`/embedded-whatsapp${next.size ? `?${next}` : ""}`)}`);
  }

  const requestedWorkspace = params.workspace ?? params.client;
  const workspace =
    requestedWorkspace && /^[a-zA-Z0-9._-]{1,80}$/.test(requestedWorkspace)
      ? requestedWorkspace
      : authorization.userId;

  return (
    <OpsShell>
      <EmbeddedSignupClient workspace={workspace} />
    </OpsShell>
  );
}
