"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  Code2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  PROJECT_CATEGORIES,
  type PortfolioProject,
  type ProjectCategory,
} from "@/lib/projects";
import ProjectImageCarousel from "@/components/projects/ProjectImageCarousel";

type FilterId = "all" | ProjectCategory;

type ProjectsGalleryProps = {
  projects: PortfolioProject[];
  tone?: "dark" | "light";
  variant?: "section" | "page";
};

const CATEGORY_ICONS = {
  all: Boxes,
  web: Code2,
  webapp: Boxes,
  automation: Sparkles,
} satisfies Record<FilterId, typeof Boxes>;

const CATEGORY_NAMES: Record<ProjectCategory, string> = {
  web: "Web",
  webapp: "Web app",
  automation: "Automatización",
};

export default function ProjectsGallery({
  projects,
  tone = "dark",
  variant = "section",
}: ProjectsGalleryProps) {
  const [active, setActive] = useState<FilterId>("all");
  const isDark = tone === "dark";

  const filteredProjects = useMemo(() => {
    if (active === "all") return projects;
    return projects.filter((project) => project.categories.includes(active));
  }, [active, projects]);

  const activeCategory = PROJECT_CATEGORIES.find((category) => category.id === active);
  const gridClass =
    variant === "page"
      ? "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
      : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="space-y-8">
      <div
        className={`flex flex-col gap-4 border-b pb-6 ${
          isDark ? "border-white/10" : "border-[#1f2a1d]/10"
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {PROJECT_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id];
            const count =
              category.id === "all"
                ? projects.length
                : projects.filter((project) =>
                    project.categories.includes(category.id as ProjectCategory),
                  ).length;
            const selected = active === category.id;

            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActive(category.id)}
                className={`inline-flex items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-semibold transition-colors ${
                  selected
                    ? isDark
                      ? "border-white bg-white text-[#1f2a1d]"
                      : "border-[#1f2a1d] bg-[#1f2a1d] text-white"
                    : isDark
                      ? "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white"
                      : "border-[#1f2a1d]/10 bg-white/65 text-[#4b5b47] hover:border-[#1f2a1d]/20 hover:text-[#1f2a1d]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{category.label}</span>
                <span
                  className={`font-mono text-[11px] ${
                    selected
                      ? isDark
                        ? "text-[#4b5b47]"
                        : "text-white/70"
                      : "opacity-60"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <p
          className={`max-w-2xl text-sm leading-relaxed ${
            isDark ? "text-white/60" : "text-[#4b5b47]"
          }`}
        >
          {activeCategory?.description}
        </p>
      </div>

      <div className={gridClass}>
        {filteredProjects.map((project, index) => (
          <article
            key={project.id}
            className={`group flex min-h-full flex-col rounded-lg border p-3 transition-all duration-300 ${
              isDark
                ? "border-white/10 bg-white/[0.045] hover:border-white/20 hover:bg-white/[0.075]"
                : "border-[#1f2a1d]/10 bg-white/75 shadow-sm hover:border-[#1f2a1d]/18 hover:bg-white hover:shadow-lg"
            }`}
          >
            <ProjectImageCarousel
              images={project.images}
              projectName={project.name}
              stack={project.stack}
              tone={tone}
            />

            <div className="flex flex-1 flex-col px-1 pt-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div
                    className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
                      isDark ? "text-[#a8c97f]" : "text-[#336443]"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")} · {project.kind}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {project.categories.map((category) => (
                      <span
                        key={category}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                          isDark
                            ? "bg-white/[0.07] text-white/70"
                            : "bg-[#85AB8B]/15 text-[#3d5638]"
                        }`}
                      >
                        {CATEGORY_NAMES[category]}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
                    isDark ? "text-white/45" : "text-[#4b5b47]/65"
                  }`}
                >
                  GitHub · {project.githubUpdatedLabel}
                </span>
              </div>

              <h3
                className={`text-2xl font-semibold tracking-tight md:text-3xl ${
                  isDark ? "text-white" : "text-[#1f2a1d]"
                }`}
              >
                {project.name}
              </h3>
              <p
                className={`mt-3 text-sm leading-relaxed ${
                  isDark ? "text-white/65" : "text-[#4b5b47]"
                }`}
              >
                {project.description}
              </p>
              <p
                className={`mt-4 border-l pl-4 text-sm leading-relaxed ${
                  isDark
                    ? "border-[#a8c97f]/35 text-white/78"
                    : "border-[#336443]/30 text-[#263623]"
                }`}
              >
                {project.result}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {project.stack.map((item) => (
                  <span
                    key={item}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                      isDark
                        ? "border-white/10 bg-white/[0.05] text-white/65"
                        : "border-[#1f2a1d]/10 bg-[#f5f3ec] text-[#4b5b47]"
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-2 pt-1">
                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                      isDark
                        ? "bg-white text-[#1f2a1d] hover:bg-[#a8c97f]"
                        : "bg-[#1f2a1d] text-white hover:bg-[#336443]"
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir
                  </a>
                ) : null}
                {project.caseStudyUrl ? (
                  <Link
                    href={project.caseStudyUrl}
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                      isDark
                        ? "border-white/15 text-white/75 hover:border-white/30 hover:text-white"
                        : "border-[#1f2a1d]/15 text-[#1f2a1d] hover:border-[#1f2a1d]/30"
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Caso
                  </Link>
                ) : null}
                {project.sourceUrl ? (
                  <a
                    href={project.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                      isDark
                        ? "border-white/15 text-white/75 hover:border-white/30 hover:text-white"
                        : "border-[#1f2a1d]/15 text-[#1f2a1d] hover:border-[#1f2a1d]/30"
                    }`}
                  >
                    <Code2 className="h-4 w-4" />
                    Código
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
