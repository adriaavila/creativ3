"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { apagar, crearPunto, escucharToques, montarTrazo } from "./manos-trazo";
import type { Manos as Geometria } from "./manos-geometria";
import type { AvisosEscena, Contexto, Escena } from "./manos-escena";

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

/**
 * The extensions three.js turns on as its renderer starts (WebGLExtensions,
 * WebGLCapabilities and the first compile, three 0.186). The first request for
 * each waits on the GPU, 5 to 18 ms on a 4x slower phone and 30 to 45 ms in
 * all: asked for in a task of their own while three.js loads, the renderer
 * finds them on. A stale list only gives that time back.
 */
const EXTENSIONES = [
  "EXT_color_buffer_float",
  "WEBGL_clip_cull_distance",
  "OES_texture_float_linear",
  "EXT_color_buffer_half_float",
  "WEBGL_multisampled_render_to_texture",
  "WEBGL_render_shared_exponent",
  "EXT_texture_filter_anisotropic",
  "KHR_parallel_shader_compile",
];

type Estado = "espera" | "entrando" | "respondiendo" | "cerrado";

/** How long the hands wait, on screen, before the loop closes on its own. */
const ESPERA = 2400;

/**
 * «Te toca»: the hero's two hands, as one button. The pencil sketch is there
 * from the first paint (35 % while WebGL loads, whole without it); once the
 * page is idle the hands are built in a worker while three.js loads, draw
 * themselves in and wait apart. A tap, or 2.4 s on screen, closes the loop
 * between the fingertips. A tap before the scene arrives is answered by the
 * sketch, and the scene then mounts closed.
 *
 * The sketch (ManosTrazo, about 12 KB of SVG) comes as `children` from the
 * server: it is already in the HTML, so it never travels again as JavaScript.
 */
