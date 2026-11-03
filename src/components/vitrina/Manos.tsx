"use client";

import { useEffect, useRef } from "react";
import { MarkSvg } from "@/components/ak/Brand";
import type { Manos as Geometria } from "./manos-geometria";
import type { Contexto } from "./manos-escena";

// The hands are built once per density and kept, so coming back to the home
// doesn't build them again.
const pedidos = new Map<boolean, Promise<Geometria>>();

/** Builds the hands in a worker; without one, on this thread, as a last resort. */
function pedir(small: boolean): Promise<Geometria> {
  let p = pedidos.get(small);
  if (p) return p;
  p = new Promise<Geometria>((resolve, reject) => {
    const aqui = () => import("./manos-geometria").then(({ construirManos }) => resolve(construirManos(small)), reject);
    let w: Worker;
    try {
      w = new Worker(new URL("./manos-obra.ts", import.meta.url), { type: "module" });
    } catch {
      aqui();
      return;
    }
    // A worker that never answers is the same as no worker.
    const mudo = window.setTimeout(() => {
      w.terminate();
      aqui();
    }, 4000);
    w.onmessage = (e: MessageEvent<Geometria | "listo">) => {
      window.clearTimeout(mudo);
      if (e.data === "listo") return w.postMessage({ small });
      w.terminate();
      resolve(e.data);
    };
    w.onerror = () => {
      window.clearTimeout(mudo);
      w.terminate();
      aqui();
    };
  });
  pedidos.set(small, p);
  p.catch(() => pedidos.delete(small));
  return p;
}

/**
 * A WebGL2 context with the attributes the renderer asks for, or null when
 * the browser has none: asked for first, so a browser without WebGL never
 * downloads three.js or builds the hands.
 */
function contexto(): Contexto | null {
  const canvas = document.createElement("canvas");
  try {
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      depth: true,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    });
    return gl ? { canvas, gl } : null;
  } catch {
    return null;
  }
}

// Two hands reach across the hero (manos-escena.ts). Once the page is idle,
// the hands are built in a worker while three.js loads, so neither competes
// with the first paint or the first tap. Without WebGL (or JavaScript) the
// strip keeps its place and the mark closes in it alone.
export default function Manos() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let disposed = false;
    let cleanup: (() => void) | null = null;
    let ctx: Contexto | null = null;
    const sin = () => {
      if (!disposed) el.dataset.sinWebgl = "";
    };
    // A context that never reaches the scene is freed now, not at garbage collection.
    const soltar = () => {
      ctx?.gl.getExtension("WEBGL_lose_context")?.loseContext();
      ctx = null;
    };
    const start = () => {
      ctx = contexto();
      if (!ctx) return sin();
      const manos = pedir(el.clientWidth < 760);
      import("./manos-escena").then(
        ({ montar }) => {
          if (disposed || !ctx) return;
          cleanup = montar(el, manos, ctx);
          ctx = null;
          if (!cleanup) sin();
        },
        () => {
          soltar();
          sin();
        },
      );
    };
    const idle = "requestIdleCallback" in window;
    const handle = idle ? window.requestIdleCallback(start, { timeout: 1200 }) : window.setTimeout(start, 200);
    return () => {
      disposed = true;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      cleanup?.();
      soltar();
    };
  }, []);

  // Its own data-stagger keeps the mark out of the hero's count, so the lines around it enter on time.
  return (
    <div ref={box} className="manos" data-stagger>
      <span className="manos-marca" data-reveal="close">
        <MarkSvg />
      </span>
    </div>
  );
}
