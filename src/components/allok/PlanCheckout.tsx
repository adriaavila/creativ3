"use client";

import { useState } from "react";

/**
 * El botón de compra de un plan.
 *
 * Mientras el plan no tenga sus ids de precio en Stripe, `checkoutReady` llega
 * en `false` y el botón abre WhatsApp en vez de un checkout roto. Es la
 * diferencia entre «todavía no se vende solo» y «el botón devuelve un 500».
 */
export default function PlanCheckout({
  billingKey,
  label,
  className,
  checkoutReady,
  fallbackUrl,
}: {
  billingKey: string;
  label: string;
  className: string;
  checkoutReady: boolean;
  fallbackUrl: string;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!checkoutReady) {
    return (
      <a href={fallbackUrl} className={className}>
        {label}
      </a>
    );
  }

  async function start() {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ item: billingKey, locale: "es" }),
      });
      const data = (await response.json()) as { url?: string };
      if (!response.ok || !data.url) throw new Error("checkout");
      window.location.href = data.url;
    } catch {
      // Nunca dejamos al comprador sin salida: si Stripe no responde, queda
      // el camino que siempre funciona.
      setBusy(false);
      setFailed(true);
    }
  }

  if (failed) {
    return (
      <a href={fallbackUrl} className={className}>
        Escribir por WhatsApp
      </a>
    );
  }

  return (
    <button type="button" onClick={start} disabled={busy} className={className}>
      {busy ? "Abriendo…" : label}
    </button>
  );
}
