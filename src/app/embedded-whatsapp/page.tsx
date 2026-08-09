import AllokLogo from "@/components/brand/AllokLogo";
import EmbeddedSignupClient from "@/components/whatsapp/EmbeddedSignupClient";
import OpsShell from "@/components/ops/OpsShell";
import { authorizeOps } from "@/lib/ops-auth";
import { verifyMetaOnboardingInvite } from "@/lib/meta/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conectar WhatsApp oficial | allok",
  description: "Conecta tu número de WhatsApp Business con allok mediante Meta Embedded Signup.",
};

export default async function EmbeddedWhatsappPage({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string; client?: string; mode?: string; invite?: string }>;
}) {
  const params = await searchParams;
  const authorization = await authorizeOps();
  const requestedWorkspace = params.workspace ?? params.client;
  const connectionMode = params.mode === "cloud_api" ? "META_CLOUD_API" : "META_COEXISTENCE";
  const workspace =
    requestedWorkspace && /^[a-zA-Z0-9._-]{1,80}$/.test(requestedWorkspace)
      ? requestedWorkspace
      : authorization.authorized
        ? authorization.userId
        : null;

  if (!workspace) {
    return <InvalidOnboardingLink />;
  }

  if (!authorization.authorized) {
    const invite = verifyMetaOnboardingInvite(params.invite);
    if (
      !invite ||
      invite.workspace !== workspace ||
      invite.connection_mode !== connectionMode
    ) {
      return <InvalidOnboardingLink />;
    }
  }

  // `?mode=cloud_api` onboards a number that is NOT on the WhatsApp Business app.
  // Anything else stays coexistence, the safe default: it never registers a number
  // that is already live in a client's phone.
  const content = (
    <EmbeddedSignupClient
      workspace={workspace}
      connectionMode={connectionMode}
      publicAccess={!authorization.authorized}
      invite={authorization.authorized ? undefined : params.invite}
    />
  );

  return authorization.authorized ? <OpsShell>{content}</OpsShell> : content;
}

function InvalidOnboardingLink() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f7f8fa] px-6 text-[#142b4b]">
      <section className="w-full max-w-lg border border-[#dce2e8] bg-white p-8 text-center shadow-sm">
        <AllokLogo variant="mark" theme="light" className="mx-auto size-11" />
        <h1 className="mt-5 font-display text-2xl font-semibold">Este enlace no es válido</h1>
        <p className="mt-3 text-sm leading-6 text-[#657386]">
          Por seguridad, los enlaces para conectar WhatsApp vencen. Pídele a tu contacto de
          Allok que genere uno nuevo; no necesitas iniciar sesión.
        </p>
      </section>
    </main>
  );
}
