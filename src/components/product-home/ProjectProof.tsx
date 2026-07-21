"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ProjectImage } from "@/lib/projects";
import styles from "./ProductHome.module.css";

export type ProjectProofItem = {
  id: string;
  name: string;
  kind: string;
  service: string;
  before: string;
  description: string;
  outcome: string;
  images: ProjectImage[];
  href?: string;
};

type ProjectProofProps = {
  projects: ProjectProofItem[];
  evaluationUrl: string;
};

export default function ProjectProof({ projects, evaluationUrl }: ProjectProofProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeProject = projects[activeIndex];

  const selectProject = (index: number, focus = false) => {
    const nextIndex = (index + projects.length) % projects.length;
    setActiveIndex(nextIndex);
    setActiveImageIndex(0);
    if (focus) tabRefs.current[nextIndex]?.focus();
  };

  if (!activeProject) return null;
  const activeImage = activeProject.images[activeImageIndex] ?? activeProject.images[0];
  const moveImage = (direction: -1 | 1) => {
    setActiveImageIndex((current) => (current + direction + activeProject.images.length) % activeProject.images.length);
  };

  return (
    <section id="proyectos" className={styles.projectProofSection}>
      <div className={styles.container}>
        <header className={styles.projectProofHeader}>
          <div>
            <p className={styles.eyebrow}>Producto real</p>
            <h2>Cinco negocios. Cinco sistemas hechos para mover algo concreto.</h2>
          </div>
          <p>
            No son renders de portafolio. Puedes recorrer el producto, ver sus decisiones y evaluar qué se puede
            trasladar a tu negocio.
          </p>
        </header>

        <div className={styles.projectProofShell}>
          <div className={styles.projectAccordion} role="tablist" aria-label="Proyectos realizados">
            {projects.map((project, index) => (
              <button
                key={project.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`project-tab-${project.id}`}
                aria-selected={activeIndex === index}
                aria-controls={`project-panel-${project.id}`}
                tabIndex={activeIndex === index ? 0 : -1}
                className={activeIndex === index ? styles.projectAccordionActive : ""}
                onClick={() => selectProject(index)}
                onMouseEnter={() => selectProject(index)}
                onFocus={() => selectProject(index)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    event.preventDefault();
                    selectProject(index + 1, true);
                  }
                  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault();
                    selectProject(index - 1, true);
                  }
                  if (event.key === "Home") {
                    event.preventDefault();
                    selectProject(0, true);
                  }
                  if (event.key === "End") {
                    event.preventDefault();
                    selectProject(projects.length - 1, true);
                  }
                }}
              >
                <Image
                  src={project.images[0].src}
                  alt=""
                  fill
                  sizes="(max-width: 760px) 78vw, (max-width: 1100px) 44vw, 38vw"
                  className={styles.projectAccordionImage}
                />
                <span className={styles.projectAccordionShade} aria-hidden="true" />
                <span className={styles.projectAccordionIndex}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.projectAccordionLabel}>
                  <small>{project.service}</small>
                  <strong>{project.name}</strong>
                  <em>{project.outcome}</em>
                </span>
              </button>
            ))}
          </div>

          <article
            key={activeProject.id}
            id={`project-panel-${activeProject.id}`}
            role="tabpanel"
            aria-labelledby={`project-tab-${activeProject.id}`}
            className={styles.projectProofPanel}
          >
            <div className={styles.projectProofMedia}>
              <Image
                key={activeImage.src}
                src={activeImage.src}
                alt={activeImage.alt}
                fill
                sizes="(max-width: 899px) 100vw, 63vw"
                className={styles.projectProofImage}
              />
              <div className={styles.projectProofChrome} aria-hidden="true">
                <span /><span /><span />
                <p>{activeProject.name} · {activeImage.label}</p>
              </div>
              <div className={styles.projectImageControls}>
                <button type="button" onClick={() => moveImage(-1)} aria-label="Vista anterior">
                  <ArrowLeft aria-hidden="true" />
                </button>
                <span>{String(activeImageIndex + 1).padStart(2, "0")} / {String(activeProject.images.length).padStart(2, "0")}</span>
                <button type="button" onClick={() => moveImage(1)} aria-label="Vista siguiente">
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className={styles.projectProofCopy} aria-live="polite">
              <div>
                <p className={styles.eyebrow}>{activeProject.service}</p>
                <h3>{activeProject.name}</h3>
                <span>{activeProject.kind}</span>
              </div>

              <dl>
                <div>
                  <dt>El problema</dt>
                  <dd>{activeProject.before}</dd>
                </div>
                <div>
                  <dt>Lo que construimos</dt>
                  <dd>{activeProject.description}</dd>
                </div>
                <div>
                  <dt>Valor para el negocio</dt>
                  <dd>{activeProject.outcome}</dd>
                </div>
              </dl>

              <div className={styles.projectProofActions}>
                {activeProject.href ? (
                  <a href={activeProject.href} target="_blank" rel="noopener noreferrer">
                    Ver producto <ArrowUpRight aria-hidden="true" />
                  </a>
                ) : null}
                <a href={evaluationUrl} target="_blank" rel="noopener noreferrer">
                  Evaluar un caso similar <ArrowUpRight aria-hidden="true" />
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
