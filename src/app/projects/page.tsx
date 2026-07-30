import type { Metadata } from "next";
import Link from "next/link";
import Colofon from "@/components/landing/Colofon";
import ProjectsGallery from "@/components/projects/ProjectsGallery";
import {
  PORTFOLIO_PROJECTS,
  PROJECTS_LAST_SYNCED_AT,
} from "@/lib/projects";

export const metadata: Metadata = {
  title: "Proyectos · allok",
  description:
    "Archivo de proyectos recientes de allok: webs, web apps y automatizaciones sincronizadas desde GitHub.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsIndex() {
  const totalImages = PORTFOLIO_PROJECTS.reduce(
    (count, project) => count + project.images.length,
    0,
  );

  return (
    <>
      <main className="relative z-10 min-h-screen bg-[#08090a] px-6 pb-28 pt-28 text-white selection:bg-[#0a0a0a] selection:text-white sm:px-10 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex items-start justify-between gap-6 font-mono text-xs tracking-wide text-white/70 sm:text-sm">
            <Link href="/" className="transition-colors text-[#c5f04a] hover:text-white">
              Volver a inicio
            </Link>
            <span className="text-[#c5f04a]">PROYECTOS · GITHUB SYNC</span>
          </div>

          <section className="mb-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <h1
                className="font-display font-normal leading-[0.92] tracking-tight text-white"
                style={{ fontSize: "clamp(52px, 9vw, 150px)" }}
              >
                Proyectos
                <br />
                <span className="italic text-[#c5f04a]">con pulso.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
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
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#c5f04a]">
                    {label}
                  </div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <ProjectsGallery
            projects={PORTFOLIO_PROJECTS}
            tone="dark"
            variant="page"
          />

          <div className="mt-20 border-t border-white/10 pt-8 font-mono text-sm text-white/70">
            Tu proyecto puede ser el siguiente.{" "}
            <Link
              href="/cotizar"
              className="font-semibold text-[#c5f04a] transition-colors hover:text-white"
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
