"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { ApplicationItem } from "./content";
import styles from "./ProductHome.module.css";

type ApplicationExplorerProps = {
  items: ApplicationItem[];
  evaluationUrl: string;
};

export default function ApplicationExplorer({ items, evaluationUrl }: ApplicationExplorerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeItem = items[activeIndex];

  const moveFocus = (index: number) => {
    const nextIndex = (index + items.length) % items.length;
    setActiveIndex(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={styles.explorerShell}>
      <div className={styles.explorerTabs} role="tablist" aria-label="Tipos de aplicaciones">
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={activeIndex === index}
            aria-controls={`panel-${item.id}`}
            tabIndex={activeIndex === index ? 0 : -1}
            className={`${styles.explorerTab} ${activeIndex === index ? styles.explorerTabActive : ""}`}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                event.preventDefault();
                moveFocus(index + 1);
              }
              if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                event.preventDefault();
                moveFocus(index - 1);
              }
              if (event.key === "Home") {
                event.preventDefault();
                moveFocus(0);
              }
              if (event.key === "End") {
                event.preventDefault();
                moveFocus(items.length - 1);
              }
            }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item.title}
          </button>
        ))}
      </div>

      <div
        key={activeItem.id}
        id={`panel-${activeItem.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeItem.id}`}
        className={styles.explorerPanel}
      >
        <div className={styles.explorerPreview}>
          <Image
            src={activeItem.image}
            alt={activeItem.imageAlt}
            fill
            sizes="(max-width: 900px) 100vw, 62vw"
            className={styles.explorerImage}
          />
          <div className={styles.previewChrome} aria-hidden="true">
            <span />
            <span />
            <span />
            <p>{activeItem.project}</p>
          </div>
        </div>
        <div className={styles.explorerCopy} aria-live="polite">
          <div>
            <p className={styles.microLabel}>Qué resuelve</p>
            <h3>{activeItem.title}</h3>
            <p>{activeItem.description}</p>
          </div>
          <div className={styles.explorerOutcome}>
            <span aria-hidden="true" />
            <p>{activeItem.outcome}</p>
          </div>
          <a href={evaluationUrl} target="_blank" rel="noopener noreferrer">
            Conversar sobre esta aplicación <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
