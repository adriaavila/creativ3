import { Fragment } from "react";
import type { CSSProperties, ReactElement } from "react";

/**
 * Una frase que se enciende palabra a palabra mientras baja.
 *
 * El avance lo manda el scroll, no un reloj: la línea de tiempo es
 * `view()` sobre el propio párrafo, y cada palabra abre su ventana un
 * poco más tarde que la anterior. Sin `animation-timeline` en el
 * navegador —o con el movimiento reducido— la frase sale entera en
 * tinta plena; el CSS lo envuelve en `@supports`.
 *
 * `start`/`span` van en porcentaje del recorrido `cover`.
 */
export default function Reveal({
  children,
  className = "",
  start = 18,
  end = 50,
  span = 14,
}: {
  children: string;
  className?: string;
  start?: number;
  end?: number;
  span?: number;
}): ReactElement {
  const words = children.trim().split(/\s+/);
  const step = words.length > 1 ? (end - start) / (words.length - 1) : 0;

  return (
    <p className={`allok-reveal ${className}`.trim()}>
      {words.map((word, i) => {
        const from = start + i * step;
        return (
          <Fragment key={`${word}-${i}`}>
            <span
              className="allok-reveal-word"
              style={
                {
                  "--from": `${from.toFixed(2)}%`,
                  "--to": `${(from + span).toFixed(2)}%`,
                } as CSSProperties
              }
            >
              {word}
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </p>
  );
}
