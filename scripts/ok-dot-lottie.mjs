/**
 * Genera `public/lottie/ok-dot.json`: el punto de allok como máquina de estados.
 *
 *   ○  esperando   anillo que respira
 *   ◌  procesando  anillo con un hueco que gira
 *   ●  resuelto    relleno que entra con un golpe y se queda
 *
 * Un solo archivo con tres segmentos, no tres archivos: el punto tiene que
 * poder *transicionar* entre estados sin cortar, y eso sólo se consigue en una
 * línea de tiempo continua. El componente reproduce el tramo que toca.
 *
 *   node scripts/ok-dot-lottie.mjs          escribe el archivo
 *   node scripts/ok-dot-lottie.mjs --check  falla si el del repo no coincide
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const FR = 60;
const OUT = "public/lottie/ok-dot.json";

/** #20E58D, en el 0-1 que pide Lottie. */
const OK = [32 / 255, 229 / 255, 141 / 255, 1];

/** Los tres tramos, en fotogramas. El componente los conoce por nombre. */
export const SEGMENTS = {
  esperando: [0, 60],
  procesando: [60, 120],
  resuelto: [120, 165],
};
const OP = 165;

const ease = { i: { x: [0.23], y: [1] }, o: { x: [0.32], y: [0] } };
const kf = (frames) =>
  frames.map(([t, s], n) => (n === frames.length - 1 ? { t, s } : { t, s, ...ease }));
const anim = (frames) => ({ a: 1, k: kf(frames) });
const fixed = (k) => ({ a: 0, k });

const tr = (extra = {}) => ({
  ty: "tr",
  p: fixed([0, 0]),
  a: fixed([0, 0]),
  s: fixed([100, 100]),
  r: fixed(0),
  o: fixed(100),
  ...extra,
});

function layer(ind, nm, shapes, ks = {}) {
  return {
    ddd: 0, ind, ty: 4, nm, sr: 1, ao: 0, bm: 0, ip: 0, op: OP, st: 0,
    ks: {
      o: fixed(100), r: fixed(0), p: fixed([32, 32, 0]),
      a: fixed([0, 0, 0]), s: fixed([100, 100, 100]), ...ks,
    },
    shapes,
  };
}

/* ── El anillo. Respira de 0 a 60, gira con un hueco de 60 a 120 y se
      desvanece cuando entra el relleno. ────────────────────────────────── */
const ring = layer(
  1,
  "anillo",
  [
    {
      ty: "gr", nm: "g", np: 3, hd: false,
      it: [
        { ty: "el", p: fixed([0, 0]), s: fixed([36, 36]), d: 1 },
        // El hueco: el recorte arranca cerrado, se abre para "procesando"
        // y vuelve a cerrarse. `o` girando es lo que hace que el hueco viaje.
        {
          ty: "tm", m: 1, s: fixed(0),
          e: anim([[0, [100]], [60, [100]], [78, [72]], [110, [72]], [120, [100]]]),
          o: anim([[0, [0]], [60, [0]], [120, [720]]]),
        },
        { ty: "st", c: fixed(OK), o: fixed(100), w: fixed(5), lc: 2, lj: 1 },
        tr(),
      ],
    },
  ],
  {
    // Respirar: escala y opacidad, sólo en el primer tramo.
    s: anim([[0, [86, 86, 100]], [30, [104, 104, 100]], [60, [92, 92, 100]], [120, [100, 100, 100]], [140, [124, 124, 100]]]),
    o: anim([[0, [55]], [30, [100]], [60, [80]], [120, [100]], [134, [0]]]),
  },
);

/* ── El relleno. No existe hasta el final: entra pasado de rosca y asienta. */
const fill = layer(
  2,
  "relleno",
  [
    {
      ty: "gr", nm: "g", np: 2, hd: false,
      it: [
        { ty: "el", p: fixed([0, 0]), s: fixed([36, 36]), d: 1 },
        { ty: "fl", c: fixed(OK), o: fixed(100), r: 1 },
        tr(),
      ],
    },
  ],
  {
    s: anim([[0, [0, 0, 100]], [118, [0, 0, 100]], [136, [118, 118, 100]], [150, [96, 96, 100]], [158, [100, 100, 100]]]),
    o: anim([[0, [0]], [118, [0]], [126, [100]]]),
  },
);

const doc = {
  v: "5.7.4", fr: FR, ip: 0, op: OP, w: 64, h: 64, nm: "allok-ok-dot",
  ddd: 0, assets: [], layers: [fill, ring],
  markers: Object.entries(SEGMENTS).map(([cm, [tm]]) => ({ tm, cm, dr: 0 })),
};

const json = JSON.stringify(doc, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const same = existsSync(OUT) && readFileSync(OUT, "utf8") === json;
  console.log(same ? "ok-dot.json al día" : "ok-dot.json DESFASADO — corre el script sin --check");
  process.exit(same ? 0 : 1);
}
writeFileSync(OUT, json);
console.log(`${OUT} · ${OP} fotogramas · ${Object.keys(SEGMENTS).join(" → ")}`);
