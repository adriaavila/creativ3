#!/usr/bin/env node
/**
 * «Te toca»: la prueba de aceptación de la portada (la lista ACCEPTANCE de te-toca-spec.txt, con los selectores
 * del contrato de la obra). Mide la página como la ve un visitante: Playwright, el Chromium del entorno, WebGL por
 * SwiftShader y nada que salga de localhost.
 *
 * Contra la app real, con el servidor de PRODUCCIÓN (las cifras de [lcp] contra `next dev` no valen nada). Este
 * repo tiene `output: "standalone"` y ahí `next start` (pnpm start) se niega y sale; se usa el server.js que deja
 * el build, con public y .next/static copiados a su lado (docs de Next: next-config-js/output.md):
 *
 *   pnpm build
 *   cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
 *   PORT=3124 HOSTNAME=0.0.0.0 node .next/standalone/server.js
 *   BASE_URL=http://localhost:3124 node scripts/e2e-te-toca.mjs --out /tmp/te-toca.json
 *
 * (Nada de `pnpm build` con un `next dev` levantado: comparten .next.)
 *
 * Opciones:
 *   --solo palabras,pulgar   corre solo esas pruebas (--lista las nombra)
 *   --out informe.json       guarda el informe entero, con lo medido en cada línea
 * Sale con 1 si alguna línea da FAIL.
 *
 * Cada prueba abre su propio contexto y una prueba que falla o revienta nunca detiene a las demás. Todo pedido
 * fuera de localhost se aborta y se anota. Las pruebas de comportamiento van a DPR 1 (el comportamiento no
 * depende del DPR y SwiftShader a DPR 2 alarga los tiempos); las de velocidad y bytes, a DPR 2, como un Android
 * de gama media. Las frases de WhatsApp se leen de src/lib/contact.ts al correr, no se copian aquí.
 *
 * Cómo se lee la spec donde podía leerse de dos maneras:
 *   · «after load» / «of load» (los clics en la barra, el cierre solo, el segundo 2 a 3 de la espera) cuentan desde
 *     el evento load; cada línea dice también la hora desde la navegación.
 *   · Tareas largas: el tiempo dentro de getContext("webgl*") se descuenta y la línea dice cuánto fue. Crear el
 *     contexto en SwiftShader (la GPU de software de este entorno) tarda 100-500 ms que un teléfono no tarda; compilar
 *     shaders, parsear three.js y todo lo demás sí cuenta.
 *   · Con una ficha abierta, además de la página se mide la hoja: una ficha fija nunca ensancha la página.
 * El navegador: PW_CHROMIUM (por defecto /opt/pw-browsers/chromium).
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { setTimeout as dormir } from "node:timers/promises";

const BASE = (process.env.BASE_URL || "http://localhost:3124").replace(/\/+$/, "");
const HOME = `${BASE}/`;
const NAVEGADOR = process.env.PW_CHROMIUM || "/opt/pw-browsers/chromium";
const LOCALES = new Set(["localhost", "127.0.0.1", "[::1]", "::1", new URL(BASE).hostname]);

// ── Opciones ──
const argv = process.argv.slice(2);
const valor = (flag) => {
  const i = argv.findIndex((a) => a === flag || a.startsWith(`${flag}=`));
  if (i < 0) return undefined;
  return argv[i].includes("=") ? argv[i].slice(argv[i].indexOf("=") + 1) : argv[i + 1];
};
const SALIDA = valor("--out");
const SOLO = valor("--solo")
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ── Las frases, de la fuente: si contact.ts cambia, la prueba cambia con él ──
const CONTACTO = readFileSync(new URL("../src/lib/contact.ts", import.meta.url), "utf8");
const literal = (s) => {
  try {
    return JSON.parse(`"${s}"`);
  } catch {
    return s;
  }
};
const cadena = (re) => {
  const m = re.exec(CONTACTO);
  return m ? literal(m[1]) : null;
};
const MSG_INICIO = cadena(/HOME_WHATSAPP_MESSAGE\s*=\s*"((?:[^"\\]|\\.)*)"/);
const MSG_AGENTE = cadena(/origen\s*===\s*"agente"\)\s*return\s*"((?:[^"\\]|\\.)*)"/);
const PLANTILLA_PIEZA = /`(Hola[^`]*?)\$\{pieza\.nombre\}([^`]*)`/.exec(CONTACTO);
const msgPieza = (nombre) => (PLANTILLA_PIEZA ? `${PLANTILLA_PIEZA[1]}${nombre}${PLANTILLA_PIEZA[2]}` : `Hola, Adrián. Vi ${nombre} en allok.fun`);
// Lo que la spec pide literalmente para SAMER.
const SAMER_PREFIJO = "Hola, Adrián. Vi SAMER en allok.fun";
if (!MSG_INICIO) {
  console.error("FAIL: no encuentro HOME_WHATSAPP_MESSAGE en src/lib/contact.ts");
  process.exit(1);
}

// Los cuatro trabajos de la portada (historias.ts) y lo que dicen sus etiquetas.
const OBRAS = [
  { id: "samer", nombre: "SAMER", tag: "Cliente" },
  { id: "rei-fm", nombre: "REI", tag: "Mío" },
  { id: "cuadra", nombre: "Cuadra", tag: "Mío" },
  { id: "mistica", nombre: "Mística", tag: "Cliente" },
];
const selObra = (o) => `article.obra[data-pieza="${o.nombre}"], article.obra#${o.id}`;

const VISTAS = {
  390: { etiqueta: "390x844", viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  360: { etiqueta: "360x700", viewport: { width: 360, height: 700 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  1440: { etiqueta: "1440x900", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  "390x2": { etiqueta: "390x844@2x", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

// La spec: Slow 4G = 1.6 Mbps de bajada, 750 kbps de subida, 150 ms; Fast 4G = el preset de DevTools (9 Mbps, 1.5 Mbps, 60 ms).
const PERFILES = {
  lenta: { nombre: "Slow 4G + CPU 4x", rtt: 150, bajada: 1.6e6 / 8, subida: 750e3 / 8, cpu: 4 },
  rapida: { nombre: "Fast 4G + CPU 4x", rtt: 60, bajada: 9e6 / 8, subida: 1.5e6 / 8, cpu: 4 },
};
const KB = 1024;
// Un clic en la barra abre wa.me en el acto: un popup tarda unas decenas de ms; más de esto es una espera puesta a propósito.
const DEMORA_MAX = 400;

// ── Navegadores: uno con WebGL (SwiftShader) y otro sin WebGL ──
const navegadores = {};
async function navegador(tipo) {
  if (navegadores[tipo]?.isConnected()) return navegadores[tipo];
  const args = tipo === "gl" ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : ["--disable-webgl", "--disable-webgl2"];
  navegadores[tipo] = await chromium.launch({ executablePath: NAVEGADOR, args });
  return navegadores[tipo];
}

/**
 * Corre en cada documento antes que la página: cuenta cuadros (rAF) y dibujos de WebGL con su hora, anota cuándo
 * cambian los atributos del contrato, guarda LCP, pintados, tareas largas y layout shifts, y la hora del load y del
 * primer momento ocioso. Con `sinWebgl`, ningún lienzo da un contexto WebGL.
 */
function INSTRUMENTO(op) {
  if (window.__e2e) return;
  const ahora = () => performance.now();
  const nodo = (el) => {
    if (!el || el.nodeType !== 1) return el ? el.nodeName : "null";
    let s = el.localName;
    if (el.id) s += `#${el.id}`;
    const c = (el.getAttribute("class") || "").trim();
    if (c) s += `.${c.split(/\s+/).slice(0, 3).join(".")}`;
    return s;
  };
  const e2e = { raf: [], dib: [], attrs: [], cambios: [], lcp: [], pintadas: [], largas: [], loaf: [], ctx: [], clics: [], pilas: [], n: 0, carga: null, ocio: null, arriba: null, punto: null };
  window.__e2e = e2e;

  // Los cuadros que pide la página; los de esta prueba usan raf0 y no cuentan.
  const raf0 = window.requestAnimationFrame;
  e2e.raf0 = raf0;
  window.requestAnimationFrame = function requestAnimationFrame(cb) {
    const t = ahora();
    e2e.raf.push(t);
    if (op.pilas) e2e.pilas[e2e.n++ % 160] = { t, de: String(new Error().stack || "").split("\n").slice(2, 5).map((s) => s.trim()).join(" < ") };
    return raf0.call(window, cb);
  };
  const envolver = (proto, nombres) => {
    if (!proto) return;
    for (const k of nombres) {
      const f = proto[k];
      if (typeof f !== "function") continue;
      proto[k] = function (...a) {
        e2e.dib.push(ahora());
        return f.apply(this, a);
      };
    }
  };
  const DIBUJOS = ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced", "drawRangeElements"];
  envolver(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype, DIBUJOS);
  envolver(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype, DIBUJOS);
  // Las extensiones que dibujan (multi_draw, instancing de WebGL 1) también cuentan.
  for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
    const g = C && C.prototype.getExtension;
    if (!g) continue;
    C.prototype.getExtension = function (nombre) {
      const x = g.call(this, nombre);
      if (x && !x.__e2e && /multi_draw|instanced_arrays/i.test(String(nombre))) {
        x.__e2e = 1;
        for (const k of Object.keys(Object.getPrototypeOf(x)).concat(Object.keys(x))) {
          if (!/^(multiDraw|draw)/.test(k) || typeof x[k] !== "function") continue;
          const f = x[k];
          x[k] = function (...a) {
            e2e.dib.push(ahora());
            return f.apply(this, a);
          };
        }
      }
      return x;
    };
  }
  // Cada contexto WebGL pedido, con lo que tardó: en SwiftShader crearlo cuesta lo que no cuesta en un teléfono.
  // Con `sinWebgl`, ningún lienzo da un contexto WebGL.
  for (const C of [window.HTMLCanvasElement, window.OffscreenCanvas]) {
    const g = C && C.prototype.getContext;
    if (!g) continue;
    C.prototype.getContext = function (tipo, ...resto) {
      if (!/webgl/i.test(String(tipo))) return g.call(this, tipo, ...resto);
      if (op.sinWebgl) return null;
      const t = ahora();
      const r = g.call(this, tipo, ...resto);
      e2e.ctx.push({ t, d: ahora() - t, tipo: String(tipo), ok: !!r });
      return r;
    };
  }

  const observar = (type, f) => {
    try {
      new PerformanceObserver((l) => l.getEntries().forEach(f)).observe({ type, buffered: true });
    } catch {
      // un tipo que este navegador no conoce
    }
  };
  observar("layout-shift", (e) => e2e.cambios.push({ t: e.startTime, v: e.value, input: e.hadRecentInput, de: (e.sources || []).map((s) => nodo(s.node)).slice(0, 3) }));
  observar("largest-contentful-paint", (e) => {
    const el = e.element;
    e2e.lcp.push({ t: e.renderTime || e.startTime, size: e.size, enH1: !!(el && el.closest && el.closest("#inicio h1")), el: nodo(el), texto: el ? String(el.textContent || "").trim().slice(0, 40) : "", url: e.url || "" });
  });
  observar("paint", (e) => e2e.pintadas.push({ n: e.name, t: e.startTime }));
  observar("longtask", (e) => e2e.largas.push({ t: e.startTime, d: e.duration }));
  // Quién hizo la tarea larga: el cuadro largo (LoAF) que la contiene dice qué script corría.
  observar("long-animation-frame", (e) =>
    e2e.loaf.push({
      t: e.startTime,
      d: e.duration,
      de: [...(e.scripts || [])]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 2)
        .map((x) => `${Math.round(x.duration)} ms ${x.invoker || x.invokerType || "?"}${x.sourceFunctionName ? ` ${x.sourceFunctionName}` : ""}${x.sourceURL ? ` (${String(x.sourceURL).replace(location.origin, "")}${x.sourceCharPosition >= 0 ? `:${x.sourceCharPosition}` : ""})` : ""}`),
    }),
  );

  const ATRIBUTOS = ["data-estado", "data-cerrado", "data-sin-webgl", "data-capa", "data-lazo", "data-visible", "data-sobre-azul", "data-oculta", "aria-modal"];
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === "attributes") e2e.attrs.push({ t: ahora(), a: m.attributeName, v: m.target.getAttribute(m.attributeName), el: nodo(m.target) });
    }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ATRIBUTOS });

  addEventListener(
    "load",
    () => {
      e2e.carga = ahora();
      const ric = window.requestIdleCallback;
      if (ric) ric.call(window, () => (e2e.ocio = ahora()), { timeout: 2000 });
      else setTimeout(() => (e2e.ocio = ahora()), 0);
    },
    { once: true },
  );
  document.addEventListener("click", (e) => e2e.clics.push({ t: ahora(), epoch: performance.timeOrigin + ahora(), el: nodo(e.target) }), true);
  document.addEventListener("pointerup", (e) => (e2e.arriba = { t: ahora(), x: e.clientX, y: e.clientY, tipo: e.pointerType }), true);

  // El punto del visitante: desde que baja el dedo en la tira, cada cuadro mira si .manos-punto ya se ve.
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!(e.target instanceof Element) || !e.target.closest(".manos") || e2e.punto) return;
      const fin = ahora() + 1000;
      const mirar = () => {
        const p = document.querySelector(".manos-punto");
        const r = p && p.getBoundingClientRect();
        const ve = !!p && r.width > 0.5 && r.height > 0.5 && (!p.checkVisibility || p.checkVisibility({ opacityProperty: true, visibilityProperty: true, checkOpacity: true, checkVisibilityCSS: true })) && Number(getComputedStyle(p).opacity) > 0.5;
        if (ve) return (e2e.punto = { t: ahora() });
        if (ahora() < fin) raf0.call(window, mirar);
      };
      raf0.call(window, mirar);
    },
    true,
  );
}

