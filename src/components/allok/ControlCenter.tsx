"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { STATES, type SystemState } from "@/lib/brand";
import OkDot from "@/components/brand/OkDot";

/**
 * El centro de control: la estética de la marca es el propio sistema, no una
 * ilustración de un robot.
 *
 * Contesta una sola pregunta, en su primera línea: ¿está funcionando? El resto
 * es evidencia. Los números son un día de ejemplo, no datos de nadie.
 *
 * Y está encendido: mientras se ve, llega alguien (azul, escribiendo), allok
 * lo resuelve (verde) o te lo pasa (ámbar), y los contadores suben. Corre el
 * guion una vez y se queda quieto. Con menos movimiento no corre: salta al
 * final del guion, ya resuelto.
 */
const KPIS = [
  ["Conversaciones", null],
  ["Atendidas solas", "activo"],
  ["Leads nuevos", null],
  ["Esperan por ti", "atencion"],
] as const;

type Outcome = { what: string; state: SystemState; bump: number[] };
type Row = { id: number; who: string; what: string; state: SystemState; at: string; next?: Outcome; fresh?: boolean; landed?: boolean };

const START: Row[] = [
  { id: 1, who: "Carla M.", what: "Reservó el cupo del sábado y pagó el 50%", state: "activo", at: "3:16" },
  { id: 2, who: "Taller Sur", what: "Pidió un precio que allok no tiene cargado", state: "atencion", at: "2:41" },
  {
    id: 3, who: "Marina R.", what: "Escribiendo", state: "atendiendo", at: "2:38",
    next: { what: "Preguntó por el de 11:30 · respondido", state: "activo", bump: [1] },
  },
  { id: 4, who: "J. Pérez", what: "Preguntó si atienden sábados · respondido", state: "activo", at: "ayer" },
];

// Quién llega después, en orden, y cómo termina. `bump`: qué contadores suben.
const SCRIPT: [string, number, Outcome][] = [
  ["Luis A.", 3, { what: "Agendó una clase de prueba el martes", state: "activo", bump: [1, 2] }],
  ["Sofía P.", 4, { what: "Pidió factura a nombre de su empresa", state: "atencion", bump: [3] }],
  ["Andrés G.", 6, { what: "Pidió el link de pago · enviado", state: "activo", bump: [1] }],
  ["Valeria T.", 5, { what: "Reservó el cupo de las 9:00", state: "activo", bump: [1, 2] }],
  ["Óptica Mar", 7, { what: "Preguntó si hay cupos para su equipo · respondido", state: "activo", bump: [1, 2] }],
];

const TICK = 2600;

function Dot({ state, land }: { state: SystemState; land?: boolean }) {
  return (
    <span
      className={`inline-block size-2 shrink-0 rounded-full ${land ? "allok-land" : ""}`}
      style={{ background: STATES[state].dot, color: STATES[state].dot }}
    />
  );
}

type Board = { feed: Row[]; kpis: number[]; ticks: number[] };
const FIRST: Board = { feed: START, kpis: [18, 11, 4, 2], ticks: [0, 0, 0, 0] };

const bumped = (b: Board, idx: number[]) => ({
  kpis: b.kpis.map((v, i) => (idx.includes(i) ? v + 1 : v)),
  ticks: b.ticks.map((v, i) => (idx.includes(i) ? v + 1 : v)),
});

type Run = { board: Board; step: number; minute: number };
const RUN0: Run = { board: FIRST, step: 0, minute: 3 * 60 + 16 };

// Un paso: si alguien está escribiendo, se resuelve; si no, llega el siguiente. null: se acabó el guion.
function advance({ board, step, minute }: Run): Run | null {
  const writing = board.feed.find((r) => r.next);
  if (writing) {
    const done = writing.next!;
    return {
      step,
      minute,
      board: {
        feed: board.feed.map((r) =>
          r === writing ? { ...r, ...done, next: undefined, fresh: false, landed: true } : { ...r, fresh: false },
        ),
        ...bumped(board, done.bump),
      },
    };
  }
  if (step >= SCRIPT.length) return null;
  const [who, gap, next] = SCRIPT[step];
  const at = `${Math.floor((minute + gap) / 60)}:${String((minute + gap) % 60).padStart(2, "0")}`;
  return {
    step: step + 1,
    minute: minute + gap,
    board: {
      feed: [
        { id: 101 + step, who, what: "Escribiendo", state: "atendiendo", at, next, fresh: true },
        ...board.feed.slice(0, 3).map((r) => ({ ...r, landed: false })),
      ],
      ...bumped(board, [0]),
    },
  };
}

// El guion ya corrido y quieto: lo que queda con menos movimiento, sin nadie «escribiendo» para siempre.
const FINAL: Board = (() => {
  let run = RUN0;
  for (let n = advance(run); n; n = advance(run)) run = n;
  return { ...run.board, feed: run.board.feed.map((r) => ({ ...r, fresh: false, landed: false })), ticks: [0, 0, 0, 0] };
})();

const REDUCE = "(prefers-reduced-motion: reduce)";
const onReduceChange = (cb: () => void) => {
  const mq = matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export default function ControlCenter() {
  const host = useRef<HTMLDivElement>(null);
  const [live, setBoard] = useState(FIRST);
  const still = useSyncExternalStore(onReduceChange, () => matchMedia(REDUCE).matches, () => false);
  const { feed, kpis, ticks } = still ? FINAL : live;

  useEffect(() => {
    const el = host.current;
    if (!el || still) return;

    let run = RUN0;
    let timer = 0;
    const tick = () => {
      const n = advance(run);
      if (!n) return clearInterval(timer);
      run = n;
      setBoard(run.board);
    };

    // Sólo avanza mientras se ve; fuera de pantalla espera donde quedó.
    const io = new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) timer = window.setInterval(tick, TICK);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(timer);
    };
  }, [still]);

  return (
    <div ref={host} className="overflow-hidden rounded-[24px] border border-white/10 bg-[#101315] shadow-[0_60px_120px_-50px_rgba(0,0,0,.9)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
        <span className="flex items-center gap-3">
          <OkDot state="activo" size={12} />
          <span className="font-display text-[21px] font-bold tracking-[-0.03em]">all ok</span>
          <span className="mono text-[var(--on-void-60)]">+58 412 ··· ····</span>
        </span>
        <span className="mono text-[var(--on-void-60)]">Academia Norte · hoy</span>
      </div>

      <dl className="grid gap-px bg-white/10 sm:grid-cols-4">
        {KPIS.map(([label, state], i) => (
          <div key={label} className="bg-[#101315] px-6 py-6">
            <dt className="mono text-[var(--on-void-60)]">{label}</dt>
            <dd className="font-display mt-2 flex items-baseline gap-2 text-[40px] font-bold leading-none tracking-[-0.04em] tabular-nums">
              <span key={ticks[i]} className={ticks[i] ? "allok-tick" : ""}>
                {kpis[i]}
              </span>
              {state ? <Dot state={state} /> : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-px bg-white/10">
        {feed.map((row) => (
          <div
            key={row.id}
            className={`flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 bg-[#101315] px-6 py-4 ${row.fresh ? "allok-row-in" : ""}`}
          >
            <Dot key={row.state} state={row.state} land={row.landed} />
            <span className="text-[15px] font-medium">{row.who}</span>
            <span
              key={row.what}
              className={`min-w-0 flex-1 truncate text-[14px] text-white/55 ${row.landed ? "allok-text-in" : ""}`}
            >
              {row.what}
              {row.next ? (
                <span className="allok-typing" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              ) : null}
            </span>
            <span className="mono text-[var(--on-void-60)]">{row.at}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
