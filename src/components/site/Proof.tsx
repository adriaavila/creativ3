import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { PORTFOLIO_PROJECTS, type PortfolioProject } from "@/lib/projects";

const PROOF_IDS = ["rei-fm", "shopea", "frontai-landing"] as const;

const STATUS_LABEL: Record<PortfolioProject["status"], string> = {
  launched: "Sistema implementado",
  improving: "Flujo en producción",
  demo: "Caso de uso",
  prototype: "Ejemplo de operación",
};

export default function Proof({ messages }: { messages: Messages }) {
  const { proof } = messages.home;
  const projects = PROOF_IDS.map((id) => PORTFOLIO_PROJECTS.find((project) => project.id === id)).filter(
    (project): project is PortfolioProject => Boolean(project)
  );

  return (
    <section id="resultados" className="border-t border-[var(--line)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--lima)]">
            {proof.label}
          </span>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.02em] text-[var(--text-primary)] sm:text-4xl">
            {proof.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{proof.lead}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {projects.map((project) => (
            <a
              key={project.id}
              href={project.liveUrl ?? "/projects"}
              target={project.liveUrl ? "_blank" : undefined}
              rel={project.liveUrl ? "noopener noreferrer" : undefined}
              className="group flex flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface-1)] transition-colors hover:border-[var(--line-strong)]"
            >
              {project.images[0] ? (
                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-2)]">
                  <Image
                    src={project.images[0].src}
                    alt={project.images[0].alt}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col gap-2 p-5">
                <span className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  {STATUS_LABEL[project.status]}
                </span>
                <h3 className="flex items-center gap-1.5 text-lg font-medium text-[var(--text-primary)]">
                  {project.name}
                  <ArrowUpRight
                    className="size-4 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{project.kind}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
