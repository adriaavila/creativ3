import type { Metadata } from "next";
import Shell from "@/components/ak/Shell";
import CabeceraPortada from "@/components/vitrina/CabeceraPortada";
import { Pie } from "@/components/vitrina/Cierre";
import CierreLazo from "@/components/vitrina/CierreLazo";
import ManosTrazo from "@/components/vitrina/ManosTrazo";
import { prefill, whatsappUrl } from "@/lib/contact";

export const metadata: Metadata = {
  title: { absolute: "Aquí no hay nada · allok" },
  robots: { index: false },
};

/**
 * La página que no existe, con la misma mano que la portada: el dibujo de las
 * manos con el lazo abierto (un toque lo cierra, como en el cierre de la
 * portada) y tres salidas. Antes era el 404 blanco de Next, en inglés.
 */
export default function NotFound() {
  return (
    <Shell>
      <CabeceraPortada />
      <main id="contenido" className="no-existe">
        <section className="closer cierre" data-theme="ink" aria-labelledby="no-existe-titulo">
          <CierreLazo>
            <ManosTrazo />
          </CierreLazo>
          <div className="cierre-cuerpo">
            <p className="label">404</p>
            <h1 id="no-existe-titulo" className="headline cierre-titulo">
              Aquí no hay nada.
            </h1>
            <p className="cierre-bio">Esta página no existe o cambió de lugar.</p>
            <nav className="no-existe-salidas" aria-label="Salidas">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- <a> simple: next/link aquí sumaba JS a la portada */}
              <a className="btn btn-primary" href="/">
                Volver al inicio
              </a>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- ídem */}
              <a className="btn btn-outline" href="/trabajo">
                Todo el trabajo
              </a>
              <a className="btn btn-link" href={whatsappUrl(prefill())} target="_blank" rel="noopener noreferrer">
                Escríbeme por WhatsApp
              </a>
            </nav>
          </div>
        </section>
      </main>
      <Pie />
    </Shell>
  );
}
