"use client";

import { useEffect, useRef } from "react";

// Two hands reach across the hero (manos-escena.ts). three.js and the scene
// load once the page is idle, only here, so building the hands never
// competes with the first paint or the first tap; without WebGL the strip
// hides itself.
export default function Manos() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let disposed = false;
    let cleanup: (() => void) | null = null;
    const start = () => {
      import("./manos-escena").then(({ montar }) => {
        if (disposed) return;
        cleanup = montar(el);
        if (!cleanup) el.dataset.sinWebgl = "";
      });
    };
    const idle = "requestIdleCallback" in window;
    const handle = idle ? window.requestIdleCallback(start, { timeout: 1200 }) : window.setTimeout(start, 200);
    return () => {
      disposed = true;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      cleanup?.();
    };
  }, []);

  return <div ref={box} className="manos" />;
}
