"use client";

import { useArmarDemo } from "./useArmarDemo";

/**
 * «Arma tu demo» en /agente-whatsapp: el dueño pega su web y en ~30 segundos
 * le escribe a un agente que ya conoce su negocio. La lógica vive en
 * `useArmarDemo`, que comparte con la demo de la portada; aquí, solo el marcado.
 */
export default function ArmaTuDemo() {
  const { name, setName, website, setWebsite, busy, paso, error, submit } = useArmarDemo();

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
          className="min-h-12 w-full rounded-[4px] border border-[#d9dddf] bg-white px-4 text-[16px] text-[var(--ink)] outline-none transition-[border-color] placeholder:text-[var(--ink-40)] focus:border-[var(--ink)]"
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
          className="min-h-12 w-full rounded-[4px] border border-[#d9dddf] bg-white px-4 text-[16px] text-[var(--ink)] outline-none transition-[border-color] placeholder:text-[var(--ink-40)] focus:border-[var(--ink)]"
        />
      </label>
      <button type="submit" disabled={busy} className="allok-btn min-h-12 bg-[var(--signal)] text-white disabled:opacity-70">
        {busy ? "Armando…" : "Ver a mi agente"}
      </button>
      <p id="arma-demo-nota" className="text-[14px] leading-relaxed text-[var(--ink-60)] sm:col-span-3" aria-live="polite">
        {error ? (
          <span role="alert" className="text-[#a23b00]">
            {error}
          </span>
        ) : busy ? (
          paso
        ) : (
          "Sin cuenta y sin tarjeta. Lee solo lo público de tu web y no inventa lo que no está ahí."
        )}
      </p>
    </form>
  );
}