export default function Manos({ children }: { children: ReactNode }) {
  const caja = useRef<HTMLButtonElement>(null);
  const pista = useId();

  useEffect(() => {
    const el = caja.current;
    const puntoEl = el?.querySelector<HTMLElement>(".manos-punto");
    if (!el || !puntoEl) return;
    const inicio = el.closest<HTMLElement>("section#inicio");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const punto = crearPunto(puntoEl);
    const limpiar: (() => void)[] = [];
    let disposed = false;

    let estado: Estado = "espera";
    let encender: (() => void) | null = null;
    const poner = (e: Estado) => {
      estado = e;
      el.dataset.estado = e;
      // Closed, the strip is a picture: nothing left to press.
      if (e === "cerrado" && !encender) encender = apagar(el);
    };

    // The loop closes once: #inicio says so for CSS (the reply line, the status dot) and the event for anyone listening.
    let cerrado = false;
    const avisar = () => el.dispatchEvent(new CustomEvent("manos:cerrado", { bubbles: true }));
    const cerrar = () => {
      if (cerrado) return;
      cerrado = true;
      inicio?.setAttribute("data-cerrado", "");
      avisar();
    };

    // Who answers: the sketch until the scene has drawn its entrance, the
    // scene from then on, the sketch again if the context is lost.
    let capa: "trazo" | "gl" = "trazo";
    let gl: Escena | null = null;
    let glDibujado = false;
    let trazoMoviendo = false;
    const ponerCapa = (c: "trazo" | "gl") => {
      capa = c;
      el.dataset.capa = c;
      if (c === "trazo") delete el.dataset.trazando;
    };
    // The scene takes the stage once it has drawn and the sketch is still.
    const mostrarGl = () => {
      if (gl && glDibujado && !trazoMoviendo && !el.hasAttribute("data-perdido")) {
        delete el.dataset.sinWebgl;
        ponerCapa("gl");
      }
    };

    const trazo = montarTrazo(el, punto, {
      alResponder: () => {
        trazoMoviendo = true;
        poner("respondiendo");
      },
      alCerrar: cerrar,
      alTerminar: () => {
        trazoMoviendo = false;
        poner("cerrado");
        gl?.fijar("cerrado");
        mostrarGl();
      },
    });

    // Nobody tapped: 2.4 s of the strip at least 60 % on screen, with the tab
    // open and no sheet over it, close the loop on its own.
    let reloj = 0;
    let llevado = 0;
    let desde = 0;
    let armado = false;
    let aLaVista = false;
    const parar = () => {
      if (!reloj) return;
      window.clearTimeout(reloj);
      reloj = 0;
      llevado += performance.now() - desde;
    };
    const contar = () => {
      if (!armado || cerrado || estado !== "espera") return parar();
      if (document.hidden || !aLaVista) return parar();
      if (reloj) return;
      desde = performance.now();
      reloj = window.setTimeout(
        () => {
          reloj = 0;
          llevado = ESPERA;
          // A sheet open over the hero: wait under it.
          if (document.querySelector('[aria-modal="true"]')) {
            llevado = ESPERA - 300;
            return contar();
          }
          cerrarSolo();
        },
        Math.max(0, ESPERA - llevado),
      );
    };
    const armar = () => {
      armado = true;
      contar();
    };
    const vista = new IntersectionObserver(
      ([e]) => {
        aLaVista = !!e && e.isIntersecting && e.intersectionRatio >= 0.6;
        contar();
      },
      { threshold: [0, 0.6, 1] },
    );
    vista.observe(el);
    document.addEventListener("visibilitychange", contar);
    limpiar.push(() => {
      parar();
      vista.disconnect();
      document.removeEventListener("visibilitychange", contar);
    });

    const tocar = (x: number, y: number) => {
      if (cerrado || estado === "respondiendo" || estado === "cerrado") return;
      parar();
      if (capa === "gl" && gl) return gl.tocar(x, y);
      ponerCapa("trazo");
      trazo.tocar(x, y);
      gl?.fijar("cerrado");
    };
    function cerrarSolo() {
      if (cerrado || estado === "respondiendo" || estado === "cerrado") return;
      parar();
      if (capa === "gl" && gl) return gl.cerrarSolo();
      ponerCapa("trazo");
      trazo.cerrarSolo();
      gl?.fijar("cerrado");
    }
    limpiar.push(escucharToques(el, tocar));
    // The WhatsApp bar was pressed while the hands wait: close them in the background, never in the link's way.
    const alBarra = () => cerrarSolo();
    document.addEventListener("manos:cerrar", alBarra);
    limpiar.push(() => document.removeEventListener("manos:cerrar", alBarra));

    // Without WebGL, or with it lost, the sketch rises (700 ms) and answers alone.
    const sinWebgl = (subir = true) => {
      if (disposed) return;
      el.dataset.sinWebgl = "";
      ponerCapa("trazo");
      if (estado === "entrando") poner("espera");
      if (estado === "espera") window.setTimeout(armar, subir ? 700 : 0);
    };

    const avisos: AvisosEscena = {
      alEntrar: () => {
        if (estado !== "espera" || trazoMoviendo || cerrado) return;
        // The canvas shows from the entrance's first frame; the sketch stays under it until the hands are drawn.
        el.dataset.trazando = "";
        ponerCapa("gl");
        poner("entrando");
      },
      alTrazar: () => {
        delete el.dataset.trazando;
        glDibujado = true;
        mostrarGl();
      },
      alEsperar: () => {
        poner("espera");
        armar();
      },
      alResponder: () => poner("respondiendo"),
      alCerrar: cerrar,
      alTerminar: () => {
        poner("cerrado");
        trazo.fijar("cerrado");
      },
      alPerder: () => {
        el.dataset.perdido = "";
        const e = gl?.estado();
        sinWebgl();
        // Mid-answer the sketch has no way to pick up the motion: it shows the end.
        if (e === "respondiendo" || e === "cerrado" || cerrado) {
          punto.ocultar();
          trazo.fijar("cerrado");
          cerrar();
          poner("cerrado");
        } else trazo.fijar("abierto");
      },
      alRecuperar: () => {
        delete el.dataset.perdido;
        gl?.fijar(cerrado ? "cerrado" : "espera");
        mostrarGl();
      },
      alFallar: () => {
        gl?.destruir();
        gl = null;
        sinWebgl();
      },
    };

    // Reduced motion: the closed frame at once, still. The event waits a
    // tick, so the islands mounting after this one hear it too.
    if (reduce) {
      trazo.fijar("cerrado");
      poner("cerrado");
      cerrado = true;
      inicio?.setAttribute("data-cerrado", "");
      const t = window.setTimeout(avisar, 0);
      limpiar.push(() => window.clearTimeout(t));
    }

    // The tier script (Shell) says whether this device gets WebGL at all.
    if (!document.documentElement.classList.contains("lienzo-3d")) {
      sinWebgl(false);
    } else {
      let ctx: Contexto | null = null;
      // A context that never reaches the scene is freed now, not at garbage collection.
      const soltar = () => {
        ctx?.gl.getExtension("WEBGL_lose_context")?.loseContext();
        ctx = null;
      };
      // A finger on the screen (a scroll, a tap on its way) never shares its frames with three.js arriving.
      const dedos = new Set<number>();
      let tras = false;
      const abajo = (e: PointerEvent) => dedos.add(e.pointerId);
      const arriba = (e: PointerEvent) => {
        dedos.delete(e.pointerId);
        if (!dedos.size && tras) {
          tras = false;
          empezar();
        }
      };
      const empezar = () => {
        if (disposed || gl || ctx) return;
        if (dedos.size) {
          tras = true;
          return;
        }
        ctx = contexto();
        if (!ctx) return sinWebgl();
        const manos = pedir(el.clientWidth < 760);
        // three.js arrives in four parts, each run in its own task (manos-tres-nucleo.ts says why), with the
        // extensions in a task of their own; the renderer starts in the task after the last part.
        const tarea = () => new Promise<void>((r) => window.setTimeout(r, 0));
        import("./manos-tres-mates")
          .then(tarea)
          .then(() => {
            for (const nombre of EXTENSIONES) ctx?.gl.getExtension(nombre);
          })
          .then(tarea)
          .then(() => import("./manos-tres-nucleo"))
          .then(tarea)
          .then(() => import("./manos-tres-sombras"))
          .then(tarea)
          .then(() => import("./manos-escena"))
          .then(
            ({ montar }) =>
              window.setTimeout(() => {
                if (disposed || !ctx) return;
                gl = montar(el, manos, ctx, { cerrado: cerrado || trazoMoviendo, punto, avisos });
                ctx = null;
                if (!gl) sinWebgl();
              }, 0),
            () => {
              soltar();
              sinWebgl();
            },
          );
      };
      // Only once the strip is on screen: a visit that starts further down never pays for three.js.
      const enPantalla = new IntersectionObserver(([e]) => {
        if (!e?.isIntersecting) return;
        enPantalla.disconnect();
        empezar();
      });
      // After the load event, when the page is idle (2 s at most).
      let idle = 0;
      const arrancar = () => {
        const ir = () => {
          const r = el.getBoundingClientRect();
          if (r.bottom > 0 && r.top < window.innerHeight) empezar();
          else enPantalla.observe(el);
        };
        idle = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(ir, { timeout: 2000 }) : window.setTimeout(ir, 200);
      };
      if (document.readyState === "complete") arrancar();
      else window.addEventListener("load", arrancar, { once: true });
      document.addEventListener("pointerdown", abajo, true);
      document.addEventListener("pointerup", arriba, true);
      document.addEventListener("pointercancel", arriba, true);
      limpiar.push(() => {
        window.removeEventListener("load", arrancar);
        if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
        window.clearTimeout(idle);
        enPantalla.disconnect();
        document.removeEventListener("pointerdown", abajo, true);
        document.removeEventListener("pointerup", arriba, true);
        document.removeEventListener("pointercancel", arriba, true);
        gl?.destruir();
        gl = null;
        soltar();
      });
    }

    return () => {
      disposed = true;
      limpiar.forEach((f) => f());
      trazo.destruir();
      // Back to the server's markup, for a remount (Strict Mode, or coming back to the page).
      encender?.();
      el.dataset.estado = "espera";
      for (const k of ["capa", "sinWebgl", "perdido"]) delete el.dataset[k];
      trazo.fijar("abierto");
    };
  }, []);

  return (
    <button ref={caja} type="button" className="manos" data-estado="espera" aria-labelledby={pista}>
      {children}
      <span className="manos-pista" id={pista}>
        Toca las manos
      </span>
      <span className="manos-punto" aria-hidden="true" />
    </button>
  );
}
