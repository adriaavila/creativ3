import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Pago completado",
  description: "Tu plan fue procesado. Siguiente paso: conectar tu WhatsApp.",
  robots: { index: false, follow: false },
};

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  premium: "Premium",
};

export default async function PagoExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; session_id?: string; channel?: string }>;
}) {
  const { plan, session_id: sessionId, channel } = await searchParams;
  const planName = plan && plan in PLAN_NAMES ? PLAN_NAMES[plan] : "seleccionado";

  // Cloud API activations go through Meta's Embedded Signup; WAHA pairs by QR
  // on our own page, keyed by the (unguessable) Stripe checkout session id.
  const isCloudApi = channel === "cloud_api";
  const activationHref = isCloudApi
    ? "/embedded-whatsapp"
    : sessionId
      ? `/conectar-whatsapp?session_id=${encodeURIComponent(sessionId)}`
      : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f3ec] px-6 py-32 text-[#1f2a1d]">
      <div className="flex w-full max-w-xl flex-col items-center gap-8 text-center">
        <div className="flex size-20 items-center justify-center rounded-full border border-[#1f2a1d]/15 bg-white">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M6 16L13 23L26 9"
              stroke="#336443"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <div className="mb-4 font-mono text-xs uppercase tracking-widest text-[#336443]">
            Pago confirmado
          </div>
          <h1 className="mb-4 text-4xl font-normal tracking-[-0.02em] sm:text-6xl">
            Plan <em className="italic text-[#336443]">{planName}</em> activo.
          </h1>
          <p className="mx-auto max-w-sm font-mono text-sm leading-relaxed text-[#4b5b47]">
            {isCloudApi
              ? "Falta un paso: conectá tu número por el canal oficial de Meta."
              : "Falta un paso: vinculá tu WhatsApp escaneando un código QR."}
          </p>
        </div>

        <div className="flex w-full flex-col justify-center gap-4 sm:flex-row">
          {activationHref ? (
            <Link
              href={activationHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#336443] px-8 py-3 font-mono text-sm text-white transition-colors duration-300 hover:bg-[#1f2a1d]"
            >
              Conectar mi WhatsApp <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="rounded-full bg-[#336443] px-8 py-3 font-mono text-sm text-white transition-colors duration-300 hover:bg-[#1f2a1d]"
            >
              Escribinos para activar
            </a>
          )}
          <Link
            href="/"
            className="rounded-full border border-[#1f2a1d]/15 px-8 py-3 font-mono text-sm transition-colors duration-300 hover:bg-[#1f2a1d] hover:text-[#f5f3ec]"
          >
            Volver al inicio
          </Link>
        </div>

        <p className="font-mono text-xs text-[#4b5b47]/60">
          ¿Algún problema? Escribinos a{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-2 transition-colors hover:text-[#1f2a1d]"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </main>
  );
}
