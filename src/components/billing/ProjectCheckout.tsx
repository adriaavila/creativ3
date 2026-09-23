"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import AllokLogo from "@/components/brand/AllokLogo";

type ProjectCheckoutProps = {
  item: string;
  client?: string;
  eyebrow: string;
  title: string;
  lead: string;
  included: string[];
  priceLabel: string;
  currencySymbol: string;
  amount: string;
  currencyCode: string;
  note: string;
  cta: string;
};

export default function ProjectCheckout({
  item,
  client,
  eyebrow,
  title,
  lead,
  included,
  priceLabel,
  currencySymbol,
  amount,
  currencyCode,
  note,
  cta,
}: ProjectCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const alertRef = useRef<HTMLParagraphElement>(null);

  // El aviso sale debajo del botón. A 320x640 el botón termina casi en el
  // borde de la pantalla, así que el aviso se trae a la vista al aparecer,
  // con 16 px de aire debajo (`scroll-mb-4`).
  useEffect(() => {
    if (error) alertRef.current?.scrollIntoView({ block: "nearest" });
  }, [error]);

  const startCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, client, locale: "es" }),
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
          <AllokLogo variant="wordmark" state="activo" on="ink" className="h-8 w-auto" />
          <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
            <LockKeyhole className="size-3.5" aria-hidden /> Pago seguro
          </span>
        </header>

        {/* Bajo lg la intro se disuelve en la grilla: el monto y el botón quedan
            justo debajo del título, dentro de la primera pantalla. Bajo sm el
            aire vertical se recorta para que a 320x640 el botón entre entero. */}
        <section className="grid flex-1 content-center items-center gap-x-12 px-6 py-14 max-sm:py-8 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-16">
          <div className="max-w-xl max-lg:contents">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              {eyebrow}
            </p>
            <h1 className="text-4xl font-medium tracking-[-0.04em] text-[var(--text-primary)] sm:text-7xl">
              {title}
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-[var(--text-secondary)] max-lg:order-2">{lead}</p>
            <ul className="mt-10 space-y-4 border-t border-[var(--line)] pt-7 text-sm max-lg:order-2">
              {included.map((entry) => (
                <li key={entry} className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <Check className="size-4 text-[var(--lima)]" aria-hidden />
                  {entry}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-y border-[var(--line)] py-8 max-lg:order-1 max-lg:mt-10 lg:border-x lg:px-10">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              {priceLabel}
            </p>
            <div className="mt-4 flex items-start gap-1">
              <span className="mt-3 text-2xl text-[var(--text-primary)]">{currencySymbol}</span>
              <strong className="text-7xl font-medium tracking-[-0.05em] text-[var(--text-primary)]">
                {amount}
              </strong>
              <span className="mt-8 text-sm text-[var(--text-secondary)]">{currencyCode}</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-[var(--text-secondary)]">{note}</p>
            <button
              type="button"
              onClick={startCheckout}
              disabled={loading}
              className="mt-9 max-sm:mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--lima)] px-5 text-sm font-semibold text-[var(--lima-ink)] transition disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
              {loading ? "Abriendo pago seguro…" : cta}
            </button>
            {error ? (
              <p ref={alertRef} role="alert" className="mt-4 scroll-mb-4 text-sm text-[var(--status-lost)]">
                {error}
              </p>
            ) : null}
            <div className="mt-8 flex gap-3 border-t border-[var(--line)] pt-6 text-xs leading-5 text-[var(--text-secondary)]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--lima)]" aria-hidden />
              <p>El pago se procesa en la página protegida de Stripe. Allok no ve ni guarda los datos de tu tarjeta.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
