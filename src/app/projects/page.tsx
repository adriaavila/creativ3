import type { Metadata } from "next";
import Link from "next/link";
import Colofon from "@/components/landing/Colofon";
import ProjectsGallery from "@/components/projects/ProjectsGallery";
import {
  PORTFOLIO_PROJECTS,
  PROJECTS_LAST_SYNCED_AT,
} from "@/lib/projects";

export const metadata: Metadata = {
  title: "Trabajos · Allok",
  description:
    "Trabajos recientes de Allok: sistemas comerciales, web apps y automatizaciones en producción, sincronizados desde GitHub.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsIndex() {
  const totalImages = PORTFOLIO_PROJECTS.reduce(
    (count, project) => count + project.images.length,
    0,
  );

  return (
    <>
      <main className="min-h-screen px-6 pb-28 pt-32 sm:px-10 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <section className="mb-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Trabajos · Sync con GitHub
              </span>
              <h1
                className="mt-5 font-medium leading-[0.94] tracking-tight text-[var(--text-primary)]"
                style={{ fontSize: "clamp(48px, 8vw, 120px)" }}
              >
                Sistemas
                <br />
                <span className="text-[var(--lima)]">en producción.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                Cada tarjeta es un sistema real: quién lo usa, qué problema resuelve y qué stack lo sostiene. Sin
                mockups, capturas del producto funcionando.
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
                  className="rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface-1)] p-4"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    {label}
                  </div>
                  <div className="mt-2 text-2xl font-medium tracking-tight text-[var(--text-primary)]">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <ProjectsGallery projects={PORTFOLIO_PROJECTS} variant="page" />

          <div className="mt-20 flex flex-col items-start gap-4 border-t border-[var(--line)] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-sm text-[var(--text-secondary)]">
              Tu sistema comercial puede ser el próximo en esta lista.
            </p>
            <Link
              href="/cotizar"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--lima)] px-5 py-2.5 text-sm font-semibold text-[var(--lima-ink)] transition-transform hover:-translate-y-0.5"
            >
              Diseñar mi sistema
            </Link>
          </div>
        </div>
      </main>
      <Colofon />
    </>
  );
}
