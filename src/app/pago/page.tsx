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
    <main className="min-h-screen bg-[var(--surface-0)] px-5 py-6 text-[var(--text-primary)] sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col border border-[var(--line)] bg-[var(--surface-1)] shadow-[var(--shadow-3)] sm:min-h-[calc(100vh-5rem)]">
        <header className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5 sm:px-10">
          <AllokLogo variant="lockup-bare" theme="dark" className="h-8 w-auto" />
          <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
            <LockKeyhole className="size-3.5" aria-hidden /> Pago seguro
          </span>
        </header>

        <section className="grid flex-1 items-center gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-16">
          <div className="max-w-xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Inicio de proyecto
            </p>
            <h1 className="text-5xl font-medium tracking-[-0.04em] text-[var(--text-primary)] sm:text-7xl">
              Tu próxima mejora empieza aquí.
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-[var(--text-secondary)]">
              Reserva el inicio de tu proyecto con Allok. Claridad, dirección y un equipo que convierte la intención
              en algo real.
            </p>
            <ul className="mt-10 space-y-4 border-t border-[var(--line)] pt-7 text-sm">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <Check className="size-4 text-[var(--lima)]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-y border-[var(--line)] py-8 lg:border-x lg:px-10">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Depósito de inicio
            </p>
            <div className="mt-4 flex items-start gap-1">
              <span className="mt-3 text-2xl text-[var(--text-primary)]">$</span>
              <strong className="text-7xl font-medium tracking-[-0.05em] text-[var(--text-primary)]">200</strong>
              <span className="mt-8 text-sm text-[var(--text-tertiary)]">USD</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-[var(--text-secondary)]">
              Pago único. Se confirma al instante y recibes tu comprobante por correo.
            </p>
            <button
              type="button"
              onClick={startCheckout}
              disabled={loading}
              className="mt-9 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--lima)] px-5 text-sm font-semibold text-[var(--lima-ink)] transition disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
              {loading ? "Abriendo pago seguro…" : "Pagar $200 de forma segura"}
            </button>
            {error ? (
              <p role="alert" className="mt-4 text-sm text-[var(--status-lost)]">
                {error}
              </p>
            ) : null}
            <div className="mt-8 flex gap-3 border-t border-[var(--line)] pt-6 text-xs leading-5 text-[var(--text-tertiary)]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--lima)]" aria-hidden />
              <p>El pago se procesa en la página protegida de Stripe. Allok no ve ni guarda los datos de tu tarjeta.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
