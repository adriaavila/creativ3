import Image from "next/image";

/** Una ventana de navegador mínima alrededor de una captura de escritorio. */
export function Navegador({
  src,
  alt,
  url,
  sizes,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  url?: string;
  sizes: string;
  className?: string;
  eager?: boolean;
}) {
  const host = url ? url.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;
  return (
    <div
      className={`overflow-hidden rounded-[12px] bg-[#16181c] shadow-[0_0_0_1px_rgba(255,255,255,.08),0_50px_100px_-30px_rgba(0,0,0,.95)] ${className}`}
    >
      <div className="flex h-7 items-center gap-1.5 border-b border-white/5 px-3 sm:h-8">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        {host ? (
          <span className="v-mono mx-auto truncate rounded-md bg-white/5 px-3 py-0.5 text-[9px] normal-case tracking-normal text-white/45">
            {host}
          </span>
        ) : null}
      </div>
      <div className="relative aspect-[16/10]">
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover object-top" loading={eager ? "eager" : "lazy"} />
      </div>
    </div>
  );
}

/** Un teléfono sin marca alrededor de una captura móvil. */
export function Telefono({
  src,
  alt,
  sizes,
  ratio,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  /** Ancho / alto de la captura; sin él, el de un teléfono. */
  ratio?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-[28px] border-[6px] border-[#121316] bg-[#121316] shadow-[0_40px_80px_-25px_rgba(0,0,0,.9)] ${className}`}>
      <div className="relative overflow-hidden rounded-[22px]" style={{ aspectRatio: ratio || 390 / 844 }}>
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover object-top" />
      </div>
    </div>
  );
}
