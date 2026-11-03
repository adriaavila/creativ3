"use client";

import { Rise } from "@/components/ak/Brand";
import { PIEZAS } from "@/lib/vitrina";
import { Ventana } from "./Marcos";

type Cuadro = { id: string; name: string; label: string; src: string; alt: string; mobile: boolean; ratio: number };

// Lo que no se ve desde afuera: los sistemas por dentro, pantalla por pantalla.
const ORDEN: [string, string, string][] = [
  ["soapy", "/projects/soapy/dashboard.jpg", "Tablero del dueño por sucursal"],
  ["mistica", "/projects/mistica/dashboard.png", "Cobranza del mes"],
  ["pace-running", "/projects/pace-running/01-desktop.jpg", "Atletas y planes"],
  ["soapy", "/projects/soapy/orders.jpg", "Pedidos y sus traspasos"],
  ["mistica", "/projects/mistica/home.png", "Las clases de hoy"],
  ["taller-samer", "/projects/taller-samer/01-desktop.jpg", "Horas por equipo"],
  ["pausa", "/projects/pausa/03-mobile.jpg", "Chequeo diario"],
  ["almacen-vc", "/projects/almacen-vc/02-desktop-scroll.jpg", "Almacén por área"],
  ["soapy", "/projects/soapy/reports.jpg", "Reportes"],
  ["mistica", "/projects/mistica/cobros-sin-nombres.png", "Cobros con vencimiento"],
];

const CUADROS: Cuadro[] = ORDEN.flatMap(([id, src, label]) => {
  const p = PIEZAS.find((x) => x.id === id);
  const img = p?.images.find((i) => i.src === src);
  return p && img ? [{ id, name: p.name, label, src, alt: img.alt, mobile: img.mobile, ratio: img.ratio }] : [];
});

export default function Interior({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <section id="por-dentro" aria-labelledby="por-dentro-titulo" className="section" data-theme="cloud" data-stagger>
      <div className="section-title">
        <p className="label" data-reveal="fade">Por dentro</p>
        <h2 id="por-dentro-titulo" className="headline" data-reveal="rise">
          <Rise>Por</Rise>
          <Rise line={1}>dentro.</Rise>
        </h2>
        <p data-reveal>Lo que el cliente nunca ve: los sistemas con los que un negocio se opera todos los días.</p>
      </div>
      <div className="tiles" data-stagger>
        {CUADROS.map((c, i) => (
          <button
            key={`${c.src}-${i}`}
            type="button"
            className="tile tile-shot"
            onClick={() => onOpen(c.id)}
            aria-label={`${c.name}: ${c.label}`}
            data-reveal="row"
          >
            <Ventana src={c.src} alt={c.alt} sizes="(max-width: 760px) 46vw, 34vw" ratio={c.mobile ? 16 / 10 : 16 / 10} reveal={false} />
            <span className="tile-cap">
              <span className="heading">{c.name}</span>
              <span className="caption">{c.label}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
