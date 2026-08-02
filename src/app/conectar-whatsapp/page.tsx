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
      <main className="studio flex min-h-screen items-center justify-center bg-white px-6 text-black selection:bg-[#c5f04a] selection:text-black">
        <div className="max-w-md rounded-3xl border border-black/10 bg-[var(--studio-surface)] p-8 text-center text-black">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
            Verificación requerida
          </div>
          <h1 className="text-2xl text-black tracking-[-0.02em]">Falta el enlace de tu compra</h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Abrí esta página desde el enlace que recibiste tras el pago. Si lo perdiste, escribinos
            y te lo reenviamos.
          </p>
        </div>
      </main>
    );
  }

  return <PairWhatsAppClient stripeSessionId={sessionId} />;
}
