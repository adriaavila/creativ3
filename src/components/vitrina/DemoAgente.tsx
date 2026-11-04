"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useArmarDemo } from "@/components/allok/useArmarDemo";
import { prefill, whatsappUrl } from "@/lib/contact";

// Lo que el dueño puede corregir en el formulario: ahí vale el mensaje de la API tal cual.
const CORREGIBLE = new Set(["invalid", "bad_url"]);
// Lo que falla por la web que pegó (un perfil de Instagram, una web que no abre o no dice nada).
const POR_LA_DIRECCION = new Set(["walled_site", "unreadable", "empty"]);

// El dibujo de la espera, en px (112 × 40): cuatro rayas a 45° que apuntan a la cola de la burbuja.
const RAYAS = [0, 1, 2, 3].map((k) => `M${4 + 10 * k} 26L${12 + 10 * k} 18`);
// La burbuja de WhatsApp, vacía, con la cola arriba a la izquierda como un mensaje que llega.
const BURBUJA = "M48 6H100A8 8 0 0 1 108 14V30A8 8 0 0 1 100 38H64A8 8 0 0 1 56 30V14Z";

/**
 * Lo que tarda el lazo en cerrarse, leído de los tokens: el arco (--duration-slow) y después el punto
 * (--duration-base). Con movimiento reducido los tokens valen 0 y la demo se abre en el acto.
 */
function cierre(el: Element | null): number {
  if (!el) return 0;
  const s = getComputedStyle(el);
  const ms = (v: string) => (v.trim().endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000) || 0;
  return ms(s.getPropertyValue("--duration-slow")) + ms(s.getPropertyValue("--duration-base"));
}

/**
 * La demo del agente en la portada: la misma lógica que «Arma tu demo» en
 * /agente-whatsapp (`useArmarDemo`), con el marcado del sistema. Mientras
 * arma, cada paso real del hook dibuja una raya a 45° (400 ms) hacia una
 * burbuja vacía: nada se escribe antes de que la API conteste. El lazo de
 * 24 px se cierra dentro de la burbuja solo cuando la API dice que sí (y
 * sigue la redirección de siempre); si falla, el mensaje lo dice y el lazo
 * queda abierto. En reposo no hay más texto que las etiquetas y el botón.
 *
 * Los campos quedan de solo lectura mientras arma y el botón inactivo pero
 * enfocable: el foco no se pierde. Los pasos se anuncian en una región viva
 * que no se ve. Las filas entran con motion.js, que puede ponerles .is-in
 * antes de hidratar: de ahí suppressHydrationWarning. La API, cuando no
 * puede, manda a crear una cuenta; en la portada no hay cuenta que crear,
 * así que fuera de los errores del formulario la salida es WhatsApp. La
 * marca de 24 px (`marca`, el MarkSvg) la pone el servidor.
 */
export default function DemoAgente({ tituloId, marca }: { tituloId: string; marca: ReactNode }) {
  const espera = useRef<HTMLDivElement>(null);
  // La API dijo que sí: el lazo se cierra (el arco y después el punto) y recién entonces se va a la demo.
  const [listo, setListo] = useState(false);
  const { name, setName, website, setWebsite, busy, paso, error, codigo, submit } = useArmarDemo({
    antesDeIr: () => {
      setListo(true);
      return new Promise<void>((ir) => window.setTimeout(ir, cierre(espera.current)));
    },
  });
  // Cuántos pasos se vieron en esta vuelta: uno por raya.
  const [visto, setVisto] = useState<{ paso: string; n: number } | null>(null);
  if (busy && visto?.paso !== paso) setVisto({ paso, n: Math.min((visto?.n ?? 0) + 1, RAYAS.length) });
  const rayas = visto?.n ?? 0;
  const cerrado = listo && busy && !error;
  const describe = "demo-agente-nota demo-agente-error";

  async function enviar(e: FormEvent) {
    if (busy) {
      e.preventDefault();
      return;
    }
    setVisto(null);
    setListo(false);
    await submit(e);
  }

  return (
    // Sin aria-busy en el formulario: callaría los pasos que la región viva va anunciando.
    <form onSubmit={enviar} className="agente-form" aria-labelledby={tituloId}>
      <label className="cmd-field agente-campo" data-reveal="row" suppressHydrationWarning>
        <span className="label">Tu negocio</span>
        <input
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          readOnly={busy}
          placeholder="p. ej. Panadería Luz"
          autoComplete="organization"
          aria-describedby={describe}
        />
      </label>
      <label className="cmd-field agente-campo" data-reveal="row" suppressHydrationWarning>
        <span className="label">Tu web</span>
        <input
          required
          minLength={3}
          maxLength={300}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          readOnly={busy}
          placeholder="p. ej. panaderialuz.com"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby={describe}
          aria-invalid={codigo === "bad_url" || undefined}
        />
      </label>
      <div className="agente-envio" data-reveal="row" suppressHydrationWarning>
        <button type="submit" className="btn btn-outline" aria-disabled={busy || undefined}>
          {busy ? "Armando…" : "Armar mi demo"}
        </button>
        <div ref={espera} className="agente-espera" data-cerrado={cerrado ? "" : undefined} aria-hidden="true">
          <svg className="agente-dibujo" viewBox="0 0 112 40" focusable="false">
            <path className="agente-burbuja" pathLength={1} d={BURBUJA} data-on={rayas > 0 ? "" : undefined} />
            {RAYAS.map((d, k) => (
              <path key={d} className="agente-raya" pathLength={1} d={d} data-on={k < rayas ? "" : undefined} />
            ))}
          </svg>
          <span className="agente-marca">{marca}</span>
        </div>
      </div>
      <p id="demo-agente-nota" className="agente-paso" aria-live="polite">
        {busy && !cerrado ? paso : null}
      </p>
      <p id="demo-agente-error" className="agente-error" role="alert">
        {!error ? null : codigo && CORREGIBLE.has(codigo) ? (
          error
        ) : (
          <>
            No se pudo armar la demo {codigo && POR_LA_DIRECCION.has(codigo) ? "con esa dirección" : "ahora"}.{" "}
            <a href={whatsappUrl(prefill("agente"))} target="_blank" rel="noopener noreferrer">
              Escríbeme por WhatsApp
            </a>{" "}
            y lo vemos.
          </>
        )}
      </p>
    </form>
  );
}
