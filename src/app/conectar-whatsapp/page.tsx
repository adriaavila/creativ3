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
      <main className="flex min-h-screen items-center justify-center bg-[#08090a] px-6 text-white selection:bg-[#0a0a0a] selection:text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white shadow-2xl shadow-black/50">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#c5f04a] mb-2">
            Verificación requerida
          </div>
          <h1 className="text-2xl font-display text-white tracking-[-0.02em]">Falta el enlace de tu compra</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Abrí esta página desde el enlace que recibiste tras el pago. Si lo perdiste, escribinos
            y te lo reenviamos.
          </p>
        </div>
      </main>
    );
  }

  return <PairWhatsAppClient stripeSessionId={sessionId} />;
}
