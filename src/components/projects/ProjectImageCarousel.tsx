"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Workflow } from "lucide-react";
import type { ProjectImage } from "@/lib/projects";
import { useDragSwipe } from "@/components/projects/useDragSwipe";

type ProjectImageCarouselProps = {
  images: ProjectImage[];
  projectName: string;
  stack: string[];
  tone?: "dark" | "light";
};

export default function ProjectImageCarousel({
  images,
  projectName,
  stack,
  tone = "dark",
}: ProjectImageCarouselProps) {
  const { active, setActive, previous, next, dragging, enabled, dragProps, trackStyle } =
    useDragSwipe({ count: images.length });
  const isDark = tone === "dark";
  const current = images[active];

  if (!current) {
    return (
      <div
        className={`relative aspect-[16/10] w-full overflow-hidden rounded-lg border ${
          isDark
            ? "border-white/10 bg-[#08090a] text-white"
            : "border-[#0a0a0a]/10 bg-[#ebebeb] text-[#0a0a0a]"
        }`}
      >
        <div
          className={`absolute inset-0 ${
            isDark
              ? "bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)]"
              : "bg-[linear-gradient(rgba(10, 10, 10,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(10, 10, 10,0.08)_1px,transparent_1px)]"
          } bg-[size:28px_28px]`}
        />
        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <Workflow className="h-5 w-5" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-65">
              Automation map
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
            {["Entrada", "Agente", "Accion"].map((label, index) => (
              <div
                key={label}
                className={`rounded-lg border px-3 py-3 text-center ${
                  isDark
                    ? "border-white/12 bg-white/[0.06]"
                    : "border-[#0a0a0a]/10 bg-white/70"
                }`}
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-60">
                  0{index + 1}
                </div>
                <div className="mt-1 text-sm font-semibold">{label}</div>
              </div>
            )).flatMap((node, index, all) =>
              index === all.length - 1
                ? [node]
                : [
                    node,
                    <div
                      key={`line-${index}`}
                      className={`h-px ${
                        isDark ? "bg-white/25" : "bg-[#0a0a0a]/20"
                      }`}
                    />,
                  ],
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {stack.slice(0, 3).map((item) => (
              <span
                key={item}
                className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${
                  isDark
                    ? "border-white/10 bg-white/[0.06] text-white/70"
                    : "border-[#0a0a0a]/10 bg-white/70 text-[#6b6b6b]"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      {...dragProps}
      className={`relative aspect-[16/10] w-full select-none overflow-hidden rounded-xl border ${
        enabled ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
      } ${
        isDark
          ? "border-white/10 bg-white/[0.04]"
          : "border-[#ebebeb] bg-[#f5f5f5]"
      }`}
    >
      {/* Capa de arrastre separada de la imagen: así el translateX del gesto
          no pisa el transform del scale-on-hover de <Image>. */}
      <div className="absolute inset-0" style={trackStyle}>
        <Image
          src={current.src}
          alt={current.alt}
          fill
          draggable={false}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      </div>
      <div
        className={`absolute inset-x-0 bottom-0 h-28 ${
          isDark
            ? "bg-gradient-to-t from-[#050506]/85 to-transparent"
            : "bg-gradient-to-t from-black/45 to-transparent"
        }`}
      />
      <div className="absolute left-3 top-3 rounded-md bg-black/65 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-md">
        {current.label} ({active + 1}/{images.length})
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label={`Imagen anterior de ${projectName}`}
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
            aria-label={`Siguiente imagen de ${projectName}`}
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
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                aria-label={`Ver imagen ${index + 1} de ${projectName}`}
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