/**
 * Lo que se mide dentro de la página. Va como texto en cada evaluate (también con JavaScript apagado, donde
 * Playwright evalúa en su propio mundo).
 */
function LIB() {
  const OPC = { opacityProperty: true, visibilityProperty: true, checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true };
  const desc = (el) => {
    if (!el) return "null";
    if (el.nodeType !== 1) return el.nodeName;
    let s = el.localName;
    if (el.id) s += `#${el.id}`;
    const c = (el.getAttribute("class") || "").trim();
    if (c) s += `.${c.split(/\s+/).slice(0, 3).join(".")}`;
    return s;
  };
  const pinta = (el) => {
    if (typeof el.checkVisibility === "function") return el.checkVisibility(OPC);
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || Number(cs.opacity) === 0 || (e === el && cs.visibility !== "visible")) return false;
    }
    return true;
  };
  /** Se pinta y tiene caja: lo que el ojo puede ver, esté o no en la pantalla ahora. */
  const visible = (el) => {
    if (!el || !el.isConnected || !pinta(el)) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 0.5 && r.height >= 0.5;
  };
  const caja = (el) => el.getBoundingClientRect();
  const enVista = (el) => {
    const r = caja(el);
    return r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
  };
  const entero = (el) => {
    const r = caja(el);
    return r.left >= -0.5 && r.top >= -0.5 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5;
  };
  const libre = (el) => {
    const r = caja(el);
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { libre: !!hit && (hit === el || el.contains(hit)), hit: hit ? desc(hit) : null };
  };
  const texto = (el) => (el ? String(el.innerText || el.textContent || "").replace(/\s+/g, " ").trim() : "");
  const tokens = (s) => String(s || "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));

  // ── El texto que se ve: cada nodo de texto cuyo padre se pinta, cuyas cajas tienen tamaño, que está dentro de la
  // página y que ningún antepasado con overflow recorta del todo. Se une como innerText: sin espacio dentro de un
  // mismo bloque, con salto entre bloques. ──
  const NO_PINTA = new Set(["script", "style", "noscript", "template", "title", "desc", "head", "meta", "link"]);
  const rango = document.createRange();
  const recortes = new Map();
  const clips = (el) => {
    if (recortes.has(el)) return recortes.get(el);
    const out = [];
    for (let a = el; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible") out.push(a.getBoundingClientRect());
      if (/inset\(\s*50%/.test(cs.clipPath || "")) out.push({ left: 0, right: 0, top: 0, bottom: 0 });
      if (/rect\(\s*0(px)?[\s,]+0(px)?[\s,]+0(px)?[\s,]+0(px)?\s*\)/.test(cs.clip || "")) out.push({ left: 0, right: 0, top: 0, bottom: 0 });
      if (cs.position === "fixed") break;
    }
    recortes.set(el, out);
    return out;
  };
  const seVe = (n, el) => {
    if (!pinta(el)) return false;
    rango.selectNodeContents(n);
    const rs = [...rango.getClientRects()].filter((r) => r.width >= 1 && r.height >= 1);
    if (!rs.length) return false;
    // Fuera de la página: el enlace de saltar espera por encima del borde.
    if (rs.every((r) => r.bottom + scrollY <= 0 || r.right + scrollX <= 0)) return false;
    for (const c of clips(el)) {
      const queda = rs.some((r) => Math.min(r.right, c.right) - Math.max(r.left, c.left) >= 2 && Math.min(r.bottom, c.bottom) - Math.max(r.top, c.top) >= 2);
      if (!queda) return false;
    }
    return true;
  };
  const bloqueDe = (el, raiz) => {
    for (let e = el; e && e !== raiz; e = e.parentElement) {
      const d = getComputedStyle(e).display;
      if (d === "contents" || d.startsWith("inline") || d.startsWith("ruby")) continue;
      return e;
    }
    return raiz;
  };
  const leer = (raiz, regiones) => {
    const out = new Map();
    const sumar = (k, s, bloque) => {
      let b = out.get(k);
      if (!b) out.set(k, (b = { s: "", bloque: null }));
      if (bloque && b.bloque && b.bloque !== bloque) b.s += "\n";
      b.s += s;
      if (bloque) b.bloque = bloque;
    };
    const tw = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const el = n.parentElement;
      if (!el || NO_PINTA.has(el.localName) || el.closest(".saltar")) continue;
      const keys = regiones(el);
      if (!keys.length) continue;
      const blanco = !/\S/.test(n.data);
      const ve = blanco || seVe(n, el);
      const bloque = ve && !blanco ? bloqueDe(el, raiz) : null;
      for (const k of keys) sumar(k, ve ? n.data : " ", bloque);
    }
    const res = {};
    for (const [k, b] of out) res[k] = b.s;
    return res;
  };
  const textoVisible = (raiz = document.body) => (leer(raiz, () => ["t"]).t || "").replace(/[ \t]+/g, " ");

  // El lazo de un boceto (ManosTrazo): cerrado = el punto de la cubeta a la vista tiene caja y el arco se pinta.
  const puntoLazo = (sel) => {
    const raiz = document.querySelector(sel);
    if (!raiz) return { existe: false };
    let puntos = [...raiz.querySelectorAll(".trazo-punto")];
    if (!puntos.length) puntos = [...raiz.querySelectorAll(".manos-trazo circle")];
    const arcos = [...raiz.querySelectorAll(".trazo-arco")];
    const svg = raiz.querySelector(".manos-trazo");
    const lienzo = raiz.querySelector("canvas");
    return {
      existe: true,
      boceto: !!svg && visible(svg),
      opacidad: svg ? getComputedStyle(svg).opacity : null,
      puntos: puntos.length,
      puntoVisible: puntos.some(visible),
      arcoVisible: arcos.length ? arcos.some(visible) : null,
      lazo: svg ? svg.getAttribute("data-lazo") : null,
      cerrado: raiz.hasAttribute("data-cerrado"),
      estado: raiz.getAttribute("data-estado"),
      capa: raiz.getAttribute("data-capa"),
      canvas: !!lienzo && visible(lienzo),
    };
  };

  return {
    visible: (sel) => visible(document.querySelector(sel)),
    atributo: (sel, a) => !!document.querySelector(sel)?.hasAttribute(a),
    textoDe: (sel) => texto(document.querySelector(sel)),
    puntoLazo,

    palabras() {
      const lineas = [...document.querySelectorAll(".obra-linea")];
      const SECC = [
        ["header", "header"],
        ["#inicio", "#inicio"],
        ["#obras", "#obras"],
        ["#diecinueve", "#diecinueve"],
        ["#agente", "#agente"],
        ["#contacto", "#contacto"],
        [".barra", ".barra, .barra-wa"],
        ["footer", "footer"],
      ];
      const r = leer(document.body, (el) => {
        const k = ["total"];
        if (el.closest("#inicio")) k.push("hero");
        if (el.closest("#inicio h1, #inicio .sub")) k.push("h1sub");
        const s = SECC.find(([, q]) => el.closest(q));
        k.push(`sec:${s ? s[0] : "otro"}`);
        return k;
      });
      const secciones = {};
      for (const [k, s] of Object.entries(r)) if (k.startsWith("sec:")) secciones[k.slice(4)] = tokens(s).length;
      return {
        total: tokens(r.total).length,
        hero: tokens(r.hero).length,
        h1sub: tokens(r.h1sub).length,
        lineas: lineas.map((el) => ({ t: texto(el), n: tokens(el.textContent).length, visible: visible(el) })),
        secciones,
        texto: String(r.total || "").replace(/\s+/g, " ").trim(),
      };
    },

    pulgar() {
      const links = [...document.querySelectorAll('a[href^="https://wa.me/"]')];
      const info = links.map((a) => {
        const r = caja(a);
        const v = visible(a);
        const e = entero(a);
        const l = v && e ? libre(a) : { libre: false, hit: null };
        return { el: desc(a), v, entero: e, alto: +r.height.toFixed(1), top: +r.top.toFixed(1), libre: l.libre, tapa: l.libre ? null : l.hit };
      });
      const estricto = info.some((x) => x.v && x.entero && x.alto >= 44 && x.top >= 0.5 * innerHeight && x.libre);
      const simple = info.some((x) => x.v && x.entero && x.libre);
      const barra = info.find((x) => x.el.includes("barra-wa")) || info[0] || { el: 'ningún a[href^="https://wa.me/"]' };
      return { estricto, simple, barra, n: links.length, vh: innerHeight };
    },

    azul() {
      // Lo que el campo pinta de verdad: antes de revelarse (data-reveal="field") va recortado por un
      // clip-path inset(); ahí debajo hay Cloud, no azul, y la barra azul es la correcta.
      const pintado = (el) => {
        const r = caja(el);
        const m = /^inset\(([^)]*)\)$/.exec(getComputedStyle(el).clipPath || "");
        if (!m) return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        const v = m[1].split(/\s+round\s+/)[0].trim().split(/\s+/);
        const [t, d = t, b = t, i = d] = v;
        const px = (x, total) => (x.endsWith("%") ? (parseFloat(x) / 100) * total : parseFloat(x) || 0);
        return { left: r.left + px(i, r.width), right: r.right - px(d, r.width), top: r.top + px(t, r.height), bottom: r.bottom - px(b, r.height) };
      };
      const primarios = [...document.querySelectorAll(".btn-primary")].filter((el) => !el.matches(".saltar") && visible(el) && enVista(el)).map(desc);
      const bar = document.querySelector("a.barra-wa");
      const cu = document.querySelector("#cuadra");
      let solape = null;
      if (bar && cu && visible(bar)) {
        const a = caja(bar);
        const b = pintado(cu);
        solape = Math.min(Math.min(a.right, b.right) - Math.max(a.left, b.left), Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      }
      return { primarios, hayBarra: !!bar, hayCuadra: !!cu, sobre: !!bar && bar.hasAttribute("data-sobre-azul"), fondo: bar ? getComputedStyle(bar).backgroundColor : null, solape };
    },
    // Tres sitios para la barra: en medio del campo de Cuadra, 150 px antes y 150 px después.
    posCuadra() {
      const bar = document.querySelector("a.barra-wa");
      const cu = document.querySelector("#cuadra");
      if (!bar || !cu) return [];
      const b = caja(bar);
      const c = caja(cu);
      const centro = b.top + b.height / 2;
      const arriba = c.top + scrollY;
      const abajo = c.bottom + scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      return [(arriba + abajo) / 2 - centro, arriba - 150 - b.height / 2 - centro, abajo + 150 + b.height / 2 - centro].map((y) => Math.round(Math.min(max, Math.max(0, y))));
    },

    textoBarra() {
      const a = document.querySelector("a.barra-wa") || document.querySelector('a[href^="https://wa.me/"]');
      if (!a) return null;
      try {
        return new URL(a.href).searchParams.get("text");
      } catch {
        return null;
      }
    },
    centroDe(sels) {
      const el = sels.map((s) => document.querySelector(s)).find(Boolean);
      if (!el) return null;
      const r = caja(el);
      return Math.max(0, Math.round(r.top + scrollY + r.height / 2 - innerHeight / 2));
    },
    // Dónde tocar la tira: su centro, sin caer bajo la barra ni a menos de 24 px de los bordes.
    centroManos() {
      const m = document.querySelector(".manos");
      if (!m) return null;
      const r = caja(m);
      const bar = document.querySelector("a.barra-wa");
      const techo = bar && visible(bar) ? Math.min(innerHeight, caja(bar).top) - 8 : innerHeight - 8;
      const top = Math.max(0, r.top);
      const bottom = Math.min(r.bottom, techo);
      return { x: Math.round(Math.min(innerWidth - 30, Math.max(30, r.left + r.width / 2))), y: Math.round((top + bottom) / 2), alto: Math.round(bottom - top) };
    },

    // [reducido]: lo que se ve con «reducir movimiento» apenas carga.
    reducido() {
      const pista = document.querySelector(".manos-pista");
      const resp = document.querySelector("#inicio .respuesta");
      const malos = [];
      const todos = [...document.querySelectorAll("[data-reveal]")];
      for (const el of todos) {
        const cs = getComputedStyle(el);
        if (cs.opacity !== "1" || cs.transform !== "none") malos.push(`${desc(el)}[data-reveal=${el.getAttribute("data-reveal")}] opacity ${cs.opacity} transform ${cs.transform}`);
      }
      return {
        pista: { existe: !!pista, visible: !!pista && visible(pista) },
        respuesta: { existe: !!resp, visible: !!resp && visible(resp), opacidad: resp ? getComputedStyle(resp).opacity : null, texto: texto(resp) },
        reveals: { n: todos.length, malos },
        portada: puntoLazo(".manos"),
      };
    },

    sinJs() {
      const h1 = document.querySelector("#inicio h1");
      const sub = document.querySelector("#inicio .sub");
      const links = [...document.querySelectorAll('a[href^="https://wa.me/"]')];
      const barra = links.map((a) => ({ el: desc(a), v: visible(a), entero: entero(a), ...libre(a) }));
      const abrir = [...document.querySelectorAll("[data-abrir-pieza], .obra-captura")];
      const imgs = [...document.querySelectorAll("article.obra img")];
      const malas = [];
      for (const el of abrir) if (el.localName !== "a" || !el.getAttribute("href")) malas.push(`${desc(el)} sin href`);
      for (const img of imgs) if (!img.closest("a[href]")) malas.push(`${desc(img)} (${img.getAttribute("alt") || img.getAttribute("src")}) fuera de un enlace`);
      return {
        h1: { visible: !!h1 && visible(h1), texto: texto(h1) },
        sub: { visible: !!sub && visible(sub), texto: texto(sub) },
        boceto: puntoLazo(".manos"),
        barra: { ok: barra.some((b) => b.v && b.entero && b.libre), detalle: barra },
        capturas: { n: abrir.length, ids: [...new Set(abrir.map((el) => el.getAttribute("data-abrir-pieza")).filter(Boolean))], imgs: imgs.length, malas },
      };
    },

    // El ancho de la página, muestreado durante `ms`: el peor scrollWidth y quién se sale. Con `ficha`, también la
    // hoja: una ficha fija no ensancha la página, pero si su contenido es más ancho que ella se corta o se mueve de lado.
    async ancho(ms, cada, ficha = false) {
      const fin = performance.now() + ms;
      let peor = document.documentElement.scrollWidth;
      const hoja = new Map();
      for (;;) {
        peor = Math.max(peor, document.documentElement.scrollWidth);
        if (ficha) {
          for (const el of document.querySelectorAll('.ficha, .ficha > *, [aria-modal="true"], [aria-modal="true"] > *')) {
            const ox = getComputedStyle(el).overflowX;
            if (ox === "hidden" || ox === "clip" || !visible(el)) continue;
            if (el.scrollWidth > el.clientWidth + 1) hoja.set(desc(el), `${desc(el)} ${el.scrollWidth}>${el.clientWidth}`);
          }
        }
        if (performance.now() >= fin) break;
        await new Promise((ok) => setTimeout(ok, cada));
      }
      const culpables = [];
      if (peor > innerWidth) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.right + scrollX > innerWidth + 1 && visible(el) && !el.closest(".ficha")) culpables.push(`${desc(el)} ->${Math.round(r.right + scrollX)}`);
          if (culpables.length >= 4) break;
        }
      }
      return { peor, iw: innerWidth, culpables, hoja: [...hoja.values()].slice(0, 4) };
    },

    ficha() {
      const f = document.querySelector(".ficha");
      if (!f) return { existe: false };
      const wa = [...f.querySelectorAll('a[href^="https://wa.me/"]')].map((a) => {
        try {
          return new URL(a.href).searchParams.get("text");
        } catch {
          return null;
        }
      });
      return { existe: true, modal: f.getAttribute("aria-modal"), wa, hechoCon: /hecho\s+con/i.test(f.textContent || "") };
    },

    objetivos() {
      const sel = 'a[href], button, [role="button"], [role="link"], input[type="submit"], input[type="button"], summary';
      const malos = [];
      let n = 0;
      for (const el of document.querySelectorAll(sel)) {
        if (el.matches(".saltar") || el.closest("[inert]") || !visible(el)) continue;
        n++;
        const r = caja(el);
        if (r.width < 43.5 || r.height < 43.5) malos.push(`${desc(el)} «${(texto(el) || el.getAttribute("aria-label") || "").slice(0, 32)}» ${r.width.toFixed(1)}x${r.height.toFixed(1)}`);
      }
      return { n, malos };
    },

    honestidad(obras) {
      const out = { obras: [] };
      for (const o of obras) {
        const art = document.querySelector(`article.obra[data-pieza="${o.nombre}"]`) || document.getElementById(o.id);
        const tag = art && art.querySelector(".obra-tag");
        out.obras.push({ ...o, existe: !!art, tagVisto: tag && visible(tag) ? texto(tag) : null, nota: art ? /Datos de ejemplo/.test(textoVisible(art)) : false });
      }
      const us = [];
      const tw = document.createTreeWalker(document, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) if (n.data.includes("US$")) us.push(`${desc(n.parentElement)}: ${n.data.trim().slice(0, 60)}`);
      // En pantalla: el texto visible y lo que se lee dentro de los campos (placeholder y valor).
      let pantalla = textoVisible(document.body);
      for (const i of document.querySelectorAll("input, textarea")) if (visible(i)) pantalla += `\n${i.getAttribute("placeholder") || ""} ${i.value || ""}`;
      const trozos = (re) => pantalla.split("\n").filter((l) => re.test(l)).map((l) => l.trim().slice(0, 60));
      out.us = us;
      out.raya = trozos(/\u2014/);
      out.movil = trozos(/m[oó]vil/i);
      return out;
    },
  };
}
const LIB_SRC = `(${LIB.toString()})()`;
const lib = (page, nombre, ...args) => page.evaluate(`${LIB_SRC}[${JSON.stringify(nombre)}](...${JSON.stringify(args)})`);

