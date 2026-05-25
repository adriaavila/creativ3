import { ArrowUpRight } from "lucide-react";
import ProjectsGallery from "@/components/projects/ProjectsGallery";
import {
  FEATURED_PORTFOLIO_PROJECTS,
  PROJECTS_LAST_SYNCED_AT,
} from "@/lib/projects";

export default function ProyectosShowcase() {
  return (
    <section
      id="proyectos"
      className="relative w-full overflow-hidden bg-[#1f2a1d] text-white scroll-mt-24"
    >
      <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <div className="mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
          <div>
            <div className="mb-4 text-xs font-medium uppercase tracking-widest text-[#85AB8B]">
              Proyectos
            </div>
            <h2 className="max-w-3xl text-4xl font-normal leading-[0.95] text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Lo último de GitHub,{" "}
              <span className="text-[#85AB8B]">puesto en vitrina.</span>
            </h2>
          </div>
          <div className="max-w-sm space-y-4">
            <p className="text-base leading-relaxed text-white/70 md:text-lg">
              Webs, web apps y automatizaciones reales: cada tarjeta tiene
              contexto, stack y un carrusel de capturas del producto.
            </p>
            <a
              href="/projects"
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-[#1f2a1d] transition-colors hover:bg-[#85AB8B]"
            >
              Ver archivo completo
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 border-y border-white/10 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white/55 sm:grid-cols-3">
          <span>Sync GitHub · {PROJECTS_LAST_SYNCED_AT}</span>
          <span>{FEATURED_PORTFOLIO_PROJECTS.length} destacados recientes</span>
          <span>Web / Web app / Automatización</span>
        </div>

        <ProjectsGallery projects={FEATURED_PORTFOLIO_PROJECTS} tone="dark" />
      </div>
    </section>
  );
}
