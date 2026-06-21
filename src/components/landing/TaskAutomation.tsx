"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

const TASKS = [
  "Sincronizar inventario con WhatsApp",
  "Generar factura automática",
  "Notificar al equipo por Slack",
  "Actualizar CRM con nuevos leads",
  "Programar cita en el calendario",
  "Validar comprobante de pago móvil",
  "Enviar guía de tracking al cliente",
  "Reportar métricas del día",
  "Optimizar ruta de delivery",
  "Crear backup de base de datos",
];

export default function TaskAutomation() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!listRef.current || !sectionRef.current) return;

    const items = listRef.current.querySelectorAll(".task-item");

    items.forEach((item) => {
      gsap.fromTo(item,
        { opacity: 0.2, x: -20 },
        {
          opacity: 1,
          x: 0,
          scrollTrigger: {
            trigger: item,
            start: "top 80%",
            end: "top 40%",
            scrub: true,
          }
        }
      );
    });
  }, []);

  return (
    <section ref={sectionRef} className="w-full bg-noche py-32 px-6 sm:px-12 border-t border-papiro/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        <div className="md:sticky md:top-32">
          <div className="font-mono text-xs text-cobalto tracking-widest uppercase mb-6 flex items-center gap-3">
            <span className="w-8 h-px bg-cobalto/30" />
            Proof of work
          </div>
          <h2 className="font-display text-5xl sm:text-7xl leading-[0.9] tracking-tight text-papiro-soft mb-8">
            <span className="block">Tu lista de</span>
            <span className="block">pendientes,</span>
            <span className="block italic text-cobalto mt-2">en piloto automático.</span>
          </h2>
          <p className="font-mono text-sm sm:text-base text-papiro/60 max-w-md leading-relaxed">
            Nos enfocamos en las tareas repetitivas que consumen tu tiempo. Si tiene un proceso, podemos automatizarlo.
          </p>
        </div>

        <div ref={listRef} className="space-y-4 pt-4 md:pt-0">
          {TASKS.map((task, i) => (
            <div
              key={i}
              className="task-item flex items-center gap-6 p-5 rounded-xl border border-papiro/5 bg-noche-rise/10 group hover:border-cobalto/30 transition-all duration-500"
            >
              <div className="w-7 h-7 rounded-full border border-cobalto/40 flex items-center justify-center group-hover:bg-cobalto group-hover:border-cobalto transition-colors duration-500 shrink-0">
                <svg
                  className="w-3.5 h-3.5 text-cobalto group-hover:text-noche transition-colors duration-500"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="font-display text-xl sm:text-3xl text-papiro-soft group-hover:text-papiro transition-colors duration-500">
                {task}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
