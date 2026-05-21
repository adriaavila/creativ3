"use client";

import MagneticGrid from "./MagneticGrid";
import MeshGradient from "./MeshGradient";

export default function MagneticField() {
  return (
    <section className="theme-kinetic relative w-full overflow-hidden py-32 sm:py-48">
      <div className="absolute inset-0 z-0">
        <MeshGradient
          colors={[
            "rgba(255, 138, 76, 0.40)",
            "rgba(168, 201, 127, 0.35)",
            "rgba(42, 110, 160, 0.32)",
            "rgba(255, 200, 120, 0.30)",
          ]}
          base="#fbf6e9"
          speed={0.35}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col gap-6">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#1a1a1f]/60">
            III · Campo de fuerza
          </span>
          <h2 className="font-display text-5xl sm:text-7xl leading-[0.95] tracking-tight text-[#1a1a1f]">
            Mueve <em className="text-[#ff8a4c] not-italic font-display italic">el cursor.</em>
            <br />
            Siente la <em className="italic">física.</em>
          </h2>
          <p className="font-mono text-sm sm:text-base text-[#1a1a1f]/70 max-w-md leading-relaxed">
            Cada pieza reacciona. Igual que tu sistema cuando lo construimos a medida: cada acción
            del usuario produce una respuesta orquestada.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#ff8a4c] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#1a1a1f]/50">
              Interactivo · mueve el ratón
            </span>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <MagneticGrid />
        </div>
      </div>
    </section>
  );
}
