import { MARK, STATES, type SystemState } from "@/lib/brand";
import OkDot from "./OkDot";

type Props = {
  className?: string;
  variant?: "wordmark" | "lockup" | "mark";
  /** Sobre Ink el logotipo va en Cloud; sobre Cloud, en Ink. */
  on?: "cloud" | "ink";
  /**
   * El estado del sistema. Es la `o` del logotipo, así que no hay valor por
   * defecto: quien lo pinte tiene que saber si las cosas están bien.
   */
  state: SystemState;
  /** Altura de la caja de texto en px. Todo lo demás sale de aquí. */
  size?: number;
  /** `true` anima el punto con el Lottie; `false` lo deja quieto. */
  live?: boolean;
};

/**
 * `all ● k` — el logotipo con el estado dentro.
 *
 * El punto ocupa el sitio de la `o`, así que el logo no se puede pintar sin
 * decir cómo está el sistema. En verde (`activo`) el logo literalmente se lee
 * «all ok».
 *
 * Sobre un fondo verde el punto se invierte a Ink: verde sobre verde
 * desaparece y el logotipo se lee «all k».
 */
export default function AllokLogo({
  className = "",
  variant = "wordmark",
  on = "cloud",
  state,
  size = 30,
  live = false,
}: Props) {
  const ink = on === "ink" ? "#F7F8F8" : "#0B0D0E";
  const dotSize = Math.round(size * 0.6);
  const def = STATES[state];

  if (variant === "mark") {
    // El icono de app: el círculo que el punto cierra (ver `MARK`). El punto
    // es el mismo del logotipo, así que lleva el estado igual que la `o`.
    const d = MARK.dot;
    return (
      <span
        className={`relative block shrink-0 ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label={`allok · ${def.label}`}
      >
        <svg viewBox="0 0 64 64" className="block size-full" aria-hidden="true">
          <rect width="64" height="64" rx="17" fill="#0B0D0E" />
          <path d={MARK.ring} fill="none" stroke="#F7F8F8" strokeWidth={MARK.stroke} strokeLinecap="round" />
          {!live && <circle cx={d.cx} cy={d.cy} r={d.r} fill={def.dot} />}
        </svg>
        {live && (
          <span
            className="absolute grid -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(d.cx / 64) * 100}%`, top: `${(d.cy / 64) * 100}%` }}
          >
            <OkDot state={state} size={(size * d.r * 2) / 64} />
          </span>
        )}
      </span>
    );
  }

  const word = (
    <span
      className="inline-flex items-center font-display leading-none"
      style={{ fontSize: size, fontWeight: 800, letterSpacing: "-0.055em", color: ink }}
    >
      all
      {live ? (
        <OkDot state={state} size={dotSize} className="mx-[0.02em]" />
      ) : (
        <span
          className="mx-[0.02em] inline-block shrink-0 rounded-full"
          style={{ width: dotSize, height: dotSize, background: def.dot }}
        />
      )}
      <span style={{ marginLeft: size * 0.04 }}>k</span>
    </span>
  );

  if (variant === "wordmark") {
    return (
      <span className={`inline-flex ${className}`} aria-label={`allok · ${def.label}`} role="img">
        {word}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-baseline gap-3 ${className}`} role="img" aria-label={`allok · ${def.label}`}>
      {word}
      <span
        className="mono"
        style={{ color: on === "ink" ? "rgba(247,248,248,.55)" : "rgba(11,13,14,.5)" }}
      >
        {def.label}
      </span>
    </span>
  );
}
