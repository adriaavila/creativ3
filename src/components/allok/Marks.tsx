import AllokLogo from "@/components/brand/AllokLogo";
import type { SystemState } from "@/lib/brand";

/**
 * La firma de la casa.
 *
 * La firma es el logotipo, y el estado vive dentro de él: `all ● k` sólo lo
 * puede decir allok. El símbolo (el círculo que el punto cierra,
 * `AllokLogo variant="mark"`) va donde no cabe una palabra: favicon, avatar,
 * ícono de app. Nunca los dos juntos: serían dos puntos de estado.
 *
 * Con un producto delante —`allok × rei`— la casa baja de peso y manda el
 * producto: quien compra REI le compra a allok, pero en esa página habla REI.
 */
export type Product = "rei" | "vocero";

export function Lockup({
  product,
  size = 30,
  onSky = true,
  state = "activo",
  live = false,
}: {
  product?: Product;
  size?: number;
  /** `true` cuando el fondo es Ink. Mantiene el nombre viejo por compatibilidad. */
  onSky?: boolean;
  state?: SystemState;
  live?: boolean;
}) {
  const on = onSky ? "ink" : "cloud";
  const dim = onSky ? "rgba(247,248,248,.6)" : "rgba(11,13,14,.45)";
  const ink = onSky ? "#F7F8F8" : "#0B0D0E";

  if (!product) {
    return <AllokLogo variant="wordmark" on={on} state={state} size={size * 0.62} live={live} />;
  }

  return (
    <span className="inline-flex items-baseline gap-2">
      <AllokLogo variant="wordmark" on={on} state={state} size={size * 0.46} />
      <span style={{ fontSize: size * 0.4, color: dim }} aria-hidden="true">×</span>
      <span
        className="font-display"
        style={{ fontSize: size * 0.62, color: ink, fontWeight: 800, letterSpacing: "-0.05em" }}
      >
        {product}
      </span>
    </span>
  );
}
