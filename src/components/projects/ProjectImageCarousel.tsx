"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Workflow } from "lucide-react";
import { useState } from "react";
import type { ProjectImage } from "@/lib/projects";

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
  const [active, setActive] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const isDark = tone === "dark";
  const current = images[active];

  const minSwipeDistance = 40;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      next();
    } else if (isRightSwipe) {
      previous();
    }
  };

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

  const previous = () => {
    setActive((value) => (value === 0 ? images.length - 1 : value - 1));
  };

  const next = () => {
    setActive((value) => (value === images.length - 1 ? 0 : value + 1));
  };

  // Proyectos internos o sin URL publica no tienen capturas: marco vacio, no crash.
  if (!current) {
    return (
      <div
        className={`flex aspect-[16/10] w-full items-center justify-center rounded-xl border font-mono text-[10px] uppercase tracking-[0.16em] ${
          isDark
            ? "border-white/10 bg-white/[0.04] text-white/40"
            : "border-[#ebebeb] bg-[#f5f5f5] text-black/40"
        }`}
      >
        {projectName}
      </div>
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative aspect-[16/10] w-full select-none overflow-hidden rounded-xl border ${
        isDark
          ? "border-white/10 bg-white/[0.04]"
          : "border-[#ebebeb] bg-[#f5f5f5]"
      }`}
    >
      <Image
        src={current.src}
        alt={current.alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
      />
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
          <div className="absolute bottom-3 left-3 flex gap-1.5 z-10">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                aria-label={`Ver imagen ${index + 1} de ${projectName}`}
                aria-pressed={active === index}
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(index);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  active === index ? "w-7 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
          <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
            <button
              type="button"
              aria-label={`Imagen anterior de ${projectName}`}
              onClick={(e) => {
                e.stopPropagation();
                previous();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={`Siguiente imagen de ${projectName}`}
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