// ── Utilidades ──
/** Repite `f` hasta que devuelva algo verdadero o se acabe el tiempo; devuelve lo último que dio. */
async function hasta(f, { ms = 5000, cada = 40 } = {}) {
  const fin = Date.now() + ms;
  let v;
  for (;;) {
    v = await f();
    if (v || Date.now() >= fin) return v;
    await dormir(cada);
  }
}
/** Espera hasta que la página llegue a `t` ms desde su navegación (setTimeout: no pide cuadros). */
const esperarHasta = (page, t) => page.waitForFunction((x) => performance.now() >= x, t, { polling: 25, timeout: Math.max(5000, t + 5000) });
/** Dos cuadros de la página con el rAF de verdad (no cuenta) y un tope por si no hay cuadros. */
const cuadros = (page, n = 2) =>
  page.evaluate(
    (k) =>
      new Promise((ok) => {
        const raf = (window.__e2e && window.__e2e.raf0) || window.requestAnimationFrame;
        let i = 0;
        const f = () => (++i >= k ? ok() : raf.call(window, f));
        raf.call(window, f);
        setTimeout(ok, 250);
      }),
    n,
  );
const ir = async (page, url = HOME, waitUntil = "load") => {
  const r = await page.goto(url, { waitUntil, timeout: 60000 });
  if (r && r.status() >= 400) throw new Error(`${url} respondió ${r.status()}`);
  return r;
};
const desplazar = async (page, y) => {
  await page.evaluate((yy) => window.scrollTo({ top: yy === "max" ? document.documentElement.scrollHeight : yy, behavior: "instant" }), y);
  await cuadros(page);
};
/** De arriba abajo en pasos de `paso` px (y el final exacto), llamando a `f(y)` en cada parada. */
async function muestrear(page, paso, f) {
  for (let y = 0, ultimo = false; !ultimo; y += paso) {
    const max = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
    if (y >= max) {
      y = max;
      ultimo = true;
    }
    await desplazar(page, y);
    await f(y);
  }
}
/** Recorre la página entera para que entren todos los reveals y las imágenes perezosas, y vuelve arriba. */
async function recorrer(page, fraccion = 0.8, volver = true) {
  const vh = await page.evaluate(() => innerHeight);
  await muestrear(page, Math.round(vh * fraccion), () => dormir(40));
  if (volver) await desplazar(page, 0);
}
/** Cuándo (ms desde la navegación) un elemento ganó un atributo; -1 si ya venía en el HTML; null si no lo tiene. */
const tiempoAtributo = (page, attr, sel) =>
  page.evaluate(
    ([a, s]) => {
      const el = document.querySelector(s);
      const log = ((window.__e2e && window.__e2e.attrs) || []).filter((x) => x.a === a && x.v !== null && el && (x.el.includes(s.replace(/^[a-z]+/, "")) || x.el === s));
      if (log.length) return log[0].t;
      return el && el.hasAttribute(a) ? -1 : null;
    },
    [attr, sel],
  );
