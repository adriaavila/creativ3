import { STATES, type SystemState } from "@/lib/brand";

/**
 * El estado del sistema, dicho en una palabra y un punto.
 *
 * Es el mismo objeto en toda la casa: la barra lateral, el número de WhatsApp,
 * el tablero y el logotipo. Por eso el texto sale de `STATES` y no del sitio
 * donde se usa — dos pantallas no pueden llamar distinto a lo mismo.
 *
 * `tone` elige la tinta, no el significado: sobre papel el texto va en `ink`
 * (AA), sobre negro va en `dot`, que ahí sí tiene contraste de sobra.
 */
export function StatusDot({ state, size = 8 }: { state: SystemState; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, background: STATES[state].dot }}
      className="inline-block shrink-0 rounded-full"
    />
  );
}

export default function Status({
  state,
  tone = "paper",
  className = "",
}: {
  state: SystemState;
  tone?: "paper" | "void";
  className?: string;
}) {
  const s = STATES[state];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[13px] font-medium ${className}`}
      style={
        tone === "paper"
          ? { background: s.soft, color: s.ink }
          : { background: "rgba(255,255,255,.07)", color: s.dot }
      }
    >
      <StatusDot state={state} />
      {s.label}
    </span>
  );
}
