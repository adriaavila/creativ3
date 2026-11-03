import Image from "next/image";

/** Una captura real dentro de la ventana del sistema (radius-window, sin sombras). */
export function Ventana({
  src,
  alt,
  url,
  sizes,
  ratio = 16 / 10,
  eager = false,
  reveal = true,
  parallax = false,
}: {
  src: string;
  alt: string;
  url?: string;
  sizes: string;
  ratio?: number;
  eager?: boolean;
  reveal?: boolean;
  parallax?: boolean;
}) {
  const host = url ? url.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;
  return (
    <figure
      className="window"
      data-theme="cloud"
      data-reveal={reveal ? "window" : undefined}
      data-parallax={parallax ? "0.05" : undefined}
      style={{ margin: 0 }}
    >
      {host ? (
        <div className="window-bar">
          <span>{host}</span>
        </div>
      ) : null}
      <div className="window-shot" style={{ aspectRatio: ratio }}>
        <Image src={src} alt={alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"} />
      </div>
    </figure>
  );
}
