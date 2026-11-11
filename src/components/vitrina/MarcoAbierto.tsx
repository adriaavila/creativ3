import { vars } from "@/components/ak/Brand";
import tokens from "@/styles/allok/tokens.json";

type Curva = [number, number, number, number];

// La curva del dibujo es el --ease-in-out del sistema, leída del token: si el token cambia, el marco lo sigue.
const EASE_IN_OUT = ((): Curva => {
  const valor = tokens.easing.tokens.find((t) => t.name === "ease-in-out")?.value ?? "";
  const n = (/cubic-bezier\(([^)]+)\)/.exec(valor)?.[1] ?? "").split(",").map(Number);
  return n.length === 4 && n.every(Number.isFinite) ? (n as Curva) : [0.65, 0, 0.35, 1];
})();

const cubica = (s: number, a: number, b: number) => 3 * (1 - s) ** 2 * s * a + 3 * (1 - s) * s * s * b + s ** 3;
const css = (c: Curva) => `cubic-bezier(${c.map((v) => +v.toFixed(4)).join(", ")})`;
const r4 = (v: number) => +v.toFixed(4);

/**
 * Una mitad del marco son dos lados seguidos con UNA sola curva: la pluma no
 * frena en la esquina. Se parte la curva (de Casteljau) justo donde el trazo
 * llega a la esquina, `f` del largo, y cada lado se lleva su trozo de tiempo
 * (`t`, de 0 a 1) y su trozo de curva, renormalizado a cubic-bezier.
 */
function partir(f: number): { t: number; antes: string; despues: string } {
  const [x1, y1, x2, y2] = EASE_IN_OUT;
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    if (cubica(m, y1, y2) < f) lo = m;
    else hi = m;
  }
  const s = (lo + hi) / 2;
  const mezcla = (a: [number, number], b: [number, number]): [number, number] => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
  const p0: [number, number] = [0, 0];
  const p1: [number, number] = [x1, y1];
  const p2: [number, number] = [x2, y2];
  const p3: [number, number] = [1, 1];
  const q0 = mezcla(p0, p1);
  const q1 = mezcla(p1, p2);
  const q2 = mezcla(p2, p3);
  const r0 = mezcla(q0, q1);
  const r1 = mezcla(q1, q2);
  const [xs, ys] = mezcla(r0, r1);
  const limita = (v: number) => Math.min(1, Math.max(0, v));
  return {
    t: xs,
    antes: css([limita(q0[0] / xs), q0[1] / ys, limita(r0[0] / xs), r0[1] / ys]),
    despues: css([limita((r1[0] - xs) / (1 - xs)), (r1[1] - ys) / (1 - ys), limita((q2[0] - xs) / (1 - xs)), (q2[1] - ys) / (1 - ys)]),
  };
}

const LADOS = [
  ["arriba", "M0 .5H1"],
  ["derecha", "M.5 0V1"],
  ["izquierda", "M.5 0V1"],
  ["abajo", "M0 .5H1"],
] as const;

/**
 * El marco de cada trabajo: un rectángulo de esquinas rectas que se dibuja
 * solo desde su esquina de arriba a la izquierda, en dos trazos a la vez
 * (arriba y después la derecha, en el sentido del reloj; la izquierda y
 * después abajo), que llegan juntos a la esquina de abajo a la derecha y la
 * dejan ABIERTA: ahí cierra la marca de 24 px, como las dos manos de la
 * portada cierran el lazo entre los dedos.
 *
 * Cada lado es su propio SVG estirado sobre su borde (viewBox de 1, sin
 * proporción): el grueso y el hueco de la esquina quedan exactos en px en
 * cualquier tamaño, sin JavaScript. `proporcion` (ancho entre alto) dice dónde
 * cae cada esquina para repartir los 700 ms; `retraso` corre el dibujo entero
 * (la segunda pantalla de Mística, 120 ms).
 */
export default function MarcoAbierto({ proporcion, retraso = 0 }: { proporcion: number; retraso?: number }) {
  const horario = partir(proporcion / (proporcion + 1)); // arriba, después la derecha
  const contra = partir(1 / (proporcion + 1)); // la izquierda, después abajo
  const tiempo: Record<(typeof LADOS)[number][0], Record<string, string | number>> = {
    arriba: { "--trazo-0": 0, "--trazo-f": r4(horario.t), "--trazo-e": horario.antes },
    derecha: { "--trazo-0": r4(horario.t), "--trazo-f": r4(1 - horario.t), "--trazo-e": horario.despues },
    izquierda: { "--trazo-0": 0, "--trazo-f": r4(contra.t), "--trazo-e": contra.antes },
    abajo: { "--trazo-0": r4(contra.t), "--trazo-f": r4(1 - contra.t), "--trazo-e": contra.despues },
  };
  return (
    <span className="marco" data-reveal="draw" data-threshold="0.6" aria-hidden="true" style={vars({ "--d": `${retraso}ms`, "--i": 0 })}>
      {LADOS.map(([lado, d]) => (
        <svg key={lado} className={`marco-lado marco-${lado}`} viewBox="0 0 1 1" preserveAspectRatio="none" focusable="false">
          <path className="trazo" pathLength={1} d={d} style={vars(tiempo[lado])} />
        </svg>
      ))}
    </span>
  );
}
