"use client";

import { useEffect, useRef } from "react";

type Props = {
  cols?: number;
  rows?: number;
  tile?: number;
  gap?: number;
  maxDist?: number;
  strength?: number;
  accent?: string;
};

export default function MagneticGrid({
  cols = 14,
  rows = 8,
  tile = 40,
  gap = 8,
  maxDist = 140,
  strength = 22,
  accent = "#ff8a4c",
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const isMobile = window.innerWidth < 640;
    const actualCols = isMobile ? Math.min(cols, 9) : cols;
    const actualRows = isMobile ? Math.min(rows, 6) : rows;
    const actualTile = isMobile ? 32 : tile;

    grid.style.gridTemplateColumns = `repeat(${actualCols}, ${actualTile}px)`;
    grid.style.gridTemplateRows = `repeat(${actualRows}, ${actualTile}px)`;
    grid.style.gap = `${gap}px`;

    const dots: HTMLDivElement[] = [];
    for (let i = 0; i < actualCols * actualRows; i++) {
      const d = document.createElement("div");
      d.className = "magnetic-dot";
      d.style.width = `${actualTile}px`;
      d.style.height = `${actualTile}px`;
      grid.appendChild(d);
      dots.push(d);
    }

    let mx = -9999;
    let my = -9999;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    let rafId = 0;
    const tick = () => {
      dots.forEach((d) => {
        const r = d.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = cx - mx;
        const dy = cy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const force = (1 - dist / maxDist) * strength;
          const angle = Math.atan2(dy, dx);
          d.style.transform = `translate(${Math.cos(angle) * force}px, ${Math.sin(angle) * force}px)`;
          d.style.background = accent;
          d.style.borderColor = accent;
        } else {
          d.style.transform = "translate(0,0)";
          d.style.background = "";
          d.style.borderColor = "";
        }
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      dots.forEach((d) => d.remove());
    };
  }, [cols, rows, tile, gap, maxDist, strength, accent]);

  return (
    <>
      <div ref={gridRef} className="magnetic-grid grid mx-auto" />
      <style>{`
        .magnetic-grid { will-change: contents; }
        .magnetic-dot {
          border-radius: 10px;
          background: rgba(26,26,31,0.06);
          border: 1px solid rgba(26,26,31,0.10);
          transition: transform 0.45s cubic-bezier(0.16,1,0.3,1), background 0.3s, border-color 0.3s;
          will-change: transform;
        }
      `}</style>
    </>
  );
}
