"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDragSwipe } from "@/components/projects/useDragSwipe";

type WorkImageCarouselProps = {
  images: readonly string[];
  alt: string;
  /** Clases del contenedor: el layout de la card lo decide AllokHome. */
  className?: string;
  sizes?: string;
};

/**
 * Versión clara del carrusel del portafolio para la sección "Trabajo" del
 * home: mismas capturas, con flechas a los lados y puntos, arrastrable.
 */
export default function WorkImageCarousel({
  images,
  alt,
  className = "",
  sizes = "(max-width: 768px) 100vw, 380px",
}: WorkImageCarouselProps) {
  const { active, setActive, previous, next, dragging, enabled, dragProps, trackStyle } =
    useDragSwipe({ count: images.length });

  return (
    <div
      {...dragProps}
      className={`relative select-none overflow-hidden ${
        enabled ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
      } ${className}`}
    >
      <div className="absolute inset-0" style={trackStyle}>
        <Image
          src={images[active]}
          alt={images.length > 1 ? `${alt} (${active + 1}/${images.length})` : alt}
          fill
          draggable={false}
          sizes={sizes}
          className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.025]"
        />
      </div>

      {enabled && (
        <>
          <button
            type="button"
            aria-label={`Imagen anterior de ${alt}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              previous();
            }}
            className="absolute left-2.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/70 active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Siguiente imagen de ${alt}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-2.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/70 active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-2 py-1.5 backdrop-blur-md">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                aria-label={`Ver imagen ${index + 1} de ${alt}`}
                aria-pressed={active === index}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(index);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  active === index ? "w-6 bg-white" : "w-1.5 bg-white/55"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
