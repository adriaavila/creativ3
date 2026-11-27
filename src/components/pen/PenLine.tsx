"use client";

import { useEffect, useRef } from "react";
import { GLYPHS, inkMeters, traceLine, type Box, type Gesture, type GlyphId, type Point, type Stroke } from "@/lib/pen-linea";

/**
 * La línea de /pen. Se monta como hija directa de `.pen` y lee la página por
 * sus marcas: cualquier elemento con `data-pen="start | strike | draw |
 * underline | rule | wrap | weave | loop"` es un gesto, en el orden del documento.
 * Mide, pide la geometría a `traceLine` y la revela con el scroll: la punta
 * va donde va la lectura. En la portada, con mouse, la pluma es de quien
 * visita hasta que baja.
 *
 * Sin movimiento (prefers-reduced-motion) la línea sale entera y quieta.
 */

const NS = "http://www.w3.org/2000/svg";
/** Lo más que alguien puede dibujar en la portada, en píxeles de trazo. */
const HAND_MAX = 5200;

type Seg = {
  path: SVGPathElement;
  d: string;
  stroke: Stroke;
  len: number;
  start: number;
  top: number;
  bottom: number;
  /** El tramo se dibuja mientras el renglón de lectura baja de `a` a `b`. */
  a: number;
  b: number;
  drawn: number;
  target: Element | null;
  done: boolean;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function PenLine() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    const root = svg?.parentElement;
    if (!svg || !root) return;
    const ink = svg.querySelector<SVGGElement>("[data-ink]")!;
    const ghost = svg.querySelector<SVGPathElement>("[data-ghost]")!;
    const tip = svg.querySelector<SVGGElement>("[data-tip]")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

    let segs: Seg[] = [];
    let gestures: Gesture[] = [];
    /** Por gesto: su elemento, o sus piezas si es un tejido. */
    let targets: (Element | Element[] | null)[] = [];
    let handIndex = -1;
    let lanes: { left: number; right: number } | undefined;
    let total = 0;
    let base = 0;
    let l = 0;
    let alive = true;
    let raf = 0;
    let timer = 0;
    let meterText = "";

    const hand: Point[] = [];
    let handLen = 0;
    let handDirty = false;

    function measure() {
      const origin = root!.getBoundingClientRect();
      const box = (r: { left: number; top: number; width: number; height: number }): Box => ({
        x: r.left - origin.left,
        y: r.top - origin.top,
        w: r.width,
        h: r.height,
      });
      /** Los renglones de un texto, uno por línea visual. */
      const linesOf = (el: Element): Box[] => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const rows: { left: number; top: number; right: number; bottom: number }[] = [];
        for (const r of range.getClientRects()) {
          if (r.width < 2 || r.height < 2) continue;
          const last = rows[rows.length - 1];
          const mid = r.top + r.height / 2;
          if (last && mid > last.top && mid < last.bottom) {
            last.left = Math.min(last.left, r.left);
            last.right = Math.max(last.right, r.right);
            last.top = Math.min(last.top, r.top);
            last.bottom = Math.max(last.bottom, r.bottom);
          } else {
            rows.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
          }
        }
        return rows.map((r) => box({ left: r.left, top: r.top, width: r.right - r.left, height: r.bottom - r.top }));
      };

      // Los márgenes: por ahí baja la línea cuando lo que sigue queda lejos.
      const column = root!.querySelector<HTMLElement>("[data-pen-column]");
      lanes = undefined;
      if (column) {
        const c = column.getBoundingClientRect();
        const style = getComputedStyle(column);
        const left = c.left - origin.left + parseFloat(style.paddingLeft);
        const right = c.right - origin.left - parseFloat(style.paddingRight);
        const air = clamp(left * 0.45, 9, 44);
        lanes = { left: left - air, right: right + air };
      }

      gestures = [];
      targets = [];
      handIndex = -1;
      for (const el of root!.querySelectorAll<HTMLElement>("[data-pen]")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        const kind = el.dataset.pen;
        if (kind === "start") {
          const word = el.querySelector("em") ?? el;
          gestures.push({ kind: "start", box: box(r), word: box(word.getBoundingClientRect()) });
          targets.push(el);
          // Justo después del arranque va lo que dibuje quien visita.
          gestures.push({ kind: "hand", points: hand });
          targets.push(null);
          handIndex = gestures.length - 1;
        } else if (kind === "strike") {
          const from = el.dataset.penFrom;
          gestures.push({ kind: "strike", lines: linesOf(el), from: from === "left" || from === "right" ? from : undefined });
          targets.push(el);
        } else if (kind === "draw") {
          const name = el.dataset.glyph as GlyphId;
          gestures.push({ kind: "draw", box: box(r), glyph: GLYPHS.includes(name) ? name : "loop" });
          targets.push(el);
        } else if (kind === "underline") {
          const lines = linesOf(el);
          const line = lines[lines.length - 1];
          if (!line) continue;
          gestures.push({ kind: "underline", line, top: lines[0]!.y });
          targets.push(el);
        } else if (kind === "rule") {
          gestures.push({ kind: "rule", box: box(r) });
          targets.push(el);
        } else if (kind === "wrap") {
          gestures.push({ kind: "wrap", box: box(r) });
          targets.push(el);
        } else if (kind === "weave") {
          const tiles = [...el.querySelectorAll<HTMLElement>("[data-pen-tile]")];
          const rows: Box[][] = [];
          let rowTop = -Infinity;
          for (const tile of tiles) {
            const b = box(tile.getBoundingClientRect());
            if (Math.abs(b.y - rowTop) > 12) {
              rows.push([]);
              rowTop = b.y;
            }
            rows[rows.length - 1]!.push(b);
          }
          gestures.push({ kind: "weave", rows });
          targets.push(tiles);
        } else if (kind === "loop") {
          gestures.push({ kind: "loop", box: box(r) });
          targets.push(el);
        }
      }
    }

    function apply(strokes: Stroke[]) {
      if (strokes.length !== segs.length) {
        ink.replaceChildren();
        segs = strokes.map((stroke) => {
          const path = document.createElementNS(NS, "path");
          ink.appendChild(path);
          return { path, d: "", stroke, len: 0, start: 0, top: 0, bottom: 0, a: 0, b: 0, drawn: -1, target: null, done: false };
        });
      }
      let acc = 0;
      base = 0;
      segs.forEach((seg, i) => {
        const stroke = strokes[i]!;
        if (seg.d !== stroke.d) {
          seg.d = stroke.d;
          seg.path.setAttribute("d", stroke.d);
          seg.len = seg.path.getTotalLength();
          // El hueco es más largo que el trazo: una punta redonda no asoma antes de tiempo.
          seg.path.style.strokeDasharray = `${seg.len} ${seg.len + 8}`;
          const bb = seg.path.getBBox();
          seg.top = bb.y;
          seg.bottom = bb.y + bb.height;
          seg.drawn = -1;
        }
        seg.stroke = stroke;
        seg.path.setAttribute("class", stroke.ink === "blue" ? "pen-ink is-blue" : "pen-ink");
        seg.start = acc;
        acc += seg.len;
        const prev = segs[i - 1];
        seg.a = prev ? prev.b : seg.top;
        seg.b = Math.max(seg.a, seg.bottom);
        const t = stroke.mark ? targets[stroke.mark.gesture] : null;
        seg.target = stroke.mark && Array.isArray(t) ? (t[stroke.mark.tile ?? -1] ?? null) : ((t as Element | null) ?? null);
        if (stroke.kind === "start" || stroke.kind === "hand") base = acc;
      });
      total = acc;
      // El lápiz: la ruta que falta, apenas visible debajo de la tinta.
      ghost.setAttribute(
        "d",
        strokes
          .filter((s) => s.kind !== "start" && s.kind !== "hand")
          .map((s) => s.d)
          .join(""),
      );
    }

    function retrace() {
      if (handIndex >= 0) gestures[handIndex] = { kind: "hand", points: hand };
      const narrow = innerWidth < 760;
      apply(traceLine(gestures, { pad: narrow ? 8 : 14, lanes, laneAfter: narrow ? 150 : 320 }));
    }

    function build() {
      measure();
      for (const seg of segs) {
        seg.target?.classList.remove("is-inked");
        seg.done = false;
        seg.d = "";
      }
      retrace();
      if (reduced) l = total;
      l = Math.min(l, total);
      render();
    }

    /** Del renglón de lectura (en píxeles de la página) a cuánta línea toca tener dibujada. */
    function lengthAt(readY: number) {
      for (const seg of segs) {
        if (seg.start + seg.len <= base) continue;
        if (readY < seg.b) {
          if (readY <= seg.a) return seg.start;
          return seg.start + (seg.len * (readY - seg.a)) / (seg.b - seg.a);
        }
      }
      return total;
    }

    function render() {
      let head: Seg | undefined;
      for (const seg of segs) {
        const drawn = clamp(l - seg.start, 0, seg.len);
        if (drawn !== seg.drawn) {
          seg.drawn = drawn;
          seg.path.style.strokeDashoffset = String(seg.len - drawn);
          seg.path.style.visibility = drawn > 0.05 ? "visible" : "hidden";
        }
        const done = seg.len > 0 && drawn >= seg.len - 0.5;
        if (done !== seg.done) {
          seg.done = done;
          seg.target?.classList.toggle("is-inked", done);
        }
        if (seg.start <= l && seg.len > 0) head = seg;
      }
      if (head) {
        const p = head.path.getPointAtLength(clamp(l - head.start, 0, head.len));
        tip.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
        tip.style.visibility = reduced ? "hidden" : "visible";
      }
      const text = `${inkMeters(l).toFixed(1)} m`;
      if (text !== meterText) {
        meterText = text;
        const meter = root!.querySelector("[data-pen-meter]");
        if (meter) meter.textContent = text;
      }
    }

    function frame() {
      if (!alive) return;
      if (handDirty) {
        handDirty = false;
        retrace();
        // Lo que se dibuja con el mouse no espera: la tinta va con la mano.
        l = base;
      }
      if (!reduced && segs.length > 0) {
        const vh = innerHeight;
        const sy = scrollY;
        const max = Math.max(0, document.documentElement.scrollHeight - vh);
        // En la última pantalla el renglón de lectura baja hasta el borde: la línea llega al final de la página.
        const t = max > 0 ? clamp((sy - (max - vh)) / vh, 0, 1) : 1;
        const readY = sy + vh * (0.66 + 0.34 * t) - (root!.getBoundingClientRect().top + sy);
        let target = Math.max(base, lengthAt(readY));
        if (max > 0 && sy >= max - 2) target = total;
        if (l < base) {
          // El arranque se dibuja a su ritmo, no al del scroll.
          l = Math.min(base, l + Math.max(5, base / 90));
        } else {
          const diff = target - l;
          l = Math.abs(diff) < 0.5 ? target : l + Math.sign(diff) * Math.max(Math.abs(diff) * 0.1, Math.min(Math.abs(diff), 9));
        }
        render();
      }
      raf = requestAnimationFrame(frame);
    }

    function schedule() {
      clearTimeout(timer);
      timer = window.setTimeout(() => alive && build(), 120);
    }

    function onMove(e: PointerEvent) {
      if (reduced || !fine || e.pointerType !== "mouse" || scrollY > 60) return;
      const pad = root!.querySelector<HTMLElement>("[data-pen-pad]");
      if (!pad || (hand.length === 0 && l < base - 1)) return;
      const area = pad.getBoundingClientRect();
      if (e.clientY < area.top + 72 || e.clientY > area.bottom - 12) return;
      const origin = root!.getBoundingClientRect();
      const p = { x: e.clientX - origin.left, y: e.clientY - origin.top };
      const last = hand[hand.length - 1];
      if (last) {
        const step = Math.hypot(p.x - last.x, p.y - last.y);
        if (step < 7 || handLen + step > HAND_MAX) return;
        handLen += step;
      }
      hand.push(p);
      handDirty = true;
      root!.classList.add("has-hand");
    }

    /** Algo nuevo apareció (la ficha de «Your turn»): se vuelve a medir y la línea lo dibuja desde su principio. */
    function onRedraw(e: Event) {
      clearTimeout(timer);
      build();
      const within = (e as CustomEvent<Element | null>).detail;
      if (!within || reduced) return;
      const first = segs.findIndex((seg) => seg.target && within.contains(seg.target));
      if (first > 0) l = Math.min(l, segs[first - 1]!.start);
    }

    build();
    raf = requestAnimationFrame(frame);
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    document.fonts?.ready.then(() => alive && build());
    addEventListener("resize", schedule);
    addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pen:redraw", onRedraw);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      observer.disconnect();
      removeEventListener("resize", schedule);
      removeEventListener("pointermove", onMove);
      root.removeEventListener("pen:redraw", onRedraw);
    };
  }, []);

  return (
    <svg ref={ref} className="pen-line" aria-hidden="true" focusable="false">
      <path data-ghost className="pen-ghost" />
      <g data-ink />
      <g data-tip className="pen-tip" style={{ visibility: "hidden" }}>
        <circle r="11" className="pen-tip-halo" />
        <circle r="4.5" className="pen-tip-dot" />
      </g>
    </svg>
  );
}
