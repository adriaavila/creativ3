import type { Metadata } from "next";
import Shell from "@/components/ak/Shell";
import CabeceraPortada from "@/components/vitrina/CabeceraPortada";
import { Pie } from "@/components/vitrina/Cierre";
import CierreLazo from "@/components/vitrina/CierreLazo";
import ManosTrazo from "@/components/vitrina/ManosTrazo";
import { prefill, whatsappUrl } from "@/lib/contact";

export const metadata: Metadata = {
  title: { absolute: "Nothing here · allok" },
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
              Nothing here.
            </h1>
            <p className="cierre-bio">This page doesn&apos;t exist or has moved.</p>
            <nav className="no-existe-salidas" aria-label="Ways out">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- <a> simple: next/link aquí sumaba JS a la portada */}
              <a className="btn btn-primary" href="/">
                Back home
              </a>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- ídem */}
              <a className="btn btn-outline" href="/trabajo">
                All the work
              </a>
              <a className="btn btn-link" href={whatsappUrl(prefill())} target="_blank" rel="noopener noreferrer">
                Message me on WhatsApp
              </a>
            </nav>
          </div>
        </section>
      </main>
      <Pie />
    </Shell>
  );
}
