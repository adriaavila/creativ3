"use client";

import { Rise } from "@/components/ak/Brand";
import { PIEZAS } from "@/lib/vitrina";
import { Ventana } from "./Marcos";

type Cuadro = { id: string; name: string; label: string; src: string; alt: string; mobile: boolean; ratio: number };

// Lo que no se ve desde afuera: los sistemas por dentro, pantalla por pantalla.
const ORDEN: [string, string, string][] = [
  ["cuadra", "/projects/cuadra/02-desktop-scroll.jpg", "One sale, two currencies"],
  ["soapy", "/projects/soapy/dashboard.jpg", "Owner dashboard by branch"],
  ["mistica", "/projects/mistica/dashboard.png", "This month's collections"],
  ["pace-running", "/projects/pace-running/01-desktop.jpg", "Athletes and plans"],
  ["soapy", "/projects/soapy/orders.jpg", "Orders and their handoffs"],
  ["mistica", "/projects/mistica/home.png", "Today's classes"],
  ["taller-samer", "/projects/taller-samer/01-desktop.jpg", "Hours per machine"],
  ["pausa", "/projects/pausa/03-mobile.jpg", "Daily check-in"],
  ["almacen-vc", "/projects/almacen-vc/02-desktop-scroll.jpg", "Stock by area"],
  ["mistica", "/projects/mistica/cobros-sin-nombres.png", "Payments with due dates"],
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
        <p className="label" data-reveal="fade">Inside</p>
        <h2 id="por-dentro-titulo" className="headline" data-reveal="rise">
          <Rise>Under the</Rise>
          <Rise line={1}>hood.</Rise>
        </h2>
        <p data-reveal>What your customers never see: the screens a business runs on every day.</p>
      </div>
      <div className="tiles" data-stagger>
        {CUADROS.map((c, i) => (
          <button
            key={`${c.src}-${i}`}
            type="button"
            className="tile tile-shot"
            onClick={() => onOpen(c.id)}
            aria-label={`${c.name}: ${c.label}`}
            aria-describedby={`por-dentro-${i}`}
            data-reveal="row"
          >
            {/* La de celular, entera y en su proporción, dentro del mismo hueco 16/10: recortada no se leería como un celular. */}
            {c.mobile ? (
              <span className="tile-celular">
                <Ventana
                  src={c.src}
                  alt={c.alt}
                  sizes="(max-width: 760px) 16vw, 10vw"
                  ratio={c.ratio || 390 / 844}
                  reveal={false}
                  enBoton
                  imgId={`por-dentro-${i}`}
                />
              </span>
            ) : (
              // Dos por fila: casi media pantalla en el celular, un tercio largo en la tableta
              // (la sección va a lo ancho) y un cuarto en la columna ancha del escritorio.
              <Ventana
                src={c.src}
                alt={c.alt}
                sizes="(max-width: 760px) 46vw, (max-width: 1100px) 38vw, 26vw"
                reveal={false}
                enBoton
                imgId={`por-dentro-${i}`}
              />
            )}
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
