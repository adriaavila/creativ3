"use client";

import { useEffect, useRef } from "react";

// Two hands reach across the hero (manos-escena.ts). three.js and the scene
// load after the page, only here; without WebGL the strip hides itself.
export default function Manos() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let disposed = false;
    let cleanup: (() => void) | null = null;
    import("./manos-escena").then(({ montar }) => {
      if (disposed) return;
      cleanup = montar(el);
      if (!cleanup) el.dataset.sinWebgl = "";
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={box} className="manos" />;
}