const ms = (t) => (t === null || t === undefined ? "?" : `${Math.round(t)}`);
const corta = (s, n = 90) => (s === null || s === undefined ? String(s) : `«${String(s).length > n ? `${String(s).slice(0, n)}…` : s}»`);
/** Lo que pasó en la tira, en una línea: cuándo cargó, entró, esperó y cerró. */
async function historia(page) {
  return page.evaluate(() => {
    const e = window.__e2e;
    if (!e) return "";
    const r = (t) => Math.round(t);
    const partes = [`load ${e.carga === null ? "?" : r(e.carga)}`];
    for (const a of e.attrs) {
      if (a.a === "data-estado" && a.el.includes("manos")) partes.push(`${a.v} ${r(a.t)}`);
      else if (a.a === "data-sin-webgl" && a.v !== null) partes.push(`sin-webgl ${r(a.t)}`);
      else if (a.a === "data-cerrado" && a.el.includes("#inicio") && a.v !== null) partes.push(`data-cerrado ${r(a.t)}`);
    }
    if (document.querySelector(".manos canvas")) partes.push("canvas");
    return partes.join(" · ");
  });
}
/** La tira ya hizo su entrada y espera (o se quedó sin WebGL y espera igual). */
async function esperarEspera(page, msMax = 14000) {
  const fin = Date.now() + msMax;
  for (;;) {
    const s = await page.evaluate(() => {
      const m = document.querySelector(".manos");
      const a = (window.__e2e && window.__e2e.attrs) || [];
      const entro = a.find((x) => x.a === "data-estado" && x.v === "entrando");
      const vuelta = entro && a.find((x) => x.a === "data-estado" && x.v === "espera" && x.t >= entro.t);
      const sin = a.find((x) => x.a === "data-sin-webgl" && x.v !== null);
      return {
        estado: m ? m.getAttribute("data-estado") : null,
        sinWebgl: !!m && m.hasAttribute("data-sin-webgl"),
        tVuelta: vuelta ? vuelta.t : null,
        tSin: sin ? sin.t : null,
        cerrado: !!document.querySelector("#inicio[data-cerrado]"),
        ahora: performance.now(),
      };
    });
    if (s.cerrado) return { modo: "ya-cerrado", ...s };
    if (s.estado === "espera" && s.tVuelta !== null) return { modo: "gl", t: s.tVuelta, ...s };
    // Sin WebGL el boceto sube en 700 ms y espera desde entonces.
    if (s.estado === "espera" && s.sinWebgl && s.ahora >= (s.tSin ?? 0) + 750) return { modo: "sin-webgl", t: (s.tSin ?? s.ahora) + 700, ...s };
    if (Date.now() >= fin) return { modo: "sin-entrada", t: null, ...s };
    await dormir(40);
  }
}
/**
 * Espera a que la página se asiente antes de tocar algo que vive en una isla (la ficha, la demo): su primer momento
 * ocioso después del load (la hidratación ya corrió) y la red quieta. Un toque antes caería en el enlace o el
 * formulario de siempre, sin JavaScript, y se iría de la portada.
 */
