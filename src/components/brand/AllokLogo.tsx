import { STATES, type SystemState } from "@/lib/brand";
import { WordmarkSvg } from "@/components/ak/Brand";
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
 * El logotipo de allok, del sistema de diseño de la portada: dibujado, en Ink
 * sobre Cloud y en Cloud sobre Ink. `state` sigue diciendo cómo está el
 * sistema en la etiqueta accesible, en el `lockup` y en el punto del ícono
 * cuando va `live`.
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
  const def = STATES[state];

  if (variant === "mark") {
    // El ícono de app del sistema de diseño (src/app/icon.svg): loseta Ink con
    // radio 23,4 %, el símbolo de MarkSvg en Cloud y su punto. En reposo el
    // punto es Blue, como el punto de un resultado; `live` lo deja con el
    // estado animado del producto.
    return (
      <span
        className={`relative block shrink-0 ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label={`allok · ${def.label}`}
      >
        <svg viewBox="0 0 128 128" className="block size-full" aria-hidden="true">
          <rect width="128" height="128" rx="30" fill="#0B0D0E" />
          <g transform="translate(13.2 13.2) scale(1.27)">
            <path d="M63.909 42.092A24 24 0 1 0 42.092 63.909" fill="none" stroke="#F7F8F8" strokeWidth="12" strokeLinecap="round" />
            {!live && <circle cx="56.971" cy="56.971" r="6" fill="#315CFF" />}
          </g>
        </svg>
        {live && (
          <span className="absolute grid -translate-x-1/2 -translate-y-1/2" style={{ left: "66.9%", top: "66.9%" }}>
            <OkDot state={state} size={size * 0.12} />
          </span>
        )}
      </span>
    );
  }

  // El logotipo se dibuja, nunca se escribe en Geist: la geometría del máster
  // del sistema (WordmarkSvg). Su alto de letra iguala al de la `allok` que
  // antes se escribía a `size` px, así que nadie tiene que cambiar su tamaño.
  const word = (
    <span className="inline-block leading-none" style={{ width: size * 2.6, color: ink, lineHeight: 0 }}>
      <WordmarkSvg />
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
