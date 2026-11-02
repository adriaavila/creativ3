"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PIEZAS } from "@/lib/vitrina";
import { Navegador, Telefono } from "./Marcos";

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
  ["mistica", "/projects/mistica/cobros.png", "Cobros con vencimiento"],
];

const CUADROS: Cuadro[] = ORDEN.flatMap(([id, src, label]) => {
  const p = PIEZAS.find((x) => x.id === id);
  const img = p?.images.find((i) => i.src === src);
  return p && img ? [{ id, name: p.name, label, src, alt: img.alt, mobile: img.mobile, ratio: img.ratio }] : [];
});

export default function Interior({ onOpen }: { onOpen: (id: string) => void }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const measure = () => {
      const el = track.current;
      if (el) setDistance(Math.max(0, el.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  if (reduce) {
    return (
      <section id="por-dentro" className="py-28">
        <Encabezado />
        <div className="flex gap-6 overflow-x-auto px-4 pb-6 sm:px-10">
          {CUADROS.map((c, i) => (
            <Pantalla key={`${c.src}-${i}`} c={c} onOpen={onOpen} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={section} id="por-dentro" aria-labelledby="por-dentro-titulo" style={{ height: `calc(100svh + ${distance}px)` }} className="relative">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <Encabezado />
        <motion.div ref={track} style={{ x }} className="flex w-max items-center gap-6 px-4 sm:gap-10 sm:px-10">
          {CUADROS.map((c, i) => (
            <Pantalla key={`${c.src}-${i}`} c={c} onOpen={onOpen} />
          ))}
          <div className="w-[10vw] shrink-0" />
        </motion.div>
        <div className="mx-4 mt-10 h-px bg-[var(--cream-12)] sm:mx-10">
          <motion.div className="h-full bg-[var(--cream)]" style={{ width: bar }} />
        </div>
      </div>
    </section>
  );
}

function Encabezado() {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 px-4 sm:mb-12 sm:px-10">
      <h2 id="por-dentro-titulo" className="v-display text-[clamp(2.2rem,5.5vw,5rem)]">
        Por <span className="v-serif text-[var(--cream-60)]">dentro</span>
      </h2>
      <p className="max-w-[22rem] text-right text-sm leading-relaxed text-[var(--cream-60)]">
        Lo que el cliente nunca ve: los sistemas con los que un negocio se opera todos los días.
      </p>
    </div>
  );
}

function Pantalla({ c, onOpen }: { c: Cuadro; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(c.id)}
      data-cursor="Abrir"
      className="group shrink-0 text-left"
      aria-label={`${c.name}: ${c.label}`}
    >
      {c.mobile ? (
        <Telefono src={c.src} alt={c.alt} ratio={c.ratio} sizes="250px" className="w-[42vw] max-w-[250px] transition-transform duration-500 group-hover:-translate-y-2 sm:w-[19vw]" />
      ) : (
        <Navegador src={c.src} alt={c.alt} sizes="(max-width: 640px) 80vw, 46vw" className="w-[80vw] max-w-[760px] transition-transform duration-500 group-hover:-translate-y-2 sm:w-[46vw]" />
      )}
      <p className="mt-4 flex items-baseline gap-3">
        <span className="font-semibold">{c.name}</span>
        <span className="v-mono text-[10px] text-[var(--cream-60)]">{c.label}</span>
      </p>
    </button>
  );
}
