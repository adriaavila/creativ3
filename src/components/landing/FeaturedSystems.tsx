"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { track } from "@vercel/analytics";
import type { LandingIntent } from "@/lib/landing-intent";
import { PORTFOLIO_PROJECTS, type PortfolioProject } from "@/lib/projects";

const FEATURED_IDS: Record<LandingIntent, string[]> = {
  efficiency: ["rei-fm", "mistica", "soapy"],
  revenue: ["shopea", "artistheway", "frontai-landing"],
};

const SECTION_COPY = {
  efficiency: {
    eyebrow: "Trabajo · eficiencia",
    title: "Sistemas que devuelven",
    accent: "tiempo al negocio.",
    body: "Apps y operaciones digitales donde cada pantalla elimina una duda, un paso manual o una decisión tardía.",
  },
  revenue: {
    eyebrow: "Trabajo · crecimiento",
    title: "Experiencias que convierten",
    accent: "atención en negocio.",
    body: "Diseño comercial con una idea fuerte, una ruta de compra clara y una ejecución visual que hace que la marca se sienta inevitable.",
  },
} as const;
const STATUS_LABEL = {
  launched: "Lanzado",
  demo: "Demo",
  prototype: "Prototipo",
  improving: "En mejora",
};

type FeaturedSystemsProps = {
  intent?: LandingIntent;
};

export default function FeaturedSystems({ intent = "efficiency" }: FeaturedSystemsProps) {
  const isRevenue = intent === "revenue";
  const copy = SECTION_COPY[intent];
  const projects = FEATURED_IDS[intent]
    .map((id) => PORTFOLIO_PROJECTS.find((project) => project.id === id))
    .filter((project): project is PortfolioProject => Boolean(project));

  return (
    <section
      id="trabajo"
      className={`scroll-mt-6 px-5 py-24 text-[#0a0a0a] transition-colors duration-700 sm:px-8 lg:px-12 lg:py-36 ${
        isRevenue ? "bg-[#ffffff]" : "bg-[#ffffff]"
      }`}
    >
      <div key={intent} className="landing-intent-enter mx-auto max-w-[1440px]">
        <div className="mb-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div
              className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
                isRevenue ? "text-[#4a4b4f]" : "text-[#26272b]"
              }`}
            >
              {copy.eyebrow}
            </div>
            <h2 className="mt-4 max-w-4xl font-display text-[clamp(3.2rem,7vw,7.8rem)] leading-[0.86] tracking-[-0.045em]">
              {copy.title}
              <span className={`block italic ${isRevenue ? "text-[#4a4b4f]" : "text-[#0a0a0a]"}`}>
                {copy.accent}
              </span>
            </h2>
          </div>
          <div className="max-w-xl lg:justify-self-end">
            <p className="text-base leading-7 text-[#6b6b6b] sm:text-lg">{copy.body}</p>
            <Link
              href="/projects"
              className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4 ${
                isRevenue
                  ? "text-[#4a4b4f] decoration-[#4a4b4f]/25"
                  : "text-[#0a0a0a] decoration-[#0a0a0a]/25"
              }`}
            >
              Explorar archivo completo <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-16 lg:gap-24">
          {projects.map((project, index) => (
            <article
              id={project.id}
              key={project.id}
              className={`grid scroll-mt-24 gap-7 lg:grid-cols-[1.38fr_0.62fr] lg:items-center ${
                index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div
                className={`group relative aspect-[16/10] overflow-hidden rounded-[1.6rem] border border-[#0a0a0a]/10 shadow-[0_30px_90px_rgba(10, 10, 10,0.12)] ${
                  isRevenue ? "bg-[#d4d4d4]" : "bg-[#ebebeb]"
                }`}
              >
                {project.images[0] ? (
                  <Image
                    src={project.images[0].src}
                    alt={project.images[0].alt}
                    fill
                    sizes="(min-width: 1024px) 65vw, 100vw"
                    className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                  />
                ) : null}
                <div className="absolute left-4 top-4 flex gap-2 font-mono text-[9px] uppercase tracking-[0.16em]">
                  <span className="rounded-full bg-[#ffffff]/92 px-3 py-1.5 text-[#0a0a0a] backdrop-blur">
                    {STATUS_LABEL[project.status]}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1.5 text-white backdrop-blur ${
                      isRevenue ? "bg-[#4a4b4f]/92" : "bg-[#0a0a0a]/90"
                    }`}
                  >
                    {project.businessGoal === "increase_revenue"
                      ? "Vender más"
                      : project.businessGoal === "reduce_costs"
                        ? "Reducir costos"
                        : "Crecimiento + eficiencia"}
                  </span>
                </div>
              </div>

              <div className="max-w-xl">
                <div
                  className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                    isRevenue ? "text-[#4a4b4f]" : "text-[#4a4b4f]"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")} · {project.kind}
                </div>
                <h3 className="mt-4 font-display text-5xl leading-[0.9] sm:text-6xl">{project.name}</h3>
                <p className="mt-6 text-base leading-7 text-[#6b6b6b]">{project.businessOutcome}</p>
                <div className="mt-7 border-y border-[#0a0a0a]/10 py-5">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b6b6b]">
                    {isRevenue ? "Decisión de experiencia" : "Capa inteligente"}
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#1c1d20]">{project.agentRole}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.stack.slice(0, 4).map((item) => (
                    <span
                      key={item}
                      className={`rounded-full border border-[#0a0a0a]/10 px-3 py-1.5 text-xs text-[#4a4b4f] ${
                        isRevenue ? "bg-[#ebebeb]" : "bg-[#f3f3f3]"
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track("portfolio_project_visited", { project: project.id, destination: "live" })}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition-colors ${
                        isRevenue ? "bg-[#4a4b4f] hover:bg-[#4a4b4f]" : "bg-[#0a0a0a] hover:bg-[#0a0a0a]"
                      }`}
                    >
                      Abrir sistema <ArrowUpRight className="size-4" />
                    </a>
                  )}
                  {project.caseStudyUrl && (
                    <Link
                      href={project.caseStudyUrl}
                      onClick={() => track("portfolio_project_visited", { project: project.id, destination: "case_study" })}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#0a0a0a]/12 px-5 text-sm font-semibold"
                    >
                      Ver caso
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
