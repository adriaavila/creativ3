import type { CSSProperties } from "react";
import { MARK, STATES, type SystemState } from "@/lib/brand";

/**
 * Los gráficos que se mueven en `/`. Todos salen de la misma gramática:
 * **un círculo abierto es alguien esperando; el punto que lo cierra es la
 * respuesta.** Ámbar llega, verde sale. Nada de ilustraciones: cada pieza es
 * el anillo y el punto de la marca, a otra escala.
 *
 * Sin JS. El estado final vive en la regla base y el movimiento en
 * `globals.css`, bajo `prefers-reduced-motion: no-preference`: con menos
 * movimiento, o sin línea de tiempo de scroll, cada pieza sale completa y
 * quieta.
 */

const vars = (v: Record<string, string | number>) => v as CSSProperties;

/* ── La banda de la noche ─────────────────────────────────────────────────
   Preguntas que llegan mientras el dueño duerme. Se desliza con el scroll,
   no con un reloj: sólo se mueve si quien lee se mueve. */

const NIGHT: [string, string, SystemState][] = [
  ["23:48", "¿Hay disponibilidad para esas fechas?", "activo"],
  ["0:12", "¿Cuánto sale y cuánto dura?", "activo"],
  ["0:57", "¿Tienen esta talla en negro?", "activo"],
  ["1:36", "¿Atienden mi caso y qué tengo que llevar?", "activo"],
  ["2:05", "¿Me hacen precio por cantidad?", "atencion"],
  ["2:41", "¿Lo reparan y cuánto tarda?", "activo"],
  ["3:14", "¿Tienen cupo para el curso de los sábados?", "activo"],
  ["4:02", "¿Cuánto es el envío?", "activo"],
  ["5:21", "¿Cuándo hay hora esta semana?", "activo"],
  ["6:40", "¿Abren hoy temprano?", "activo"],
];

function Question({ at, q, state }: { at: string; q: string; state: SystemState }) {
  return (
    <li className="flex shrink-0 items-center gap-3 rounded-[14px] border border-[var(--hair-void)] bg-white/[.035] px-4 py-3">
      <span className="mono tabular-nums text-[var(--on-void-60)]">{at}</span>
      <span className="whitespace-nowrap text-[14.5px] text-white/80">{q}</span>
      <span className="size-2 shrink-0 rounded-full" style={{ background: STATES[state].dot }} />
    </li>
  );
}

export function NightTicker() {
  const rows = [NIGHT, [...NIGHT.slice(5), ...NIGHT.slice(0, 5)]];
  return (
    <div className="allok-ticker grid gap-3" aria-hidden="true">
      {rows.map((row, r) => (
        <ul key={r} className="allok-ticker-row flex w-max gap-3" data-dir={r}>
          {[...row, ...row].map(([at, q, state], i) => (
            <Question key={i} at={at} q={q} state={state} />
          ))}
        </ul>
      ))}
    </div>
  );
}

/* ── Los tres pasos ───────────────────────────────────────────────────────
   Cada uno es una acción a la izquierda y su resultado a la derecha, y el
   resultado siempre es el mismo: el anillo que el punto cierra. */

function Ring({ cx, cy, scale, className = "" }: { cx: number; cy: number; scale: number; className?: string }) {
  // MARK vive en una caja de 64 con el centro en 32,32.
  const s = scale;
  return (
    <g transform={`translate(${cx - 32 * s} ${cy - 32 * s}) scale(${s})`} className={className}>
      <path
        d={MARK.ring}
        pathLength={1}
        className="allok-glyph-ring"
        fill="none"
        stroke="currentColor"
        strokeWidth={MARK.stroke}
        strokeLinecap="round"
      />
      <circle
        cx={MARK.dot.cx}
        cy={MARK.dot.cy}
        r={MARK.dot.r}
        className="allok-glyph-dot"
        style={{ fill: STATES.activo.dot }}
      />
      <circle
        cx={MARK.dot.cx}
        cy={MARK.dot.cy}
        r={MARK.dot.r}
        className="allok-glyph-ping"
        fill="none"
        stroke={STATES.activo.dot}
        strokeWidth={2}
      />
    </g>
  );
}

