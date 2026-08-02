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
      <main className="studio relative z-10 min-h-screen bg-white px-6 pb-28 pt-32 text-black selection:bg-[#c5f04a] selection:text-black sm:px-10 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <section className="mb-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.24em] text-neutral-500">
                Trabajos · Sync con GitHub
              </span>
              <h1
                className="mt-5 font-normal leading-[0.92] tracking-tight text-black"
                style={{ fontSize: "clamp(52px, 9vw, 150px)" }}
              >
                Trabajos
                <br />
                <span className="italic text-[#587615]">en producción.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
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
                  className="rounded-2xl border border-black/10 bg-[var(--studio-surface)] p-4 text-black"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                    {label}
                  </div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-black">
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

          <div className="mt-20 flex flex-col items-start gap-4 border-t border-black/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-sm text-neutral-600">
              Tu sistema puede ser el próximo en esta lista.
            </p>
            <Link
              href="/cotizar"
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
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
