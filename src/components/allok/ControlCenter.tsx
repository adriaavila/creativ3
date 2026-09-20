import { STATES, type SystemState } from "@/lib/brand";
import OkDot from "@/components/brand/OkDot";

/**
 * El centro de control: la estética de la marca es el propio sistema, no una
 * ilustración de un robot.
 *
 * Contesta una sola pregunta, en su primera línea: ¿está funcionando? El resto
 * es evidencia. Los números son un día de ejemplo, no datos de nadie.
 */
const KPIS = [
  ["Conversaciones", "18", null],
  ["Atendidas solas", "11", "activo"],
  ["Leads nuevos", "4", null],
  ["Esperan por ti", "2", "atencion"],
] as const;

const FEED = [
  ["Carla M.", "Reservó el cupo del sábado y pagó el 50%", "activo", "3:16"],
  ["Taller Sur", "Pidió un precio que allok no tiene cargado", "atencion", "2:41"],
  ["Marina R.", "Escribiendo ahora", "atendiendo", "2:38"],
  ["J. Pérez", "Preguntó si atienden sábados · respondido", "activo", "ayer"],
] as const;

function Dot({ state }: { state: SystemState }) {
  return <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: STATES[state].dot }} />;
}

export default function ControlCenter() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#101315] shadow-[0_60px_120px_-50px_rgba(0,0,0,.9)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
        <span className="flex items-center gap-3">
          <OkDot state="activo" size={12} />
          <span className="font-display text-[21px] font-bold tracking-[-0.03em]">all ok</span>
          <span className="mono text-white/40">+58 412 ··· ····</span>
        </span>
        <span className="mono text-white/40">Academia Norte · hoy</span>
      </div>

      <dl className="grid gap-px bg-white/10 sm:grid-cols-4">
        {KPIS.map(([label, value, state]) => (
          <div key={label} className="bg-[#101315] px-6 py-6">
            <dt className="mono text-white/40">{label}</dt>
            <dd className="font-display mt-2 flex items-baseline gap-2 text-[40px] font-bold leading-none tracking-[-0.04em] tabular-nums">
              {value}
              {state ? <Dot state={state} /> : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-px bg-white/10">
        {FEED.map(([who, what, state, at]) => (
          <div key={who} className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#101315] px-6 py-4">
            <Dot state={state} />
            <span className="text-[15px] font-medium">{who}</span>
            <span className="min-w-0 flex-1 truncate text-[14px] text-white/55">{what}</span>
            <span className="mono text-white/35">{at}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
