import type { Metadata } from "next";
import PairWhatsAppClient from "@/components/whatsapp/PairWhatsAppClient";

export const metadata: Metadata = {
  title: "Conectá tu WhatsApp",
  description: "Vinculá tu número de WhatsApp para activar tu plan.",
  robots: { index: false, follow: false },
};

export default async function ConectarWhatsAppPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--surface-0)] px-6">
        <div className="max-w-md rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface-1)] p-8 text-center">
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Verificación requerida
          </div>
          <h1 className="text-2xl tracking-[-0.02em] text-[var(--text-primary)]">Falta el enlace de tu compra</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            Abrí esta página desde el enlace que recibiste tras el pago. Si lo perdiste, escribinos
            y te lo reenviamos.
          </p>
        </div>
      </main>
    );
  }

  return <PairWhatsAppClient stripeSessionId={sessionId} />;
}