async function asentar(page) {
  await page.waitForFunction(() => window.__e2e && window.__e2e.ocio !== null, null, { polling: 50, timeout: 10000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
}
const tocar = async (page, x, y) => {
  if (page.__vista?.hasTouch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
};
/** Rayos y dibujos de WebGL entre t0 y t1 (ms desde la navegación), y quién pidió los cuadros. */
const contar = (page, t0, t1) =>
  page.evaluate(
    ([a, b]) => {
      const e = window.__e2e;
      const en = (t) => t >= a && t <= b;
      return {
        raf: e.raf.filter(en).length,
        dib: e.dib.filter(en).length,
        cambios: e.attrs.filter((x) => en(x.t) && ["data-estado", "data-cerrado", "data-capa", "data-lazo"].includes(x.a)).map((x) => `${x.a}=${x.v}`),
        pilas: [...new Set(e.pilas.filter((x) => x && en(x.t)).map((x) => x.de))].slice(0, 3),
      };
    },
    [t0, t1],
  );
const fmtCuenta = (c) => `rAF ${c.raf} · dibujos ${c.dib}${c.cambios.length ? ` · cambió: ${c.cambios.join(", ")}` : ""}${c.pilas.length ? ` · rAF desde: ${c.pilas.join(" | ")}` : ""}`;

// ── Cada prueba con su registro, sus contextos y su tope de tiempo ──
class Prueba {
  constructor(nombre) {
    this.nombre = nombre;
    this.lineas = [];
    this.contextos = [];
    this.bloqueados = [];
    this.errores = [];
    this.cerrada = false;
  }
  linea(ok, etiqueta, medido = "", detalle) {
    if (this.cerrada) return ok;
    const l = { ok: ok === null ? null : !!ok, etiqueta, medido: String(medido) };
    if (detalle !== undefined) l.detalle = detalle;
    this.lineas.push(l);
    console.log(`${l.ok === null ? "INFO" : l.ok ? "PASS" : "FAIL"} [${this.nombre}] ${etiqueta}${l.medido ? `: ${l.medido}` : ""}`);
    return l.ok;
  }
  info(etiqueta, medido, detalle) {
    return this.linea(null, etiqueta, medido, detalle);
  }
  /** Un contexto propio: la vista, sin nada fuera de localhost, con el instrumento (si hay JS) y una página. */
  async abrir({ vista = "390", nav = "gl", reduce = false, js = true, instrumento = {} } = {}) {
    const { etiqueta, ...v } = VISTAS[vista];
    const browser = await navegador(nav);
    const ctx = await browser.newContext({ ...v, reducedMotion: reduce ? "reduce" : "no-preference", javaScriptEnabled: js, locale: "es-VE", timezoneId: "America/Caracas", serviceWorkers: "block" });
    this.contextos.push(ctx);
    await ctx.route("**/*", (route) => {
      const url = route.request().url();
      let host = "";
      try {
        host = new URL(url).hostname;
      } catch {
        // una URL rara: fuera
      }
      if (LOCALES.has(host)) return route.continue();
      this.bloqueados.push(url);
      return route.abort("blockedbyclient");
    });
    if (js) await ctx.addInitScript(INSTRUMENTO, instrumento);
    const page = await ctx.newPage();
    page.__vista = { etiqueta, ...v };
    page.on("pageerror", (e) => this.errores.push(String(e?.message || e).slice(0, 200)));
    return { ctx, page, etiqueta };
  }
  async cerrar() {
    this.cerrada = true;
    await Promise.all(this.contextos.map((c) => c.close().catch(() => {})));
  }
}

// ═══ Las pruebas, una por línea de ACCEPTANCE ═══

/** [palabras] El presupuesto de palabras: ≤ 110 en el celular (hero ≤ 32, H1 + sub ≤ 13, cada línea ≤ 8), ≤ 112 en el escritorio. */
async function palabras(p) {
  for (const [vista, tope] of [
    ["390", 110],
    ["1440", 112],
  ]) {
    // Reducir movimiento: el lazo ya cerrado, la respuesta a la vista y cada reveal en su estado final.
    const { page, etiqueta } = await p.abrir({ vista, reduce: true });
    await ir(page);
    const cerrado = await hasta(() => lib(page, "atributo", "#inicio", "data-cerrado"), { ms: 8000 });
    if (!cerrado) p.info(`${etiqueta} aviso`, "#inicio nunca tuvo data-cerrado: se cuenta como quedó");
    await recorrer(page);
    const r = await lib(page, "palabras");
    p.linea(r.total <= tope, `${etiqueta} palabras visibles en la portada`, `${r.total} <= ${tope} (${Object.entries(r.secciones).map(([k, n]) => `${k} ${n}`).join(", ")})`, { secciones: r.secciones, texto: r.texto });
    if (vista !== "390") continue;
    p.linea(r.hero <= 32, `${etiqueta} #inicio`, `${r.hero} <= 32`);
    p.linea(r.h1sub <= 13, `${etiqueta} H1 + sub`, `${r.h1sub} <= 13`);
    const ls = r.lineas;
    p.linea(ls.length >= OBRAS.length && ls.every((l) => l.n <= 8), `${etiqueta} cada .obra-linea <= 8`, ls.length ? ls.map((l) => `${l.n} ${corta(l.t, 40)}`).join(" · ") : "no hay ninguna .obra-linea");
  }
}

/** [pulgar] Un wa.me bajo el pulgar en cada parada de 200 px: en el celular entero, ≥ 44 px, en la mitad de abajo y sin tapar. */
async function pulgar(p) {
  for (const vista of ["390", "360", "1440"]) {
    const estricto = vista === "390";
    const { page, etiqueta } = await p.abrir({ vista });
    await ir(page);
    const malas = [];
    let n = 0;
    await muestrear(page, 200, async (y) => {
      n++;
      const m = await lib(page, "pulgar");
      if (!(estricto ? m.estricto : m.simple)) malas.push({ y, ...m.barra });
    });
    const regla = estricto ? "wa.me entero, >= 44 px de alto, top >= mitad de la pantalla y sin tapar" : "wa.me entero y sin tapar";
    const fmt = (m) => `y=${m.y} ${m.el}${m.v === false ? " invisible" : ""}${m.entero === false ? " cortado" : ""}${m.alto !== undefined ? ` alto ${m.alto} top ${m.top}` : ""}${m.tapa ? ` tapado por ${m.tapa}` : ""}`;
    p.linea(malas.length === 0, `${etiqueta} ${regla}`, malas.length ? `${malas.length}/${n} paradas fallan: ${malas.slice(0, 3).map(fmt).join(" · ")}` : `${n}/${n} paradas`, malas.length ? malas : undefined);
  }
}

/** [azul] A lo sumo un azul sólido a la vista; sobre el campo de Cuadra la barra es Cloud (#f7f8f8). */
async function azul(p) {
  for (const vista of ["390", "1440"]) {
    const { page, etiqueta } = await p.abrir({ vista });
    await ir(page);
    const dobles = [];
    const malas = [];
    let muestras = 0;
    let bajo = 0;
    let falta = null;
    const revisar = async (y) => {
      muestras++;
      const m = await lib(page, "azul");
      if (m.primarios.length > 1) dobles.push({ y, primarios: m.primarios });
      if (!m.hayBarra || !m.hayCuadra) falta = !m.hayBarra ? "no hay a.barra-wa" : "no hay #cuadra";
      if (m.solape === null) return;
      if (m.solape >= 4) {
        bajo++;
        const ok = await hasta(async () => {
          const k = await lib(page, "azul");
          return k.sobre && k.fondo === "rgb(247, 248, 248)";
        }, { ms: 900 });
        if (!ok) {
          const k = await lib(page, "azul");
          malas.push(`y=${y} bajo #cuadra: data-sobre-azul ${k.sobre ? "sí" : "no"}, fondo ${k.fondo}`);
        }
      } else if (m.solape <= -4) {
        const ok = await hasta(async () => !(await lib(page, "azul")).sobre, { ms: 900 });
        if (!ok) malas.push(`y=${y} lejos de #cuadra y todavía data-sobre-azul`);
      }
    };
    await muestrear(page, 200, revisar);
    for (const y of await lib(page, "posCuadra")) {
      await desplazar(page, y);
      await revisar(y);
    }
    p.linea(dobles.length === 0, `${etiqueta} a lo sumo un .btn-primary visible en pantalla`, dobles.length ? `${dobles.length}/${muestras} paradas con más: ${dobles.slice(0, 2).map((d) => `y=${d.y} ${d.primarios.join(" + ")}`).join(" · ")}` : `${muestras}/${muestras} paradas`);
    p.linea(!falta && bajo > 0 && malas.length === 0, `${etiqueta} bajo #cuadra la barra lleva data-sobre-azul y fondo rgb(247, 248, 248)`, falta || (bajo === 0 ? "#cuadra nunca quedó bajo la barra" : malas.length ? malas.slice(0, 3).join(" · ") : `${bajo} paradas bajo #cuadra, fuera de él sin data-sobre-azul`));
  }
}

/** [prefill] La frase de la barra según lo que cruza la mitad de la pantalla, y el clic que abre wa.me sin esperar. */
async function prefill(p) {
  const { page, etiqueta } = await p.abrir({ vista: "390" });
  await ir(page);
  const leerBarra = () => lib(page, "textoBarra");
  const esperar = async (cumple) => (await hasta(async () => ((await cumple(await leerBarra())) ? true : false), { ms: 3000 })) || false;

  await desplazar(page, 0);
  let ok = await esperar((t) => t === MSG_INICIO);
  p.linea(ok, `${etiqueta} arriba: HOME_WHATSAPP_MESSAGE`, corta(await leerBarra()));
  for (const o of OBRAS) {
    const y = await lib(page, "centroDe", selObra(o).split(", "));
    if (y === null) {
      p.linea(false, `${etiqueta} ${o.nombre} al centro`, `no hay ${selObra(o)}`);
      continue;
    }
    await desplazar(page, y);
    const esperado = o.nombre === "SAMER" ? SAMER_PREFIJO : msgPieza(o.nombre);
    ok = await esperar((t) => typeof t === "string" && t.startsWith(esperado));
    p.linea(ok, `${etiqueta} ${o.nombre} al centro: empieza por ${corta(esperado, 50)}`, corta(await leerBarra()));
  }
  const yAgente = await lib(page, "centroDe", ["section#agente"]);
  if (yAgente === null) p.linea(false, `${etiqueta} #agente al centro`, "no hay section#agente");
  else {
    await desplazar(page, yAgente);
    const esperado = MSG_AGENTE || "Hola, Adrián. Vi el agente de WhatsApp en allok.fun";
    ok = await esperar((t) => typeof t === "string" && t.startsWith(esperado));
    p.linea(ok, `${etiqueta} #agente al centro: la frase del agente`, corta(await leerBarra()));
  }
  await desplazar(page, "max");
  ok = await esperar((t) => t === MSG_INICIO);
  p.linea(ok, `${etiqueta} abajo: HOME_WHATSAPP_MESSAGE`, corta(await leerBarra()));

  for (const a of [500, 2500]) await clicBarra(p, a);
}

/** Un clic en la barra `a` ms después del load (la spec: «at 0.5 s and at 2.5 s after load»): un pedido a wa.me, ya, con la frase de arriba. */
async function clicBarra(p, a) {
  const { ctx, page, etiqueta } = await p.abrir({ vista: "390" });
  const pedidos = [];
  // wa.me abre en otra pestaña. Con ella delante, Chromium deja la portada en segundo plano (rAF a 1 por
  // segundo) y la respuesta de las manos se arrastra: eso es del navegador, no de la página. En un
  // teléfono la página queda oculta y termina al volver; aquí se cierra la pestaña y se vuelve, en el acto.
  ctx.on("page", (nueva) => {
    if (nueva === page) return;
    // Después de que el pedido a wa.me salió y se contestó: cerrarla antes lo cortaría.
    nueva
      .waitForLoadState("domcontentloaded", { timeout: 5000 })
      .catch(() => undefined)
      .then(() => nueva.close())
      .catch(() => undefined)
      .then(() => page.bringToFront())
      .catch(() => undefined);
  });
  await ctx.route(/^https:\/\/(wa\.me|api\.whatsapp\.com)\//, (route) => {
    pedidos.push({ t: Date.now(), url: route.request().url() });
    return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>wa.me</title>" });
  });
  await page.goto(HOME, { waitUntil: "commit", timeout: 60000 });
  const hay = await page.waitForSelector('a.barra-wa[href^="https://wa.me/"]', { state: "visible", timeout: 15000 }).then(
    () => true,
    () => false,
  );
  if (!hay) return p.linea(false, `${etiqueta} clic en la barra ${a / 1000} s después del load`, 'ningún a.barra-wa[href^="https://wa.me/"] a la vista en 15 s');
  // El centro de la barra se mide antes, y el toque cae en ese punto a la hora justa: las esperas de un
  // locator.click (estable, recibe eventos) lo correrían unos cientos de ms.
  await page.waitForFunction(() => window.__e2e && window.__e2e.carga !== null, null, { polling: 10, timeout: 60000 });
  const punto = async () =>
    page.evaluate(() => {
      const r = document.querySelector("a.barra-wa").getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    });
  const carga = await page.evaluate(() => window.__e2e.carga);
  let centro = await punto();
  await page.waitForFunction((x) => performance.now() >= x - 60, carga + a, { polling: 10, timeout: 60000 });
  centro = await punto();
  await page.waitForFunction((x) => performance.now() >= x, carga + a, { polling: 5, timeout: 5000 });
  await tocar(page, centro.x, centro.y);
  await hasta(() => pedidos.length > 0, { ms: 5000, cada: 10 });
  const clics = await page.evaluate(() => (window.__e2e ? window.__e2e.clics : []));
  const clic = clics.find((c) => c.el.includes("barra-wa") || c.el.includes("barra-marca")) || clics.at(-1);
  // Las manos seguían abiertas si data-cerrado no llegó antes del clic.
  const tCerrado = await tiempoAtributo(page, "data-cerrado", "#inicio");
  const abierto = !!clic && (tCerrado === null || tCerrado > clic.t);
  const pedido = pedidos[0];
  const demora = pedido && clic ? Math.round(pedido.t - clic.epoch) : null;
  const texto = pedido ? new URL(pedido.url).searchParams.get("text") : null;
  p.linea(
    !!pedido && demora !== null && demora <= DEMORA_MAX && texto === MSG_INICIO,
    `${etiqueta} clic en la barra ${a / 1000} s después del load: pedido a wa.me sin demora, con HOME_WHATSAPP_MESSAGE`,
    pedido ? `${demora} ms tras el clic (<= ${DEMORA_MAX}; clic a ${ms(clic ? clic.t - carga : null)} ms del load, ${ms(clic?.t)} ms de la navegación), ${corta(texto, 40)}` : "ningún pedido a wa.me en 5 s",
  );
  // Con las manos todavía abiertas, el clic las cierra por detrás (manos:cerrar).
  if (a >= 2000 && abierto && clic) {
    const t = await hasta(() => tiempoAtributo(page, "data-cerrado", "#inicio"), { ms: 4500 });
    const tras = t !== null && t >= 0 ? Math.round(t - clic.t) : null;
    p.linea(tras !== null && tras <= 3500, `${etiqueta} ese clic cierra el lazo por detrás`, tras === null ? "sin data-cerrado 4.5 s después del clic" : `data-cerrado ${tras} ms después del clic (<= 3500: lo que quede de la entrada + 1.3 s)`);
  }
}

/** [toque] Tocar el centro de la tira después de la entrada: el punto en 50 ms, el lazo cerrado en 2.3 s, la respuesta. */
async function toque(p) {
  const { page, etiqueta } = await p.abrir({ vista: "390" });
  await ir(page);
  const es = await esperarEspera(page);
  p.info(`${etiqueta} la entrada`, `${es.modo} · ${await historia(page)}`);
  if (es.modo === "ya-cerrado") {
    p.linea(false, `${etiqueta} tocar después de la entrada`, "el lazo ya estaba cerrado antes de poder tocar");
    return;
  }
  const c = await lib(page, "centroManos");
  if (!c) return p.linea(false, `${etiqueta} la tira`, "no hay .manos");
  await tocar(page, c.x, c.y);
  const d = await hasta(() => page.evaluate(() => (window.__e2e.arriba && window.__e2e.punto ? { arriba: window.__e2e.arriba.t, punto: window.__e2e.punto.t } : null)), { ms: 1200, cada: 25 });
  const arriba = d ? d.arriba : await page.evaluate(() => window.__e2e.arriba && window.__e2e.arriba.t);
  const dt = d ? Math.round(d.punto - d.arriba) : null;
  p.linea(dt !== null && dt <= 50, `${etiqueta} .manos-punto a la vista tras el toque`, dt === null ? "no se vio .manos-punto en 1 s" : `${dt} ms tras el pointerup <= 50`);
  const t = await hasta(async () => {
    const x = await tiempoAtributo(page, "data-cerrado", "#inicio");
    return x !== null && x >= 0 ? x : null;
  }, { ms: 4000 });
  const tras = t !== null && arriba ? Math.round(t - arriba) : null;
  p.linea(tras !== null && tras <= 2300, `${etiqueta} #inicio[data-cerrado] tras el toque`, tras === null ? "no llegó en 4 s" : `${tras} ms <= 2300`);
  const pista = await hasta(async () => !(await lib(page, "visible", ".manos-pista")), { ms: 1500 });
  p.linea(pista, `${etiqueta} .manos-pista escondida`, pista ? "" : "sigue a la vista");
  const resp = await hasta(async () => {
    const r = await page.evaluate(() => {
      const el = document.querySelector("#inicio .respuesta");
      return el ? { op: getComputedStyle(el).opacity, texto: (el.textContent || "").trim() } : null;
    });
    return r && r.op === "1" && (await lib(page, "visible", "#inicio .respuesta")) ? r : null;
  }, { ms: 1500 });
  p.linea(!!resp && resp.texto.includes("Cuéntame qué te quita tiempo."), `${etiqueta} «Cuéntame qué te quita tiempo.» a la vista`, resp ? corta(resp.texto) : "no se ve #inicio .respuesta");
}

/** [solo] Sin tocar nada, el lazo se cierra en 6.5 s desde el load (la spec: «within 6.5 s of load»), con y sin WebGL. */
async function solo(p) {
  for (const sinGl of [false, true]) {
    const { page, etiqueta } = await p.abrir({ vista: "390", nav: sinGl ? "sin" : "gl", instrumento: { sinWebgl: sinGl } });
    await ir(page);
    const carga = await page.evaluate(() => window.__e2e.carga);
    const t = await hasta(async () => {
      const x = await tiempoAtributo(page, "data-cerrado", "#inicio");
      return x !== null ? x : null;
    }, { ms: 10000 });
    const como = sinGl ? "sin WebGL" : (await page.evaluate(() => !!document.querySelector(".manos canvas"))) ? "con WebGL" : "con WebGL (pero no montó ningún canvas)";
    // Cerrado ya en el HTML no es cerrarse solo: no hubo espera.
    const tl = t !== null && t >= 0 ? t - carga : null;
    p.linea(tl !== null && tl <= 6500, `${etiqueta} ${como}: #inicio[data-cerrado] sin ningún toque, <= 6.5 s del load`, t === null ? `no se cerró en 10 s (${await historia(page)})` : t < 0 ? "data-cerrado venía en el HTML: no hubo espera" : `a ${ms(tl)} ms del load, ${ms(t)} ms de la navegación (${await historia(page)})`);
  }
}

/** [quieto] La escena no pide cuadros ni dibuja cuando está quieta: en espera, cerrada y fuera de la pantalla. */
async function quieto(p) {
  {
    const { page, etiqueta } = await p.abrir({ vista: "390", instrumento: { pilas: true } });
    await ir(page);
    const es = await esperarEspera(page);
    if (es.modo === "ya-cerrado") p.linea(false, `${etiqueta} en espera`, "el lazo se cerró antes de esperar");
    else {
      // Del segundo 2 al 3 después del load, salvo que la entrada termine después: entonces el segundo que le sigue.
      const carga = await page.evaluate(() => window.__e2e.carga);
      const t0 = Math.max(carga + 2000, (es.t ?? 0) + 300);
      let t1 = t0 + 1000;
      await esperarHasta(page, t1 + 30);
      // Si la tira deja la espera dentro del segundo (se cierra sola antes de tiempo), la ventana termina ahí: lo que
      // dibuje respondiendo no es la espera. Media ventana como mínimo, o la medida no dice nada.
      const salio = await page.evaluate(
        ([a, b]) => {
          const x = window.__e2e.attrs.find((y) => y.a === "data-estado" && y.el.includes("manos") && y.t > a && y.t <= b);
          return x ? { t: x.t, v: x.v } : null;
        },
        [t0, t1],
      );
      if (salio) t1 = salio.t - 20;
      const c = await contar(page, t0, t1);
      p.linea(t1 - t0 >= 500 && c.raf === 0 && c.dib === 0, `${etiqueta} en espera (${ms(t0)}-${ms(t1)} ms, ${es.modo})`, `${fmtCuenta(c)}${salio ? ` · la espera terminó a ${ms(salio.t)} ms (data-estado=${salio.v})${t1 - t0 < 500 ? ": menos de 500 ms de espera que medir" : ""}` : ""}`);
    }
    let tc = await hasta(async () => {
      const x = await tiempoAtributo(page, "data-cerrado", "#inicio");
      return x !== null && x >= 0 ? x : null;
    }, { ms: 9000 });
    let como = "solo";
    if (tc === null) {
      const c = await lib(page, "centroManos");
      if (c) await tocar(page, c.x, c.y);
      tc = await hasta(async () => {
        const x = await tiempoAtributo(page, "data-cerrado", "#inicio");
        return x !== null && x >= 0 ? x : null;
      }, { ms: 4000 });
      como = "con un toque";
    }
    if (tc === null) p.linea(false, `${etiqueta} cerrado`, "nunca llegó data-cerrado");
    else {
      const w0 = tc + 1000;
      const w1 = w0 + 2000;
      await esperarHasta(page, w1 + 30);
      const c = await contar(page, w0, w1);
      p.linea(c.raf === 0 && c.dib === 0, `${etiqueta} cerrado (${como}), de 1 s a 3 s después de data-cerrado`, fmtCuenta(c));
    }
  }
  {
    const { page, etiqueta } = await p.abrir({ vista: "390", instrumento: { pilas: true } });
    await ir(page);
    // A media entrada si la hay: es cuando más cuadros pediría.
    await hasta(() => page.evaluate(() => window.__e2e.attrs.some((x) => x.a === "data-estado" && x.v === "entrando")), { ms: 4000 });
    const ts = await page.evaluate(() => {
      const b = document.querySelector(".manos").getBoundingClientRect();
      window.scrollTo({ top: b.bottom + scrollY + 8, behavior: "instant" });
      return performance.now();
    });
    const w0 = ts + 1000;
    const w1 = w0 + 2000;
    await esperarHasta(page, w1 + 30);
    const fuera = await page.evaluate(() => document.querySelector(".manos").getBoundingClientRect().bottom <= 0);
    const c = await contar(page, w0, w1);
    p.linea(fuera && c.raf === 0 && c.dib === 0, `${etiqueta} con la tira fuera de la pantalla (${ms(w0)}-${ms(w1)} ms)`, `${fuera ? "" : "la tira seguía en pantalla · "}${fmtCuenta(c)}`);
  }
}

/** [reducido] Con reducir movimiento: el cuadro final al cargar, cada reveal en su sitio y ningún cuadro pedido. */
async function reducido(p) {
  const { page, etiqueta } = await p.abrir({ vista: "390", reduce: true, instrumento: { pilas: true } });
  await ir(page);
  const carga = await page.evaluate(() => window.__e2e.carga);
  const t = await hasta(() => tiempoAtributo(page, "data-cerrado", "#inicio"), { ms: 3000 });
  p.linea(t !== null && t <= carga + 1000, `${etiqueta} #inicio[data-cerrado] al cargar`, t === null ? "no lo tiene" : t < 0 ? "en el HTML" : `a ${ms(t)} ms (load a ${ms(carga)} ms)`);
  const r = await lib(page, "reducido");
  p.linea(r.pista.existe && !r.pista.visible, `${etiqueta} la pista no se ve`, !r.pista.existe ? "no hay .manos-pista" : r.pista.visible ? "se ve" : "");
  p.linea(r.respuesta.visible && r.respuesta.opacidad === "1", `${etiqueta} la respuesta se ve`, r.respuesta.existe ? `opacity ${r.respuesta.opacidad} ${corta(r.respuesta.texto)}` : "no hay #inicio .respuesta");
  p.linea(r.reveals.n > 0 && r.reveals.malos.length === 0, `${etiqueta} cada [data-reveal] con opacity 1 y transform none`, r.reveals.n === 0 ? "no hay ningún [data-reveal]" : r.reveals.malos.length ? `${r.reveals.malos.length}/${r.reveals.n} no: ${r.reveals.malos.slice(0, 3).join(" · ")}` : `${r.reveals.n}/${r.reveals.n}`);
  // La portada en su cuadro final: el boceto con el lazo cerrado, o la escena (que dibuja su cuadro cerrado una vez).
  const pt = r.portada;
  const bocetoCerrado = pt.existe && pt.puntoVisible && pt.arcoVisible !== false;
  const escenaCerrada = pt.existe && pt.capa === "gl" && pt.canvas;
  p.linea(pt.existe && pt.estado === "cerrado" && (bocetoCerrado || escenaCerrada), `${etiqueta} la portada en su cuadro final (data-estado=cerrado, lazo cerrado)`, `data-estado ${pt.estado}, ${bocetoCerrado ? "boceto cerrado" : escenaCerrada ? "la escena (data-capa=gl)" : "ni el boceto cerrado ni la escena"} · ${JSON.stringify(pt)}`);
  const cierre = await hasta(async () => {
    const x = await lib(page, "puntoLazo", ".cierre-lazo");
    return x.existe && x.puntoVisible && x.arcoVisible !== false ? x : null;
  }, { ms: 2500 });
  const ultimo = cierre || (await lib(page, "puntoLazo", ".cierre-lazo"));
  p.linea(!!cierre, `${etiqueta} el cierre muestra el lazo cerrado`, ultimo.existe ? JSON.stringify(ultimo) : "no hay .cierre-lazo");
  await esperarHasta(page, carga + 2030);
  const c = await contar(page, carga, carga + 2000);
  p.linea(c.raf === 0, `${etiqueta} rAF en los 2 s después de load`, fmtCuenta(c));
}

/** [sin-webgl] Sin WebGL: data-sin-webgl, el boceto entero, three.js nunca pedido, y un toque cierra el lazo en 2D. */
async function sinWebgl(p) {
  const { ctx, page, etiqueta } = await p.abrir({ vista: "390", nav: "sin", instrumento: { sinWebgl: true } });
  const cuerpos = [];
  ctx.on("response", (res) => {
    const tipo = res.request().resourceType();
    const ct = res.headers()["content-type"] || "";
    if (tipo === "script" || /javascript|ecmascript/.test(ct))
      cuerpos.push(
        res.text().then(
          (t) => ({ url: res.url(), tiene: t.includes("WebGLRenderer") }),
          () => ({ url: res.url(), tiene: null }),
        ),
      );
  });
  await ir(page);
  const sin = await hasta(() => lib(page, "atributo", ".manos", "data-sin-webgl"), { ms: 6000 });
  p.linea(sin, `${etiqueta} .manos[data-sin-webgl]`, sin ? "" : `no llegó (${await historia(page)})`);
  const op = await hasta(async () => {
    const o = await page.evaluate(() => {
      const s = document.querySelector(".manos .manos-trazo");
      return s ? getComputedStyle(s).opacity : null;
    });
    return o === "1" ? o : null;
  }, { ms: 2500 });
  const opFinal = op || (await page.evaluate(() => getComputedStyle(document.querySelector(".manos .manos-trazo") || document.body).opacity));
  p.linea(op === "1", `${etiqueta} el boceto a opacity 1`, `opacity ${opFinal}`);
  const es = await esperarEspera(page, 6000);
  if (es.modo === "ya-cerrado") p.linea(false, `${etiqueta} un toque cierra el lazo`, "se cerró solo antes del toque");
  else {
    const c = await lib(page, "centroManos");
    await tocar(page, c.x, c.y);
    const arriba = await hasta(() => page.evaluate(() => window.__e2e.arriba && window.__e2e.arriba.t), { ms: 1000 });
    const t = await hasta(async () => {
      const x = await tiempoAtributo(page, "data-cerrado", "#inicio");
      return x !== null && x >= 0 ? x : null;
    }, { ms: 4000 });
    const tras = t !== null && arriba ? Math.round(t - arriba) : null;
    p.linea(tras !== null && tras <= 2300, `${etiqueta} un toque cierra el lazo`, tras === null ? "sin data-cerrado 4 s después del toque" : `data-cerrado ${tras} ms tras el toque <= 2300`);
    const punto = await hasta(async () => {
      const x = await lib(page, "puntoLazo", ".manos");
      return x.puntoVisible ? x : null;
    }, { ms: 2000 });
    p.linea(!!punto, `${etiqueta} el punto del lazo (SVG) a la vista`, JSON.stringify(punto || (await lib(page, "puntoLazo", ".manos"))));
  }
  // Lo que se pide en el primer momento ocioso ya tuvo tiempo de llegar.
  await esperarHasta(page, 6500);
  const lista = await Promise.all(cuerpos);
  const malos = lista.filter((x) => x.tiene);
  p.linea(malos.length === 0, `${etiqueta} ningún script pedido contiene 'WebGLRenderer'`, `${lista.length} scripts leídos${malos.length ? `; con WebGLRenderer: ${malos.map((m) => m.url.replace(BASE, "")).join(", ")}` : ""}`);
}

/** [sin-js] Sin JavaScript: el H1, el sub, el boceto cerrado, la barra wa.me a la vista y cada captura con su href. */
async function sinJs(p) {
  const { page, etiqueta } = await p.abrir({ vista: "390", js: false });
  await ir(page);
  const r = await lib(page, "sinJs");
  p.linea(r.h1.visible && /Hola, soy\s*Adrián\./.test(r.h1.texto), `${etiqueta} el H1`, corta(r.h1.texto));
  p.linea(r.sub.visible && r.sub.texto.includes("Hago webs, sistemas y agentes de WhatsApp para tu negocio."), `${etiqueta} el sub`, corta(r.sub.texto));
  p.linea(r.boceto.existe && r.boceto.boceto && r.boceto.puntoVisible && r.boceto.arcoVisible !== false, `${etiqueta} el boceto, cerrado`, JSON.stringify(r.boceto));
  p.linea(r.barra.ok, `${etiqueta} una barra wa.me entera y sin tapar`, r.barra.detalle.length ? JSON.stringify(r.barra.detalle) : 'ningún a[href^="https://wa.me/"]');
  const ids = OBRAS.filter((o) => !r.capturas.ids.includes(o.id)).map((o) => o.id);
  p.linea(r.capturas.n >= OBRAS.length && ids.length === 0 && r.capturas.malas.length === 0, `${etiqueta} cada captura es un enlace con href`, `${r.capturas.n} [data-abrir-pieza], ${r.capturas.imgs} imágenes en .obra${ids.length ? `; faltan: ${ids.join(", ")}` : ""}${r.capturas.malas.length ? `; ${r.capturas.malas.slice(0, 3).join(" · ")}` : ""}`);
}

/** [cls] La suma de layout shifts (sin toque previo) por la carga, el reloj, la respuesta y un recorrido entero < 0.001. */
async function cls(p) {
  for (const vista of ["360", "390", "1440"]) {
    const { page, etiqueta } = await p.abrir({ vista });
    await ir(page);
    const reloj = await hasta(() => page.evaluate(() => (document.querySelector("#inicio .reloj")?.textContent || "").trim() || null), { ms: 5000 });
    // La respuesta sola, sin toque: un toque marcaría lo que sigue como hadRecentInput.
    const t = await hasta(async () => {
      const x = await tiempoAtributo(page, "data-cerrado", "#inicio");
      return x !== null && x >= 0 ? x : null;
    }, { ms: 9000 });
    if (t !== null) await esperarHasta(page, t + 900);
    await recorrer(page, 0.5, false);
    await dormir(400);
    const s = await page.evaluate(() => window.__e2e.cambios);
    const validos = s.filter((x) => !x.input);
    const suma = validos.reduce((a, x) => a + x.v, 0);
    const peores = validos.sort((a, b) => b.v - a.v).slice(0, 3).map((x) => `${x.v.toFixed(4)} a ${Math.round(x.t)} ms (${x.de.join(", ")})`);
    p.linea(suma < 0.001, `${etiqueta} suma de layout-shift`, `${suma.toFixed(5)} < 0.001 (reloj ${reloj ? corta(reloj) : "vacío"}, respuesta ${t !== null ? `a ${ms(t)} ms` : "no llegó"})${peores.length ? `; ${peores.join(" · ")}` : ""}`);
  }
}

/** [desborde] Nada más ancho que la pantalla: al cargar, durante la respuesta, con una ficha abierta y con la demo trabajando. */
async function desborde(p) {
  for (const vista of ["360", "390", "1440"]) {
    const { ctx, page, etiqueta } = await p.abrir({ vista });
    // La demo nunca llega a la API de verdad: se queda pensando y después falla con un error de prueba.
    let soltar = () => {};
    const retenida = new Promise((ok) => (soltar = ok));
    let pedidosDemo = 0;
    await ctx.route("**/api/demo/**", async (route) => {
      pedidosDemo++;
      await Promise.race([retenida, dormir(20000)]);
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "e2e", message: "Prueba de la portada: la demo no se arma." } }) }).catch(() => {});
    });
    await ir(page);
    await asentar(page);
    const medir = async (momento, durante = 0, ficha = false) => {
      const r = await lib(page, "ancho", durante, 100, ficha);
      const extra = ficha ? (r.hoja.length ? `; la hoja se sale: ${r.hoja.join(", ")}` : "; la hoja cabe") : "";
      p.linea(r.peor <= r.iw && !r.hoja.length, `${etiqueta} ${momento}: scrollWidth <= innerWidth`, `${r.peor} <= ${r.iw}${r.culpables.length ? ` (${r.culpables.join(", ")})` : ""}${extra}`);
    };
    await medir("al cargar");

    const es = await esperarEspera(page, 12000);
    if (es.modo === "ya-cerrado") p.linea(false, `${etiqueta} durante la respuesta`, "el lazo ya estaba cerrado: no hubo respuesta que mirar");
    else {
      await desplazar(page, 0);
      const c = await lib(page, "centroManos");
      await tocar(page, c.x, c.y);
      await medir("durante la respuesta", 2300);
    }

    const cap = page.locator(selObra(OBRAS[0]).split(", ").map((s) => `${s} [data-abrir-pieza]`).join(", ")).first();
    if (!(await cap.count())) p.linea(false, `${etiqueta} con una ficha abierta`, "no hay captura de SAMER con data-abrir-pieza");
    else {
      await cap.scrollIntoViewIfNeeded();
      if (page.__vista.hasTouch) await cap.tap();
      else await cap.click();
      const abierta = await page.waitForSelector('.ficha[aria-modal="true"]', { timeout: 8000 }).then(
        () => true,
        () => false,
      );
      if (!abierta) p.linea(false, `${etiqueta} con una ficha abierta`, "la ficha no abrió en 8 s");
      else {
        await medir("con una ficha abierta", 700, true);
        await page.keyboard.press("Escape");
        const fuera = await hasta(() => page.evaluate(() => !document.querySelector(".ficha")), { ms: 2500 });
        if (!fuera) await page.goBack().catch(() => {});
        await hasta(() => page.evaluate(() => !document.querySelector('[aria-modal="true"]')), { ms: 2500 });
      }
    }

    const form = page.locator("#agente form").first();
    if (!(await form.count())) p.linea(false, `${etiqueta} con la demo trabajando`, "no hay #agente form");
    else {
      await form.scrollIntoViewIfNeeded();
      const campos = form.locator('input:not([type="hidden"]):not([type="submit"])');
      if ((await campos.count()) < 2) p.linea(false, `${etiqueta} con la demo trabajando`, "el formulario no tiene dos campos");
      else {
        await campos.nth(0).fill("Panadería Luz");
        await campos.nth(1).fill("panaderialuz.com");
        const boton = form.locator('button[type="submit"], button:not([type]), input[type="submit"]').first();
        if (page.__vista.hasTouch) await boton.tap();
        else await boton.click();
        const salio = await hasta(() => pedidosDemo > 0, { ms: 3000 });
        if (!salio) p.linea(false, `${etiqueta} con la demo trabajando`, "el envío no pidió /api/demo/*");
        // Más de 7 s: el segundo paso de useArmarDemo llega a los 7 s y dibuja su trazo.
        else await medir("con la demo trabajando", 7600);
      }
    }
    soltar();
  }
}

