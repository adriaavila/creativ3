"use client";

import { useState } from "react";
import { Check, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import AllokLogo from "@/components/brand/AllokLogo";

const INCLUDED = [
  "Reserva de tu espacio de trabajo",
  "Sesión de dirección y alcance",
  "Plan de acción para tu proyecto",
];

export default function ProjectPaymentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: "project-deposit", locale: "es" }),
      });
      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error("Checkout unavailable");
      window.location.assign(data.url);
    } catch {
      setError("No pudimos abrir el pago seguro. Intenta nuevamente o contáctanos.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f4] px-5 py-6 text-[#0a0a0a] sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:min-h-[calc(100vh-5rem)]">
        <header className="flex items-center justify-between border-b border-black/10 px-6 py-5 sm:px-10">
          <AllokLogo variant="lockup-bare" theme="light" className="h-8 w-auto" />
          <span className="inline-flex items-center gap-2 text-xs font-medium text-[#5d5d5d]">
            <LockKeyhole className="size-3.5" /> Pago seguro
          </span>
        </header>

        <section className="grid flex-1 items-center gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-16">
          <div className="max-w-xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-[#6b6b6b]">Inicio de proyecto</p>
            <h1 className="text-5xl font-semibold tracking-[-0.06em] sm:text-7xl">Tu próxima mejora empieza aquí.</h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-[#5d5d5d]">
              Reserva el inicio de tu proyecto con allok. Claridad, dirección y un equipo que convierte la intención en algo real.
            </p>
            <ul className="mt-10 space-y-4 border-t border-black/10 pt-7 text-sm">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-center gap-3"><Check className="size-4 text-[#6b8d13]" />{item}</li>
              ))}
            </ul>
          </div>

          <div className="border-y border-black/10 py-8 lg:border-x lg:px-10">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#6b6b6b]">Depósito de inicio</p>
            <div className="mt-4 flex items-start gap-1"><span className="mt-3 text-2xl">$</span><strong className="text-7xl font-semibold tracking-[-0.08em]">200</strong><span className="mt-8 text-sm text-[#6b6b6b]">USD</span></div>
            <p className="mt-5 text-sm leading-6 text-[#5d5d5d]">Pago único. Se confirma al instante y recibes tu comprobante por correo.</p>
            <button
              type="button"
              onClick={startCheckout}
              disabled={loading}
              className="mt-9 flex w-full items-center justify-center gap-2 bg-[#0a0a0a] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#282828] disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {loading ? "Abriendo pago seguro…" : "Pagar $200 de forma segura"}
            </button>
            {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
            <div className="mt-8 flex gap-3 border-t border-black/10 pt-6 text-xs leading-5 text-[#6b6b6b]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#6b8d13]" />
              <p>El pago se procesa en la página protegida de Stripe. allok no ve ni guarda los datos de tu tarjeta.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
