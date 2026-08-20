import type { Metadata } from "next";
import { getStripePurchaseBySessionId } from "@/lib/stripe-purchases-db";

export const metadata: Metadata = {
  title: "Conectá tu WhatsApp",
  description: "Activación de tu plan de allok.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Confirmación posterior al pago.
 *
 * Antes esta página emparejaba el número por WAHA con un QR. allok se movió a
 * Meta Embedded Signup, donde el enlace de onboarding lo firma Ops por cliente
 * y dura siete días — no hay forma bearer-less de abrirlo, y está bien: es lo
 * que impide que un tercero conecte un número a nombre de otro. Así que acá se
 * confirma el pago y se dice qué sigue, en vez de pedir un escaneo que ya no
 * existe.
 */
function Shell({ tag, title, children }: { tag: string; title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface-0)] px-6">
      <div className="max-w-md rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface-1)] p-8 text-center">
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">{tag}</div>
        <h1 className="text-2xl tracking-[-0.02em] text-[var(--text-primary)]">{title}</h1>
        <div className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</div>
      </div>
    </main>
  );
}

export default async function ConectarWhatsAppPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <Shell tag="Verificación requerida" title="Falta el enlace de tu compra">
        Abrí esta página desde el enlace que recibiste tras el pago. Si lo perdiste, escribinos y te
        lo reenviamos.
      </Shell>
    );
  }

  const purchase = await getStripePurchaseBySessionId(sessionId).catch(() => null);
  if (!purchase) {
    return (
      <Shell tag="Verificación requerida" title="No encontramos esa compra">
        Puede que el pago todavía se esté acreditando. Esperá un minuto y recargá; si sigue igual,
        escribinos con el comprobante y lo resolvemos.
      </Shell>
    );
  }

  return (
    <Shell tag="Pago confirmado" title="Listo, ya tenemos tu pago">
      <p>
        El siguiente paso es conectar tu WhatsApp Business por el canal oficial de Meta. Te
        enviamos un enlace de activación personal —vence a los siete días— al correo de la compra.
      </p>
      <p className="mt-3">
        Conectás tu número sin cambiarlo y sin dejar de usar la app de WhatsApp en tu teléfono.
      </p>
    </Shell>
  );
}
