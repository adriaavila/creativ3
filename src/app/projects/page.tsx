import type { Metadata } from "next";
import Link from "next/link";
import Colofon from "@/components/landing/Colofon";
import ProjectsGallery from "@/components/projects/ProjectsGallery";
import {
  PORTFOLIO_PROJECTS,
  PROJECTS_LAST_SYNCED_AT,
} from "@/lib/projects";

export const metadata: Metadata = {
  title: "Proyectos · creativv",
  description:
    "Archivo de proyectos recientes de creativv: webs, web apps y automatizaciones sincronizadas desde GitHub.",
};

export default function ProjectsIndex() {
  const totalImages = PORTFOLIO_PROJECTS.reduce(
    (count, project) => count + project.images.length,
    0,
  );

  return (
    <>
      <main className="relative z-10 min-h-screen bg-[#f5f3ec] px-6 pb-28 pt-28 text-[#1f2a1d] sm:px-10 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex items-start justify-between gap-6 font-mono text-xs tracking-wide text-[#4b5b47] sm:text-sm">
            <Link href="/" className="transition-colors hover:text-[#1f2a1d]">
              Volver a inicio
            </Link>
            <span>PROYECTOS · GITHUB SYNC</span>
          </div>

          <section className="mb-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <h1
                className="font-normal leading-[0.92] tracking-tight"
                style={{ fontSize: "clamp(52px, 9vw, 150px)" }}
              >
                Proyectos
                <br />
                <span className="italic text-[#336443]">con pulso.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-[#4b5b47] sm:text-lg">
                Si hay push reciente, entra al radar. Este archivo mezcla lo
                último de GitHub con descripción curada, categoría por tipo de
                trabajo y capturas reales de cada producto.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["Repos leídos", PORTFOLIO_PROJECTS.length.toString()],
                ["Capturas", totalImages.toString()],
                ["Último sync", PROJECTS_LAST_SYNCED_AT],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-[#1f2a1d]/10 bg-white/70 p-4"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4b5b47]/65">
                    {label}
                  </div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-[#1f2a1d]">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <ProjectsGallery
            projects={PORTFOLIO_PROJECTS}
            tone="light"
            variant="page"
          />

          <div className="mt-20 border-t border-[#1f2a1d]/10 pt-8 font-mono text-sm text-[#4b5b47]">
            Tu proyecto puede ser el siguiente.{" "}
            <Link
              href="/cotizar"
              className="font-semibold text-[#336443] transition-colors hover:text-[#1f2a1d]"
            >
              Pedir diagnóstico
            </Link>
          </div>
        </div>
      </main>
      <Colofon />
    </>
  );
}