/** [atras] Desde about:blank, tocar la captura de SAMER abre su ficha con una entrada propia; Atrás la cierra. */
async function atras(p) {
  const { page, etiqueta } = await p.abrir({ vista: "390" });
  await page.goto("about:blank");
  await ir(page);
  await asentar(page);
  const h0 = await page.evaluate(() => history.length);
  const cap = page.locator(selObra(OBRAS[0]).split(", ").map((s) => `${s} [data-abrir-pieza]`).join(", ")).first();
  if (!(await cap.count())) return p.linea(false, `${etiqueta} la captura de SAMER`, "no hay captura de SAMER con data-abrir-pieza");
  await cap.scrollIntoViewIfNeeded();
  await cap.tap();
  const abierta = await page.waitForSelector('.ficha[aria-modal="true"]', { timeout: 8000 }).then(
    () => true,
    () => false,
  );
  const u = await page.evaluate(() => ({ hash: location.hash, path: location.pathname, h: history.length }));
  p.linea(abierta && u.path === "/" && u.hash === "#pieza=samer" && u.h === h0 + 1, `${etiqueta} la ficha abre en /#pieza=samer con una entrada más`, `${abierta ? "abierta" : "no abrió"} · ${u.path}${u.hash} · history ${h0} -> ${u.h}`);
  if (abierta) {
    const f = await lib(page, "ficha");
    p.linea(f.wa.some((t) => typeof t === "string" && t.startsWith(SAMER_PREFIJO)), `${etiqueta} la ficha trae un wa.me con la frase de SAMER`, f.wa.length ? f.wa.map((t) => corta(t, 50)).join(" · ") : "ningún wa.me en la ficha");
    p.linea(!f.hechoCon, `${etiqueta} la ficha sin «HECHO CON»`, f.hechoCon ? "lo dice" : "");
  }
  await page.goBack({ timeout: 8000 }).catch(() => {});
  const vuelta = await hasta(() => page.evaluate(() => location.pathname === "/" && location.hash === "" && !document.querySelector(".ficha")), { ms: 3000 });
  const v = await page.evaluate(() => ({ url: location.pathname + location.hash, ficha: !!document.querySelector(".ficha") }));
  p.linea(vuelta, `${etiqueta} Atrás: la URL vuelve a / y no queda .ficha`, `${v.url}${v.ficha ? " · la .ficha sigue en el DOM" : ""}`);
}

