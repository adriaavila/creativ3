import type { Metadata } from "next";
import Link from "next/link";
import Colofon from "@/components/landing/Colofon";
import ProjectsGallery from "@/components/projects/ProjectsGallery";
import {
  PORTFOLIO_PROJECTS,
  PROJECTS_LAST_SYNCED_AT,
} from "@/lib/projects";

export const metadata: Metadata = {
  title: "Trabajos · allok",
  description:
    "Trabajos recientes de allok: webs, web apps y automatizaciones en producción, sincronizados desde GitHub.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsIndex() {
  const totalImages = PORTFOLIO_PROJECTS.reduce(
    (count, project) => count + project.images.length,
    0,
  );

  return (
    <>
      <main className="relative z-10 min-h-screen bg-[#08090a] px-6 pb-28 pt-32 text-white selection:bg-[#c5f04a] selection:text-[#0a0a0a] sm:px-10 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <section className="mb-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.24em] text-[#c5f04a]">
                Trabajos · Sync con GitHub
              </span>
              <h1
                className="mt-5 font-display font-normal leading-[0.92] tracking-tight text-white"
                style={{ fontSize: "clamp(52px, 9vw, 150px)" }}
              >
                Trabajos
                <br />
                <span className="italic text-[#c5f04a]">en producción.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
                Cada tarjeta es un sistema real: quién lo usa, qué problema
                resuelve y qué stack lo sostiene. Sin mockups, capturas del
                producto funcionando.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["Sistemas activos", PORTFOLIO_PROJECTS.length.toString()],
                ["Capturas reales", totalImages.toString()],
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

          <div className="mt-20 flex flex-col items-start gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-sm text-white/70">
              Tu sistema puede ser el próximo en esta lista.
            </p>
            <Link
              href="/cotizar"
              className="inline-flex items-center gap-2 rounded-full bg-[#c5f04a] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-white"
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
