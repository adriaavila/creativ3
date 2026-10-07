"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * «Arma tu demo» en la portada: el dueño pega su web y en ~30 segundos le
 * escribe a un agente que ya conoce su negocio (`/demo/<slug>?tuya=1`), antes
 * de crear cuenta. Lo pesado vive en `/api/demo/crear`.
 */

const STEPS = ["Abriendo tu web…", "Leyendo tus servicios y precios…", "Enseñándole a tu agente…", "Casi listo…"];

export default function ArmaTuDemo() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // La espera se cuenta: cada paso se ve unos segundos, el último se queda.
  useEffect(() => {
    if (!busy) return;
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 7000);
    return () => window.clearInterval(id);
  }, [busy]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setStep(0);
    setBusy(true);
    const res = await fetch("/api/demo/crear", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, website }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { slug?: string; error?: { message?: string } } | null;
    if (res?.ok && data?.slug) {
      router.push(`/demo/${data.slug}?tuya=1`);
      return;
    }
    setBusy(false);
    setError(data?.error?.message ?? "No pudimos armar la demo ahora. Prueba de nuevo en un momento.");
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-end" aria-describedby="arma-demo-nota">
      <label className="grid min-w-0 gap-1.5">
        <span className="mono text-[var(--ink-60)]">Tu negocio</span>
        <input
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
          placeholder="Clínica Sonrisa"
          autoComplete="organization"
          className="min-h-12 w-full rounded-[12px] border border-[rgba(11,13,14,.18)] bg-white px-4 text-[16px] text-[var(--ink)] outline-none transition-[border-color] placeholder:text-[var(--ink-40)] focus:border-[var(--ink)]"
        />
      </label>
      <label className="grid min-w-0 gap-1.5">
        <span className="mono text-[var(--ink-60)]">Tu web</span>
        <input
          required
          minLength={3}
          maxLength={300}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          disabled={busy}
          placeholder="clinicasonrisa.mx"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          spellCheck={false}
          className="min-h-12 w-full rounded-[12px] border border-[rgba(11,13,14,.18)] bg-white px-4 text-[16px] text-[var(--ink)] outline-none transition-[border-color] placeholder:text-[var(--ink-40)] focus:border-[var(--ink)]"
        />
      </label>
      <button type="submit" disabled={busy} className="allok-btn min-h-12 bg-[var(--ink)] font-semibold text-[var(--cloud)] disabled:opacity-70">
        {busy ? "Armando…" : "Ver a mi agente"}
      </button>
      <p id="arma-demo-nota" className="text-[14px] leading-relaxed text-[var(--ink-60)] sm:col-span-3" aria-live="polite">
        {error ? (
          <span role="alert" className="text-[#a23b00]">
            {error}
          </span>
        ) : busy ? (
          STEPS[step]
        ) : (
          "Sin cuenta y sin tarjeta. Lee solo lo público de tu web y no inventa lo que no está ahí."
        )}
      </p>
    </form>
  );
}
