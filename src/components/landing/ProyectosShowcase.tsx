import Link from "next/link";
import { ArrowUpRight, Code2, Images, RadioTower } from "lucide-react";
import ProjectsGallery from "@/components/projects/ProjectsGallery";
import {
  FEATURED_PORTFOLIO_PROJECTS,
  PROJECTS_LAST_SYNCED_AT,
} from "@/lib/projects";
import { whatsappUrl } from "@/lib/contact";
import Reveal from "./Reveal";

const PROJECT_CTA = whatsappUrl(
  "Hola, vi los proyectos realizados de creativv y quiero construir algo parecido para mi negocio. Mi caso es:"
);

export default function ProyectosShowcase() {
  const totalImages = FEATURED_PORTFOLIO_PROJECTS.reduce(
    (count, project) => count + project.images.length,
    0,
  );
  const projectNames = FEATURED_PORTFOLIO_PROJECTS.map((project) => project.name);

  return (
    <section
      id="proyectos"
      className="relative w-full overflow-hidden bg-[#101810] text-white scroll-mt-24"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#dbe9c3]/60 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(219,233,195,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(219,233,195,0.045)_1px,transparent_1px)] bg-[size:42px_42px]" />

      <div className="relative mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="mb-10 overflow-hidden border-y border-white/10 py-3">
          <div className="flex w-max animate-[project-marquee_28s_linear_infinite] gap-8 font-mono text-[11px] uppercase tracking-[0.22em] text-white/45">
            {[...projectNames, ...projectNames].map((name, index) => (
              <span key={`${name}-${index}`} className="flex items-center gap-8">
                <span>{name}</span>
                <span className="h-1 w-1 rounded-full bg-[#dbe9c3]" />
              </span>
            ))}
          </div>
        </div>

        <Reveal className="mb-14 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#dbe9c3] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#101810]">
              <RadioTower className="h-3.5 w-3.5" />
              Proyectos realizados
            </div>
            <h2 className="max-w-3xl text-4xl font-normal leading-[0.94] sm:text-5xl md:text-6xl lg:text-7xl">
              Builds reales, con pantallas y pulso.
            </h2>
          </div>

          <div className="max-w-xl">
            <p className="text-base leading-relaxed text-white/70 md:text-lg">
              Una muestra de productos, webs y sistemas que ya salieron del editor:
              operaciones inmobiliarias, ecommerce, SaaS, automatizaciones y dashboards con capturas reales.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={PROJECT_CTA}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#dbe9c3] px-5 py-3 text-sm font-semibold text-[#101810] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
              >
                Quiero algo así
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <Link
                href="/projects"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/10"
              >
                Ver archivo completo
              </Link>
            </div>
          </div>
        </Reveal>

        <div className="mb-14 grid grid-cols-1 gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/55 sm:grid-cols-3">
          {[
            {
              icon: Code2,
              label: "Proyectos destacados",
              value: FEATURED_PORTFOLIO_PROJECTS.length.toString(),
            },
            {
              icon: Images,
              label: "Capturas reales",
              value: totalImages.toString(),
            },
            {
              icon: RadioTower,
              label: "Último sync",
              value: PROJECTS_LAST_SYNCED_AT,
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.label} delay={i * 0.08}>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.045] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-[#dbe9c3]" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-white">{item.value}</span>
                </div>
              </Reveal>
            );
          })}
        </div>

        <ProjectsGallery projects={FEATURED_PORTFOLIO_PROJECTS} tone="dark" />
      </div>
    </section>
  );
}
