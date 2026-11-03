import Image from "next/image";

/**
 * Una captura real dentro de la ventana del sistema (radius-window, sin sombras).
 * Dentro de un botón va hecha de spans (`enBoton`): un botón solo admite
 * contenido de frase, y una figure ahí dentro no es HTML válido.
 */
export function Ventana({
  src,
  alt,
  url,
  sizes,
  ratio = 16 / 10,
  eager = false,
  reveal = true,
  parallax = false,
  enBoton = false,
  imgId,
}: {
  src: string;
  alt: string;
  url?: string;
  sizes: string;
  ratio?: number;
  eager?: boolean;
  reveal?: boolean;
  parallax?: boolean;
  enBoton?: boolean;
  /** Para que el botón que la envuelve la nombre en su descripción (`aria-describedby`). */
  imgId?: string;
}) {
  const host = url ? url.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;
  const Marco = enBoton ? "span" : "figure";
  const Caja = enBoton ? "span" : "div";
  return (
    <Marco
      className="window"
      data-theme="cloud"
      data-reveal={reveal ? "window" : undefined}
      data-parallax={parallax ? "0.05" : undefined}
      style={{ margin: 0 }}
    >
      {host ? (
        <Caja className="window-bar">
          <span>{host}</span>
        </Caja>
      ) : null}
      <Caja className="window-shot" style={{ aspectRatio: ratio }}>
        <Image id={imgId} src={src} alt={alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"} />
      </Caja>
    </Marco>
  );
}
