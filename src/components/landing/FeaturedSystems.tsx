"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { track } from "@vercel/analytics";
import { PORTFOLIO_PROJECTS } from "@/lib/projects";

const FEATURED_IDS = ["rei-fm", "mistica", "frontai-landing", "soapy"];
const STATUS_LABEL = {
  launched: "Lanzado",
  demo: "Demo",
  prototype: "Prototipo",
  improving: "En mejora",
};

export default function FeaturedSystems() {
  const projects = FEATURED_IDS.map((id) => PORTFOLIO_PROJECTS.find((project) => project.id === id)).filter(
    Boolean,
  );

  return (
    <section id="trabajo" className="bg-[#fffdf7] px-5 py-24 text-[#172016] sm:px-8 lg:px-12 lg:py-36">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#456241]">Trabajo</div>
            <h2 className="mt-4 max-w-4xl font-display text-[clamp(3.2rem,7vw,7.8rem)] leading-[0.86] tracking-[-0.045em]">
              Sistemas que se entienden
              <span className="block italic text-[#31583a]">por lo que resuelven.</span>
            </h2>
          </div>
          <div className="max-w-xl lg:justify-self-end">
            <p className="text-base leading-7 text-[#53624f] sm:text-lg">
              No mostramos mockups como decoración. Mostramos el flujo, el objetivo y la capa de operación
              que hace útil cada producto.
            </p>
            <Link
              href="/projects"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#31583a] underline decoration-[#31583a]/25 underline-offset-4"
            >
              Explorar archivo completo <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-16 lg:gap-24">
          {projects.map((project, index) => (
            <article
              id={project!.id}
              key={project!.id}
              className={`grid scroll-mt-24 gap-7 lg:grid-cols-[1.38fr_0.62fr] lg:items-center ${
                index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="group relative aspect-[16/10] overflow-hidden rounded-[1.6rem] border border-[#172016]/10 bg-[#e8eadf] shadow-[0_30px_90px_rgba(23,32,22,0.12)]">
                {project!.images[0] ? (
                  <Image
                    src={project!.images[0].src}
                    alt={project!.images[0].alt}
                    fill
                    sizes="(min-width: 1024px) 65vw, 100vw"
                    className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                  />
                ) : null}
                <div className="absolute left-4 top-4 flex gap-2 font-mono text-[9px] uppercase tracking-[0.16em]">
                  <span className="rounded-full bg-[#fffdf7]/92 px-3 py-1.5 text-[#172016] backdrop-blur">
                    {STATUS_LABEL[project!.status]}
                  </span>
                  <span className="rounded-full bg-[#172016]/90 px-3 py-1.5 text-white backdrop-blur">
                    {project!.businessGoal === "sell_more"
                      ? "Vender más"
                      : project!.businessGoal === "reduce_costs"
                        ? "Reducir costos"
                        : "Crecimiento + eficiencia"}
                  </span>
                </div>
              </div>

              <div className="max-w-xl">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#587151]">
                  {String(index + 1).padStart(2, "0")} · {project!.kind}
                </div>
                <h3 className="mt-4 font-display text-5xl leading-[0.9] sm:text-6xl">{project!.name}</h3>
                <p className="mt-6 text-base leading-7 text-[#53624f]">{project!.businessOutcome}</p>
                <div className="mt-7 border-y border-[#172016]/10 py-5">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#73806f]">
                    Capa agente
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#273526]">{project!.agentRole}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {project!.stack.slice(0, 4).map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#172016]/10 bg-[#f4f0e5] px-3 py-1.5 text-xs text-[#52604e]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  {project!.liveUrl && (
                    <a
                      href={project!.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track("portfolio_project_visited", { project: project!.id, destination: "live" })}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#172016] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#31583a]"
                    >
                      Abrir sistema <ArrowUpRight className="size-4" />
                    </a>
                  )}
                  {project!.caseStudyUrl && (
                    <Link
                      href={project!.caseStudyUrl}
                      onClick={() => track("portfolio_project_visited", { project: project!.id, destination: "case_study" })}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#172016]/12 px-5 text-sm font-semibold"
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
