import type { CSSProperties } from "react";
import { MarkSvg, vars } from "@/components/ak/Brand";
import type { Captura, Historia } from "@/lib/historias";
import Glifo from "./Glifo";
import MarcoAbierto from "./MarcoAbierto";
import { propsDeImagen } from "./imagen";

// El paspartú, en fracción del ancho del marco, para saber dónde caen sus esquinas (40-obras.src.css pone los px).
const PASPARTU = 0.045;
const PASPARTU_CELULAR = 0.09;
// La segunda pantalla de Mística se dibuja 120 ms después que la primera.
const SEGUNDA = 120;

/**
 * Lo que el navegador baja de cada captura: el ancho real de la captura dentro
 * del marco (88vw menos el paspartú en el celular; en la pantalla grande, el
 * tope del marco). Con 16/10 en un celular de 390 px a 3x pide 1080w (unos
 * 40 KB en WebP); cada pantalla de celular, la mitad.
 */
const TAMANOS = {
  ventana: "(max-width: 759px) calc(88vw - 32px), (max-width: 1181px) 83vw, 968px",
  celular: "(max-width: 759px) calc(44vw - 40px), (max-width: 1181px) 39vw, 418px",
};

/**
 * Un trabajo: su captura real dentro del marco abierto, la marca que lo
 * cierra en la esquina, y debajo la placa (el dibujo, el nombre, de quién es
 * y su línea). Nada más: lo largo vive en la ficha, que abre la captura.
 *
 * Cuando el marco está al 60 % en pantalla, una sola vez: el marco se dibuja
 * (700 ms), el dibujo junto al nombre (desde los 200 ms), la captura sube
 * 8 px (desde los 500 ms) y la marca cierra el lazo (desde los 900 ms). Marco,
 * captura y marca miden lo mismo, así que entran juntos. Cuadra va en el
 * campo azul de la página, con el dibujo en Cloud.
 */
export default function Obra({ historia: h }: { historia: Historia }) {
  const celular = h.capturas.every((c) => c.celular);
  const nombre = `${h.id}-nombre`;
  const campo = h.campo ? { "data-theme": "blue", "data-campo": "", "data-reveal": "field" } : { "data-theme": "cloud" };
  return (
    <article
      className={celular ? "obra obra-celular" : "obra"}
      id={h.id}
      data-pieza={h.nombre}
      data-stagger=""
      aria-labelledby={nombre}
      style={vars({ "--proporcion": +(celular ? h.capturas[0].ratio : 16 / 10).toFixed(4) })}
      {...campo}
    >
      <div className="obra-piezas">
        {h.capturas.map((c, k) => (
          <Pieza key={c.src} id={h.id} captura={c} celular={celular} retraso={k * SEGUNDA} />
        ))}
      </div>
      <div className="obra-placa">
        <Glifo tipo={h.glifo} />
        <div className="obra-texto">
          <h3 id={nombre} className="obra-nombre">
            {h.nombre} <span className="obra-tag">{h.tag}</span>
          </h3>
          <p className="obra-linea">{h.linea}</p>
          {h.notaCorta ? <p className="obra-nota">{h.notaCorta}</p> : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Una captura en su marco. Es un enlace a su pieza en /trabajo: sin
 * JavaScript, o con una tecla de por medio, lleva allí; un toque normal lo
 * toma FichaIsla y abre la ficha encima, sin salir de la portada.
 */
function Pieza({ id, captura: c, celular, retraso }: { id: string; captura: Captura; celular: boolean; retraso: number }) {
  // Una captura de escritorio va en 16/10 (las de este sitio lo son); la de celular, en su propia proporción.
  const ratio = celular ? c.ratio : 16 / 10;
  const p = celular ? PASPARTU_CELULAR : PASPARTU;
  // El ancho entre alto del marco, con su paspartú: dónde caen las esquinas al repartir el dibujo.
  const proporcion = 1 / ((1 - 2 * p) / ratio + 2 * p);
  const caja: CSSProperties = { ...vars({ "--d": `${500 + retraso}ms`, "--i": 0 }), aspectRatio: String(+ratio.toFixed(4)) };
  // Las props del <img> que pondría next/image, resueltas aquí en el servidor (ver imagen.ts).
  const img = propsDeImagen({ src: c.src, alt: c.alt, fill: true, sizes: celular ? TAMANOS.celular : TAMANOS.ventana, loading: "lazy" });
  return (
    <div className="obra-pieza">
      <MarcoAbierto proporcion={proporcion} retraso={retraso} />
      <a className="obra-captura" href={`/trabajo#pieza=${id}`} data-abrir-pieza={id} data-reveal="up" data-threshold="0.6" style={caja}>
        {/* eslint-disable-next-line @next/next/no-img-element -- es el <img> de next/image, sin su JS */}
        <img {...img} alt={c.alt} />
      </a>
      <span className="obra-marca" data-reveal="close" data-threshold="0.6" aria-hidden="true" style={vars({ "--d": `${900 + retraso}ms` })}>
        <MarkSvg />
      </span>
    </div>
  );
}