/** Una carga medida: red y CPU limitadas, sin caché, cada pedido con su tamaño en la red. */
async function cargaMedida(p, perfil, { visita = false } = {}) {
  const { ctx, page, etiqueta } = await p.abrir({ vista: "390x2" });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: perfil.rtt, downloadThroughput: perfil.bajada, uploadThroughput: perfil.subida });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: perfil.cpu });
  const pedidos = new Map();
  let vivos = 0;
  let quieto = Date.now();
  cdp.on("Network.requestWillBeSent", (e) => {
    if (!pedidos.has(e.requestId)) vivos++;
    pedidos.set(e.requestId, { url: e.request.url, tipo: e.type, muro: e.wallTime * 1000, bytes: 0, listo: false });
  });
  cdp.on("Network.responseReceived", (e) => {
    const r = pedidos.get(e.requestId);
    if (!r) return;
    r.tipo = e.type || r.tipo;
    r.mime = e.response.mimeType;
    const h = e.response.headers || {};
    r.cod = h["content-encoding"] || h["Content-Encoding"] || "";
    // Lo recibido hasta aquí son las cabeceras: el cuerpo es lo que llega después.
    r.cabeceras = e.response.encodedDataLength || 0;
  });
  const fin = (e, ok) => {
    const r = pedidos.get(e.requestId);
    if (!r || r.listo) return;
    r.listo = true;
    if (ok) {
      r.bytes = e.encodedDataLength;
      r.cuerpo = Math.max(0, e.encodedDataLength - (r.cabeceras || 0));
    }
    vivos--;
    quieto = Date.now();
  };
  cdp.on("Network.loadingFinished", (e) => fin(e, true));
  cdp.on("Network.loadingFailed", (e) => fin(e, false));
  await ir(page, HOME, "load");
  // El LCP cuenta hasta el primer toque: se lee con la página ya ociosa.
  const carga = await page.evaluate(() => window.__e2e.carga);
  await esperarHasta(page, carga + 2600);
  const d = await page.evaluate(() => {
    const e = window.__e2e;
    return { lcp: e.lcp, pintadas: e.pintadas, largas: e.largas, loaf: e.loaf, ctx: e.ctx, carga: e.carga, ocio: e.ocio, origen: performance.timeOrigin };
  });
  await hasta(() => [...pedidos.values()].filter((r) => r.muro <= d.origen + (d.ocio ?? d.carga)).every((r) => r.listo), { ms: 15000 });
  const esJs = (r) => r.tipo === "Script" || /javascript|ecmascript/.test(r.mime || "");
  const iniciales = [...pedidos.values()].filter((r) => esJs(r) && r.muro <= d.origen + (d.ocio ?? d.carga));
  const res = {
    etiqueta,
    perfil: perfil.nombre,
    lcp: d.lcp.at(-1) || null,
    lcps: d.lcp,
    fcp: d.pintadas.find((x) => x.n === "first-contentful-paint")?.t ?? null,
    // Cada tarea larga de los 2 s tras el load, con quién la hizo y cuánto de ella fue crear el contexto WebGL.
    largas: d.largas
      .filter((x) => x.t >= d.carga && x.t <= d.carga + 2000 && x.d > 100)
      .map((x) => {
        const gl = d.ctx.filter((c) => c.t >= x.t - 1 && c.t + c.d <= x.t + x.d + 1).reduce((a, c) => a + c.d, 0);
        return { ...x, gl, de: (d.loaf.find((f) => f.t <= x.t + 1 && f.t + f.d >= x.t + x.d - 1) || { de: [] }).de.join(" + ") };
      }),
    contextos: d.ctx,
    carga: d.carga,
    ocio: d.ocio,
    // «KB gz» es el JavaScript comprimido: los cuerpos. Las cabeceras HTTP (unos 430 B por respuesta con
    // HTTP/1.1 de next start; casi nada con HTTP/2, donde HPACK las indexa) no son JS: se informan aparte.
    jsInicial: iniciales.reduce((a, r) => a + (r.cuerpo ?? r.bytes), 0),
    jsConCabeceras: iniciales.reduce((a, r) => a + r.bytes, 0),
    jsLista: iniciales.map((r) => `${r.url.replace(BASE, "")} ${((r.cuerpo ?? r.bytes) / KB).toFixed(1)}`),
    comprimido: iniciales.some((r) => /gzip|br|zstd/.test(r.cod || "")),
  };
  if (visita) {
    // La visita entera: la escena (three.js), la respuesta, cada imagen al bajar. El CPU ya no importa para los bytes.
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await hasta(() => lib(page, "atributo", "#inicio", "data-cerrado"), { ms: 10000 });
    await recorrer(page, 0.7, false);
    await hasta(() => vivos <= 0 && Date.now() - quieto > 1500, { ms: 60000, cada: 100 });
    const todos = [...pedidos.values()].filter((r) => !r.url.startsWith("data:"));
    const porTipo = {};
    for (const r of todos) porTipo[r.tipo || "?"] = (porTipo[r.tipo || "?"] || 0) + r.bytes;
    res.visita = todos.reduce((a, r) => a + r.bytes, 0);
    res.porTipo = Object.fromEntries(Object.entries(porTipo).map(([k, v]) => [k, +(v / KB).toFixed(1)]));
    res.pedidos = todos.length;
  }
  return res;
}

