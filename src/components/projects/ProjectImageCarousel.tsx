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
  const isDark = tone === "dark";
  const current = images[active];

  if (!current) {
    return (
      <div
        className={`relative aspect-[16/10] w-full overflow-hidden rounded-lg border ${
          isDark
            ? "border-white/10 bg-[#07151f] text-white"
            : "border-[#1f2a1d]/10 bg-[#eef1e8] text-[#1f2a1d]"
        }`}
      >
        <div
          className={`absolute inset-0 ${
            isDark
              ? "bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)]"
              : "bg-[linear-gradient(rgba(31,42,29,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(31,42,29,0.08)_1px,transparent_1px)]"
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
                    : "border-[#1f2a1d]/10 bg-white/70"
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
                        isDark ? "bg-white/25" : "bg-[#1f2a1d]/20"
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
                    : "border-[#1f2a1d]/10 bg-white/70 text-[#4b5b47]"
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

  return (
    <div
      className={`relative aspect-[16/10] w-full overflow-hidden rounded-lg border ${
        isDark
          ? "border-white/10 bg-white/[0.04]"
          : "border-[#1f2a1d]/10 bg-[#e7eadf]"
      }`}
    >
      <Image
        src={current.src}
        alt={current.alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.025]"
      />
      <div
        className={`absolute inset-x-0 bottom-0 h-28 ${
          isDark
            ? "bg-gradient-to-t from-[#06151f]/85 to-transparent"
            : "bg-gradient-to-t from-[#1f2a1d]/45 to-transparent"
        }`}
      />
      <div className="absolute left-3 top-3 rounded-md bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur-md">
        {current.label}
      </div>

      {images.length > 1 && (
        <>
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                aria-label={`Ver imagen ${index + 1} de ${projectName}`}
                aria-pressed={active === index}
                onClick={() => setActive(index)}
                className={`h-1.5 rounded-full transition-all ${
                  active === index ? "w-7 bg-white" : "w-2 bg-white/45"
                }`}
              />
            ))}
          </div>
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            <button
              type="button"
              aria-label={`Imagen anterior de ${projectName}`}
              onClick={previous}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/70"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={`Siguiente imagen de ${projectName}`}
              onClick={next}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/70"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
