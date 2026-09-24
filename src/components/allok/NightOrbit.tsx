"use client";

import { useEffect, useRef } from "react";
import { STATES } from "@/lib/brand";

/**
 * Detrás del teléfono: la noche, mensaje por mensaje.
 *
 * Cada punto es un mensaje. Sube ámbar por la izquierda (un cliente
 * esperando), pasa por detrás del teléfono y baja verde por la derecha
 * (respondido). El cambio de color ocurre siempre tapado por el aparato: es
 * el teléfono el que contesta. Por eso las órbitas son más bajas que el
 * teléfono (ry < 327): arriba y abajo quedan siempre detrás.
 *
 * Sin JS, o con menos movimiento, se queda quieto en su primer fotograma,
 * que ya se lee: ámbar a un lado, verde al otro.
 */
const HALF_W = 170; // medio teléfono (160) y un poco de aire
const TAU = Math.PI * 2;
const TRAIL = 0.42; // radianes de estela
// El teléfono mide 320 × 655: cada ry queda por debajo de 327.
const ORBITS = [
  { rx: 236, ry: 252, period: 14, dots: 2, phase: 0.08 },
  { rx: 290, ry: 282, period: 19, dots: 3, phase: 0.41 },
  { rx: 344, ry: 306, period: 26, dots: 2, phase: 0.77 },
] as const;
const DOTS = ORBITS.flatMap((o) =>
  Array.from({ length: o.dots }, (_, j) => ({ ...o, t0: ((j / o.dots + o.phase) % 1) * TAU })),
);

const WAITING = STATES.atencion.dot;
const DONE = STATES.activo.dot;

// Abajo → izquierda → arriba es la subida (ámbar); arriba → derecha → abajo, la bajada (verde).
const answered = (t: number) => {
  const a = ((t % TAU) + TAU) % TAU;
  return a < Math.PI / 2 || a >= (3 * Math.PI) / 2;
};

function at(d: (typeof DOTS)[number], t: number) {
  return [d.rx * Math.cos(t), d.ry * Math.sin(t)] as const;
}

function trail(d: (typeof DOTS)[number], t: number) {
  let path = "";
  for (let i = 0; i <= 10; i++) {
    const [x, y] = at(d, t - TRAIL + (TRAIL * i) / 10);
    path += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return path;
}

export default function NightOrbit({ className = "" }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = svg.current;
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const groups = Array.from(root.querySelectorAll<SVGGElement>("[data-dot]"));
    const parts = groups.map((g, i) => ({
      g,
      tail: g.querySelector("path")!,
      glow: g.querySelector<SVGCircleElement>("[data-glow]")!,
      core: g.querySelector<SVGCircleElement>("[data-core]")!,
      ping: g.querySelector<SVGCircleElement>("[data-ping]")!,
      pingAge: Infinity,
      wasOut: Math.abs(at(DOTS[i], DOTS[i].t0)[0]) > HALF_W,
    }));

    let raf = 0;
    let last = 0;
    let elapsed = 0;

    const frame = (now: number) => {
      const dt = Math.min(now - (last || now), 100) / 1000;
      elapsed += dt;
      last = now;
      DOTS.forEach((d, i) => {
        const p = parts[i];
        const t = d.t0 + (elapsed / d.period) * TAU;
        const [x, y] = at(d, t);
        const out = Math.abs(x) > HALF_W;
        // Asoma por un costado del teléfono: un mensaje que llega, o uno que sale contestado.
        if (out && !p.wasOut) p.pingAge = 0;
        p.wasOut = out;
        p.pingAge += dt;

        p.g.style.color = answered(t) ? DONE : WAITING;
        p.tail.setAttribute("d", trail(d, t));
        for (const c of [p.glow, p.core]) {
          c.setAttribute("cx", x.toFixed(1));
          c.setAttribute("cy", y.toFixed(1));
        }
        const k = Math.min(p.pingAge / 0.7, 1);
        p.ping.setAttribute("cx", x.toFixed(1));
        p.ping.setAttribute("cy", y.toFixed(1));
        p.ping.setAttribute("r", (5 + k * 16).toFixed(1));
        p.ping.style.opacity = String((1 - k) * 0.55);
      });
      raf = requestAnimationFrame(frame);
    };

    // Sólo corre mientras se ve: fuera de pantalla no gasta batería.
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      last = 0;
      if (e.isIntersecting) raf = requestAnimationFrame(frame);
    });
    io.observe(root);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <svg
      ref={svg}
      viewBox="-370 -320 740 640"
      className={`allok-orbit pointer-events-none ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {ORBITS.map((o, i) => (
        <ellipse
          key={o.rx}
          rx={o.rx}
          ry={o.ry}
          fill="none"
          stroke="#0b0d0e"
          strokeOpacity={i === 2 ? 0.14 : 0.09}
          strokeDasharray={i === 2 ? "2 7" : undefined}
        />
      ))}
      {DOTS.map((d, i) => {
        const [x, y] = at(d, d.t0);
        return (
          <g key={i} data-dot="" style={{ color: answered(d.t0) ? DONE : WAITING }}>
            <path d={trail(d, d.t0)} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" opacity={0.4} />
            <circle data-ping="" cx={x} cy={y} r={5} fill="none" stroke="currentColor" strokeWidth={1.5} opacity={0} />
            <circle data-glow="" cx={x} cy={y} r={12} fill="currentColor" opacity={0.18} />
            <circle data-core="" cx={x} cy={y} r={5.5} fill="currentColor" stroke="#0b0d0e" strokeOpacity={0.12} />
          </g>
        );
      })}
    </svg>
  );
}
