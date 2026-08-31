"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PROJECT_CATEGORIES, type PortfolioProject, type ProjectCategory } from "@/lib/projects";

type Filter = "all" | ProjectCategory;

/**
 * The work index is a log, not a card grid: one hard rule per system, read
 * top to bottom. Hovering a row lifts its real screenshot onto the cursor —
 * the only motion on the page, and the only reason this is a client
 * component. Pointer position rides two CSS custom properties so the plate
 * follows without a re-render per frame.
 */
export default function WorkIndex({ projects }: { projects: PortfolioProject[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [hovered, setHovered] = useState<PortfolioProject | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const shown =
    filter === "all" ? projects : projects.filter((p) => p.categories.includes(filter));

  const track = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = listRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--px", `${event.clientX - box.left}px`);
    el.style.setProperty("--py", `${event.clientY - box.top}px`);
  };

  const preview = hovered?.images[0];

  return (
    <>
      <div
        role="group"
        aria-label="Filter systems"
        className="flex flex-wrap gap-px border-y border-[var(--rule)] bg-[var(--rule)]"
      >
        {PROJECT_CATEGORIES.map((category) => {
          const count =
            category.id === "all"
              ? projects.length
              : projects.filter((p) => p.categories.includes(category.id as ProjectCategory))
                  .length;
          const active = filter === category.id;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(category.id as Filter)}
              className={cn(
                "mono flex-1 px-5 py-4 text-left transition-colors sm:px-6",
                active
                  ? "bg-[var(--carbon)] text-[var(--paper)]"
                  : "bg-[var(--paper)] text-[var(--carbon-2)] hover:bg-[var(--paper-2)] hover:text-[var(--carbon)]",
              )}
            >
              {category.label}
              <span
                className={cn(
                  "ml-2 tabular-nums",
                  active ? "text-[var(--hazard)]" : "text-[var(--carbon-3)]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div ref={listRef} onPointerMove={track} onPointerLeave={() => setHovered(null)} className="relative">
        {/* Cursor plate. Hidden from assistive tech and from touch — a flourish
            for a pointer that exists, never a source of information. */}
        {preview ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-(--px) top-(--py) z-20 hidden -translate-y-1/2 translate-x-6 border border-[var(--rule-hard)] shadow-[0_20px_60px_rgba(10,10,10,0.28)] lg:block"
          >
            <Image
              src={preview.src}
              alt=""
              width={360}
              height={225}
              className="h-[225px] w-[360px] object-cover object-top"
            />
          </div>
        ) : null}

        <ol>
          {shown.map((project, i) => (
            <li key={project.id} className="border-b border-[var(--rule)]">
              <Link
                href={`/work/${project.id}`}
                onPointerEnter={() => setHovered(project)}
                onFocus={() => setHovered(null)}
                className="group grid grid-cols-1 items-baseline gap-x-6 gap-y-2 px-5 py-7 transition-colors hover:bg-[var(--paper-2)] sm:px-10 md:grid-cols-[64px_minmax(0,1.1fr)_minmax(0,1.2fr)_160px]"
              >
                <span className="mono text-[var(--carbon-3)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[clamp(1.6rem,3.6vw,2.75rem)] font-medium leading-[1.02] tracking-[-0.035em] group-hover:text-[var(--hazard)]">
                  {project.name}
                </span>
                <span className="text-[15px] leading-snug text-[var(--carbon-2)]">{project.kind}</span>
                <span className="mono text-[var(--carbon-3)] md:text-right">
                  {project.categories.join(" · ")}
                  <br />
                  {project.year}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {shown.length === 0 ? (
          <p className="mono px-5 py-10 text-[var(--carbon-3)] sm:px-10">
            No systems in this category.
          </p>
        ) : null}
      </div>
    </>
  );
}
