import Image from "next/image";
import type { CaseImage } from "@/lib/casos";

/**
 * Una captura real dentro del aparato donde vive: navegador para el sitio,
 * teléfono para lo móvil, lámina para los tableros de diseño. El marco es
 * mínimo a propósito: lo que se mira es el sistema, no el marco.
 */
export default function Screen({
  image,
  sizes,
  priority = false,
  className = "",
}: {
  image: CaseImage;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (image.kind === "mobile") {
    return (
      <div className={`overflow-hidden rounded-[30px] border-[6px] border-[#16191b] bg-[#16191b] ${className}`}>
        <div className="relative aspect-[10/17] overflow-hidden rounded-[24px] bg-white">
          <Image src={image.src} alt={image.alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
        </div>
      </div>
    );
  }
  if (image.kind === "board") {
    return (
      <div className={`overflow-hidden rounded-[10px] border border-[var(--line)] bg-white ${className}`}>
        <div className="relative aspect-[1287/909]">
          <Image src={image.src} alt={image.alt} fill sizes={sizes} priority={priority} className="object-cover" />
        </div>
      </div>
    );
  }
  return (
    <div className={`overflow-hidden rounded-[10px] border border-[var(--line)] bg-white ${className}`}>
      <div className="flex h-7 items-center gap-1.5 border-b border-[var(--line)] bg-[#f3f4f4] px-3" aria-hidden="true">
        <span className="size-2 rounded-full bg-[#d8dadb]" />
        <span className="size-2 rounded-full bg-[#d8dadb]" />
        <span className="size-2 rounded-full bg-[#d8dadb]" />
      </div>
      <div className="relative aspect-[16/10]">
        <Image src={image.src} alt={image.alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
      </div>
    </div>
  );
}