/** [lcp] El H1 es el LCP; Slow 4G: LCP ≤ 3 s y FCP ≤ 1.5 s con el H1; Fast 4G: LCP ≤ 2 s; sin tareas largas; los bytes. */
async function lcp(p) {
  p.info("servidor", "estas cifras solo valen contra el servidor de producción (pnpm build y node .next/standalone/server.js: ver la cabecera del script)");
  const html = await fetch(HOME).then(
    (r) => r.text(),
    () => "",
  );
  if (/hmr-client|react-refresh|webpack-hmr|__nextDevClientId|_next\/static\/development/.test(html)) p.info("AVISO", "BASE_URL parece `next dev`: las cifras de velocidad de abajo no valen");
  const lenta = await cargaMedida(p, PERFILES.lenta);
  const rapida = await cargaMedida(p, PERFILES.rapida, { visita: true });
  const s = (t) => (t === null || t === undefined ? "?" : `${(t / 1000).toFixed(2)} s`);
  for (const r of [lenta, rapida]) {
    p.linea(!!r.lcp && r.lcp.enH1, `${r.etiqueta} ${r.perfil}: el LCP está dentro del H1`, r.lcp ? `${r.lcp.el} ${corta(r.lcp.texto, 30)} a ${s(r.lcp.t)}` : "ningún LCP");
  }
  p.linea(!!lenta.lcp && lenta.lcp.t <= 3000, `${lenta.etiqueta} ${lenta.perfil}: LCP <= 3.0 s`, s(lenta.lcp?.t));
  const h1Pintado = lenta.lcps.find((x) => x.enH1);
  p.linea(lenta.fcp !== null && lenta.fcp <= 1500 && !!h1Pintado && h1Pintado.t <= lenta.fcp + 20, `${lenta.etiqueta} ${lenta.perfil}: FCP <= 1.5 s con el H1 pintado`, `FCP ${s(lenta.fcp)}, H1 pintado a ${s(h1Pintado?.t)}`);
  p.linea(!!rapida.lcp && rapida.lcp.t <= 2000, `${rapida.etiqueta} ${rapida.perfil}: LCP <= 2.0 s`, s(rapida.lcp?.t));
  for (const r of [lenta, rapida]) {
    // Crear el contexto WebGL en SwiftShader (la GPU de software de este entorno) no mide un teléfono: ese tramo se descuenta y se dice.
    const malas = r.largas.filter((x) => x.d - x.gl > 100);
    const fmt = (x) => `${Math.round(x.d)} ms a ${Math.round(x.t)} ms${x.gl >= 1 ? `, ${Math.round(x.gl)} ms de getContext WebGL` : ""}${x.de ? ` (${x.de})` : ""}`;
    p.linea(malas.length === 0, `${r.etiqueta} ${r.perfil}: ninguna tarea larga > 100 ms en los 2 s después de load (sin contar crear el contexto WebGL)`, r.largas.length ? `${malas.length ? "" : "solo por el contexto WebGL: "}${r.largas.map(fmt).join(", ")}` : `load a ${s(r.carga)}`);
  }
  p.linea(lenta.jsInicial <= 150 * KB, `${lenta.etiqueta} JS inicial antes del ocio <= 150 KB${lenta.comprimido ? " gz" : " (el servidor NO comprime: bytes sin gzip)"}`, `${(lenta.jsInicial / KB).toFixed(1)} KB en ${lenta.jsLista.length} scripts, ${(lenta.jsConCabeceras / KB).toFixed(1)} KB con sus cabeceras HTTP (ocio a ${s(lenta.ocio)})`, lenta.jsLista);
  p.linea(rapida.visita <= 650 * KB, `${rapida.etiqueta} la visita entera <= 650 KB transferidos`, `${(rapida.visita / KB).toFixed(1)} KB en ${rapida.pedidos} pedidos (${Object.entries(rapida.porTipo).map(([k, v]) => `${k} ${v}`).join(", ")})`);
}

/** [objetivos] Cada enlace y botón visible del celular mide al menos 44 x 44. */
async function objetivos(p) {
  const { page, etiqueta } = await p.abrir({ vista: "390", reduce: true });
  await ir(page);
  await recorrer(page);
  const r = await lib(page, "objetivos");
  p.linea(r.n > 0 && r.malos.length === 0, `${etiqueta} enlaces y botones >= 44x44`, r.malos.length ? `${r.malos.length}/${r.n} chicos: ${r.malos.slice(0, 6).join(" · ")}` : `${r.n}/${r.n}`, r.malos.length ? r.malos : undefined);
}

/** [honestidad] REI dice «Datos de ejemplo»; las etiquetas Mío/Cliente; nada de «US$», la raya larga (U+2014) ni «móvil». */
async function honestidad(p) {
  const { page, etiqueta } = await p.abrir({ vista: "390", reduce: true });
  await ir(page);
  await recorrer(page);
  const r = await lib(page, "honestidad", OBRAS);
  const rei = r.obras.find((o) => o.id === "rei-fm");
  p.linea(rei.existe && rei.nota, `${etiqueta} REI muestra «Datos de ejemplo»`, rei.existe ? (rei.nota ? "" : "no se ve") : "no hay article de REI");
  for (const o of r.obras) p.linea(o.existe && o.tagVisto === o.tag, `${etiqueta} ${o.nombre} lleva «${o.tag}»`, o.existe ? (o.tagVisto === null ? "sin .obra-tag a la vista" : corta(o.tagVisto)) : "no hay article");
  p.linea(r.us.length === 0, `${etiqueta} ningún texto con «US$»`, r.us.map((x) => corta(x, 40)).join(" · "));
  p.linea(r.raya.length === 0, `${etiqueta} nada en pantalla con la raya larga (U+2014)`, r.raya.map((x) => corta(x, 40)).join(" · "));
  p.linea(r.movil.length === 0, `${etiqueta} nada en pantalla con «móvil»`, r.movil.map((x) => corta(x, 40)).join(" · "));
}

const PRUEBAS = {
  palabras: [palabras, 90_000],
  pulgar: [pulgar, 150_000],
  azul: [azul, 150_000],
  prefill: [prefill, 120_000],
  toque: [toque, 60_000],
  solo: [solo, 60_000],
  quieto: [quieto, 90_000],
  reducido: [reducido, 45_000],
  "sin-webgl": [sinWebgl, 60_000],
  "sin-js": [sinJs, 45_000],
  cls: [cls, 150_000],
  desborde: [desborde, 180_000],
  atras: [atras, 60_000],
  lcp: [lcp, 360_000],
  objetivos: [objetivos, 60_000],
  honestidad: [honestidad, 60_000],
};

async function correr(nombre) {
  const [fn, limite] = PRUEBAS[nombre];
  const p = new Prueba(nombre);
  const t0 = Date.now();
  let error = null;
  // Una prueba que se pasa de su tiempo sigue en el fondo hasta que se cierran sus contextos: su rechazo no importa.
  const trabajo = Promise.resolve().then(() => fn(p));
  trabajo.catch(() => {});
  let reloj;
  const tope = new Promise((_, no) => {
    reloj = setTimeout(() => no(new Error(`tiempo agotado (${limite / 1000} s)`)), limite);
  });
  try {
    await Promise.race([trabajo, tope]);
  } catch (e) {
    error = String(e?.stack || e);
    p.linea(false, "la prueba no terminó", String(e?.message || e).split("\n")[0].slice(0, 300), error.split("\n").slice(0, 8).join("\n"));
  } finally {
    clearTimeout(reloj);
    if (p.bloqueados.length) p.info("pedidos fuera de localhost abortados", `${p.bloqueados.length}: ${[...new Set(p.bloqueados)].slice(0, 5).join(", ")}`);
    if (p.errores.length) p.info("errores de la página", `${p.errores.length}: ${[...new Set(p.errores)].slice(0, 3).join(" | ")}`);
    await p.cerrar();
  }
  return { nombre, ok: !p.lineas.some((l) => l.ok === false), ms: Date.now() - t0, lineas: p.lineas, error, bloqueados: [...new Set(p.bloqueados)], errores: [...new Set(p.errores)] };
}

async function principal() {
  if (argv.includes("--lista")) {
    console.log(Object.keys(PRUEBAS).join("\n"));
    return 0;
  }
  const nombres = SOLO ? SOLO : Object.keys(PRUEBAS);
  const desconocidas = nombres.filter((n) => !PRUEBAS[n]);
  if (desconocidas.length) {
    console.error(`No conozco: ${desconocidas.join(", ")}. Hay: ${Object.keys(PRUEBAS).join(", ")}`);
    return 1;
  }
  const t0 = Date.now();
  console.log(`e2e «Te toca» contra ${HOME} · ${new Date().toISOString()}`);
  const vivo = await fetch(HOME, { signal: AbortSignal.timeout(15000) }).then(
    (r) => r.status,
    (e) => String(e?.cause?.code || e?.message || e),
  );
  if (vivo !== 200) {
    console.log(`FAIL [servidor] ${HOME} no responde 200: ${vivo}`);
    return 1;
  }
  const informe = [];
  for (const n of nombres) informe.push(await correr(n));
  await Promise.all(Object.values(navegadores).map((b) => b.close().catch(() => {})));
  const lineas = informe.flatMap((r) => r.lineas);
  const pasan = lineas.filter((l) => l.ok === true).length;
  const fallan = lineas.filter((l) => l.ok === false).length;
  const malas = informe.filter((r) => !r.ok).map((r) => r.nombre);
  console.log(`\n${fallan ? "FAIL" : "PASS"} · ${pasan} PASS · ${fallan} FAIL · ${((Date.now() - t0) / 1000).toFixed(0)} s${malas.length ? ` · fallan: ${malas.join(", ")}` : ""}`);
  if (SALIDA) {
    const datos = { base: HOME, fecha: new Date().toISOString(), nota: "Las cifras de [lcp] solo valen contra el servidor de producción.", resumen: { pasan, fallan, malas }, pruebas: informe };
    writeFileSync(SALIDA, `${JSON.stringify(datos, null, 2)}\n`);
    console.log(`informe: ${SALIDA}`);
  }
  return fallan ? 1 : 0;
}

principal().then(
  (codigo) => process.exit(codigo),
  async (e) => {
    console.error(`FAIL [e2e] ${e?.stack || e}`);
    await Promise.all(Object.values(navegadores).map((b) => b.close().catch(() => {})));
    process.exit(1);
  },
);
