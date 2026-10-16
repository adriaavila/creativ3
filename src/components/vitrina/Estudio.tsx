"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { CUENTAS } from "@/lib/vitrina";

const TEXTO =
  "Soy Adrián. Ingeniero industrial: aprendí a leer un negocio como un sistema, con sus cuellos de botella, su flujo y su desperdicio. Hoy diseño y construyo el software que los arregla, de la primera pantalla al despliegue, con las mismas manos y con agentes de IA haciendo la mitad aburrida.";

const CIFRAS = [
  { n: CUENTAS.piezas, label: "piezas en esta página" },
  { n: CUENTAS.capturas, label: "capturas reales, sin maquetas" },
  { n: CUENTAS.lanzadas, label: "en producción" },
  { n: CUENTAS.tecnologias, label: "tecnologías distintas" },
];

/** Las palabras se encienden a medida que bajas, como si se leyeran en voz alta. */
export default function Estudio() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const palabras = TEXTO.split(" ");

  return (
    <section id="estudio" aria-labelledby="estudio-titulo" className="relative px-4 py-28 sm:px-10 sm:py-44">
      <div className="mx-auto max-w-[1500px]">
        <h2 id="estudio-titulo" className="v-mono mb-10 text-[11px] text-[var(--cream-60)]">
          El estudio
        </h2>
        <p ref={ref} className="max-w-[22ch] text-[clamp(1.9rem,4.6vw,4.4rem)] font-semibold leading-[1.08] tracking-[-0.035em] sm:max-w-[26ch]">
          {palabras.map((w, i) => (
            <Palabra key={i} w={w} i={i} total={palabras.length} progress={scrollYProgress} reduce={Boolean(reduce)} />
          ))}
        </p>

        <dl className="mt-24 grid grid-cols-2 gap-x-6 gap-y-12 border-t border-[var(--cream-12)] pt-10 sm:mt-32 lg:grid-cols-4">
          {CIFRAS.map((c) => (
            <div key={c.label} className="flex flex-col-reverse">
              <dt className="v-mono mt-3 text-[11px] text-[var(--cream-60)]">{c.label}</dt>
              <dd className="v-display text-[clamp(3.5rem,9vw,8rem)] tabular-nums">
                <NumberTicker value={c.n} className="!tracking-[-0.055em] !text-[var(--cream)]" />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Palabra({
  w,
  i,
  total,
  progress,
  reduce,
}: {
  w: string;
  i: number;
  total: number;
  progress: MotionValue<number>;
  reduce: boolean;
}) {
  const start = i / total;
  const opacity = useTransform(progress, [start, start + 1 / total], [0.14, 1]);
  const serif = /^(sistema,|arregla,|aburrida\.)$/.test(w);
  return (
    <motion.span style={reduce ? undefined : { opacity }} className={serif ? "v-serif font-normal" : undefined}>
      {w}{" "}
    </motion.span>
  );
}
