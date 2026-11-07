import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Rise, vars } from "@/components/ak/Brand";
import { CONTACT_EMAIL } from "@/lib/contact";
import CierreLazo from "./CierreLazo";
import ManosTrazo from "./ManosTrazo";

// El número se muestra cuando Adrián lo confirme; hasta entonces, la salida es la barra.
const MOSTRAR_NUMERO = false;
const NUMERO = "+1 347 974 5199";

const RETRATO = "/adrian/retrato-64.avif";
const FIRMA = "/adrian/firma.svg";
// La altura de la firma en pantalla (40-obras.src.css, .cierre-firma).
const FIRMA_ALTO = 48;
const enPublic = (ruta: string) => join(process.cwd(), "public", ruta);

// El colofón, como comentario en el HTML: a la vista vive en el pie de /trabajo.
const COLOFON = "<!-- Geist by Vercel and basement.studio · three.js by Mr.doob · hecho con agentes de IA · Edición 2026 -->";

/**
 * La firma, si existe: sus trazos van en línea para que se dibujen solos, en
 * el orden en que se escribieron, en 700 ms. Tiene que ser una línea (trazo
 * central), no un contorno relleno. Si el archivo no está o no se entiende,
 * no hay firma y la línea de la bio queda sola.
 */
function leerFirma(): { viewBox: string; pluma: number; trazos: string[] } | null {
  if (!existsSync(enPublic(FIRMA))) return null;
  const svg = readFileSync(enPublic(FIRMA), "utf8");
  const viewBox = /\bviewBox="([^"]+)"/.exec(svg)?.[1];
  const trazos = [...svg.matchAll(/<path\b[^>]*?\sd="([^"]+)"/g)].map((m) => m[1]).filter((d): d is string => !!d);
  const alto = Number(viewBox?.trim().split(/[\s,]+/)[3]);
  if (!viewBox || !trazos.length || !(alto > 0)) return null;
  // Se ve a FIRMA_ALTO px de alto: la pluma de 2 px, en las unidades de su propio dibujo.
  return { viewBox, pluma: +((2 * alto) / FIRMA_ALTO).toFixed(3), trazos };
}

/**
 * El cierre de la portada, en Ink: el mismo dibujo de las manos con el lazo
 * ABIERTO (CierreLazo; un toque lo cierra), «Te toca.», quién es y la promesa
 * del precio. La barra de WhatsApp atraca justo debajo (es el último hijo de
 * .lienzo): por eso aquí no hay botón, y en pantalla ancha el precio va a la
 * derecha, sobre el botón compacto. Foto y firma solo si sus archivos existen.
 */
export default function Cierre() {
  const retrato = existsSync(enPublic(RETRATO));
  const firma = leerFirma();
  return (
    <section id="contacto" className="closer cierre" data-theme="ink" data-stagger="" aria-labelledby="cierre-titulo">
      {/* A todo el ancho, como las manos de arriba: los brazos llegan desde el borde de la pantalla, no desde la columna. */}
      <CierreLazo>
        <ManosTrazo />
      </CierreLazo>
      <div className="cierre-cuerpo">
        <h2 id="cierre-titulo" className="headline cierre-titulo" data-reveal="rise">
          <Rise>Te toca.</Rise>
        </h2>
        <div className="cierre-quien">
          {retrato ? (
            // Ya viene a 64 px y en AVIF: el optimizador de imágenes solo sumaría un viaje.
            // eslint-disable-next-line @next/next/no-img-element
            <img className="cierre-retrato" src={RETRATO} alt="Adrián Avila" width={64} height={64} loading="lazy" decoding="async" />
          ) : null}
          <div className="cierre-quien-texto">
            {firma ? (
              <svg className="cierre-firma" viewBox={firma.viewBox} aria-hidden="true" focusable="false" data-reveal="draw" style={vars({ "--d": "200ms", "--pluma": firma.pluma })}>
                {firma.trazos.map((d, k) => (
                  <path
                    key={d}
                    className="trazo"
                    pathLength={1}
                    d={d}
                    style={vars({ "--trazo-0": +(k / firma.trazos.length).toFixed(4), "--trazo-f": +(1 / firma.trazos.length).toFixed(4) })}
                  />
                ))}
              </svg>
            ) : null}
            <p className="cierre-bio">Ingeniero industrial. Trabajo con agentes de IA.</p>
          </div>
        </div>
      </div>
      <p className="cierre-precio">Precio cerrado antes de empezar.</p>
      {MOSTRAR_NUMERO ? <p className="cierre-numero tnum">{NUMERO}</p> : null}
    </section>
  );
}

/**
 * El pie de la portada, después de donde atraca la barra: el correo, la
 * privacidad y la edición, cada uno de 44 px de alto como mínimo. El colofón
 * va como comentario en el HTML.
 */
export function Pie() {
  return (
    <footer className="pie" data-theme="ink">
      <a className="pie-item" href={`mailto:${CONTACT_EMAIL}`}>
        {CONTACT_EMAIL}
      </a>
      <span className="pie-punto" aria-hidden="true">
        ·
      </span>
      {/* Un <a> simple, como en la fila de los 19: la portada no carga next/link. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a propósito, ver la línea de arriba */}
      <a className="pie-item" href="/es/privacidad">
        Privacidad
      </a>
      <span className="pie-punto" aria-hidden="true">
        ·
      </span>
      <span className="pie-item">Edición 2026</span>
      <span hidden dangerouslySetInnerHTML={{ __html: COLOFON }} />
    </footer>
  );
}