export function StepGlyph({ step, className = "" }: { step: 1 | 2 | 3; className?: string }) {
  return (
    <svg
      viewBox="0 0 132 64"
      className={`allok-glyph text-[var(--ink)] ${className}`}
      data-step={step}
      aria-hidden="true"
      focusable="false"
    >
      {step === 1 && (
        <>
          {/* Tu teléfono, conectándose. */}
          <rect x="6" y="6" width="30" height="52" rx="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <rect x="16" y="11" width="10" height="3" rx="1.5" fill="currentColor" opacity=".3" />
          <path d="M13 28h16M13 35h11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity=".3" />
          <path
            className="allok-glyph-wire"
            d="M44 32H82"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="2 5"
            strokeLinecap="round"
            opacity=".35"
          />
          <circle className="allok-glyph-pulse" cx="44" cy="32" r="3.5" style={{ fill: STATES.atencion.dot }} />
          <Ring cx={106} cy={32} scale={0.62} />
        </>
      )}
      {step === 2 && (
        <>
          {/* Lo que le cuentas, en tus palabras. */}
          <path
            d="M10 8h66a8 8 0 0 1 8 8v26a8 8 0 0 1-8 8H24l-10 8v-8h-4a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {[
            [14, 20, 58],
            [14, 29, 46],
            [14, 38, 30],
          ].map(([x, y, w], i) => (
            <path
              key={y}
              className="allok-glyph-line"
              style={vars({ "--i": i })}
              d={`M${x} ${y}h${w}`}
              pathLength={1}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              opacity=".45"
            />
          ))}
          <rect className="allok-glyph-caret" x="49" y="32.5" width="2.5" height="11" rx="1" style={{ fill: STATES.atendiendo.dot }} />
          <Ring cx={112} cy={29} scale={0.5} className="allok-glyph-late" />
        </>
      )}
      {step === 3 && (
        <>
          {/* El interruptor, y lo que enciende. */}
          <rect className="allok-glyph-track" x="4" y="18" width="52" height="28" rx="14" style={{ fill: STATES.activo.dot }} />
          <rect x="4" y="18" width="52" height="28" rx="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle className="allok-glyph-knob" cx="42" cy="32" r="9" fill="currentColor" />
          <Ring cx={100} cy={32} scale={0.72} className="allok-glyph-late" />
        </>
      )}
    </svg>
  );
}

/* ── La viñeta de cada sector ─────────────────────────────────────────────
   La pregunta que se repite, cerrada: el anillo se dibuja y el punto pasa de
   ámbar a verde cuando la fila sube por la pantalla. */

export function CloseMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`allok-close shrink-0 ${className}`} aria-hidden="true" focusable="false">
      <path
        d={MARK.ring}
        pathLength={1}
        className="allok-close-ring"
        fill="none"
        stroke="currentColor"
        strokeWidth={MARK.stroke}
        strokeLinecap="round"
      />
      <circle cx={MARK.dot.cx} cy={MARK.dot.cy} r={MARK.dot.r + 1} className="allok-close-dot" />
    </svg>
  );
}

/* ── El cielo del cierre ──────────────────────────────────────────────────
   Cada estrella es una conversación de la noche: se enciende ámbar, la
   contestan y queda verde, y se apaga. Abajo, el amanecer sube con el scroll.
   Posiciones con la secuencia R2 (repartidas parejo, sin azar: el servidor y
   el navegador pintan lo mismo). */

const STARS = Array.from({ length: 38 }, (_, i) => {
  const n = i + 1;
  const x = (0.5 + n * 0.7548776662) % 1;
  const y = (0.5 + n * 0.5698402910) % 1;
  return {
    x: (x * 1000).toFixed(1),
    y: (y * 440).toFixed(1),
    r: [1.6, 2.2, 2.8][n % 3],
    period: 7 + (n % 5) * 1.3,
    delay: -((n * 1.37) % 9),
  };
});

export function NightSky() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 1000 440" preserveAspectRatio="xMidYMid slice" className="allok-stars absolute inset-0 size-full">
        {STARS.map((s, i) => (
          <circle
            key={i}
            className="allok-star"
            cx={s.x}
            cy={s.y}
            r={s.r}
            style={vars({ "--period": `${s.period}s`, "--delay": `${s.delay.toFixed(2)}s` })}
          />
        ))}
      </svg>
      <div className="allok-dawn" />
    </div>
  );
}
