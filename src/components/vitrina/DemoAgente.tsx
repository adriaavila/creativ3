"use client";

import { useArmarDemo } from "@/components/allok/useArmarDemo";
import { HOME_WHATSAPP_MESSAGE, whatsappUrl } from "@/lib/contact";

const NOTA = "Gratis y sin cuenta. En unos 30 segundos le escribes como si fueras tu cliente. Lo que tu web no dice, no lo inventa.";

// Lo que el dueño puede corregir en el formulario: ahí vale el mensaje de la API tal cual.
const CORREGIBLE = new Set(["invalid", "bad_url"]);
// Lo que falla por la web que pegó (un perfil de Instagram, una web que no abre o no dice nada).
const POR_LA_DIRECCION = new Set(["walled_site", "unreadable", "empty"]);

/**
 * La demo del agente en la portada: la misma lógica que «Arma tu demo» en
 * /agente-whatsapp (`useArmarDemo`), con el marcado del sistema. Cada campo es
 * una fila `.cmd-field` con su etiqueta a la vista; la nota de abajo cuenta la
 * espera y, si algo falla, lo dice. Mientras arma, los campos quedan de solo
 * lectura y el botón inactivo pero enfocable: el foco no se pierde.
 *
 * La API, cuando no puede, manda a crear una cuenta; en la portada no hay
 * cuenta que crear, así que fuera de los errores del formulario la salida es
 * la de toda la página: WhatsApp.
 */
export default function DemoAgente({ titulo }: { titulo: string }) {
  const { name, setName, website, setWebsite, busy, paso, error, codigo, submit } = useArmarDemo();
  const describe = "demo-agente-nota demo-agente-error";

  return (
    <>
      <p id="demo-agente-titulo" className="label">
        {titulo}
      </p>
      {/* Sin aria-busy en el formulario: callaría los pasos que la nota va anunciando. */}
      <form onSubmit={submit} className="demo" aria-labelledby="demo-agente-titulo">
        <label className="cmd-field">
          <span className="label">Tu negocio</span>
          <input
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={busy}
            placeholder="Clínica Sonrisa"
            autoComplete="organization"
            aria-describedby={describe}
          />
        </label>
        <label className="cmd-field">
          <span className="label">Tu web</span>
          <input
            required
            minLength={3}
            maxLength={300}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            readOnly={busy}
            placeholder="clinicasonrisa.mx"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={describe}
            aria-invalid={codigo === "bad_url" || undefined}
          />
        </label>
        <button type="submit" className="btn btn-primary" aria-disabled={busy || undefined}>
          {busy ? (
            "Armando…"
          ) : (
            <>
              Ver a mi agente <span className="arw arw-r" aria-hidden="true">→</span>
            </>
          )}
        </button>
        <div className="body-sm demo-nota">
          <p id="demo-agente-nota" aria-live="polite">
            {error ? null : busy ? paso : NOTA}
          </p>
          <p id="demo-agente-error" className="demo-error" role="alert">
            {!error ? null : codigo && CORREGIBLE.has(codigo) ? (
              error
            ) : (
              <>
                No se pudo armar la demo {codigo && POR_LA_DIRECCION.has(codigo) ? "con esa dirección" : "ahora"}.{" "}
                <a href={whatsappUrl(HOME_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
                  Escríbeme por WhatsApp
                </a>{" "}
                y lo vemos.
              </>
            )}
          </p>
        </div>
      </form>
    </>
  );
}
