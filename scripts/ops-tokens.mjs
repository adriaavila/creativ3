/**
 * Pasa la superficie de Ops de color escrito a mano a tokens de Dawn → Dusk.
 *
 * Existe como script y no como una tanda de ediciones porque eran 823 colores
 * en 218 valores distintos: a mano se cuela un criterio distinto cada veinte
 * líneas. Es idempotente y corre desde HEAD, así que se puede repetir cuando
 * el clasificador mejore.
 *
 *   node scripts/ops-tokens.mjs --check   → sólo informa, no escribe
 *   node scripts/ops-tokens.mjs           → aplica
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const CHECK = process.argv.includes("--check");
const DIRS = ["src/components/ops", "src/app/ops", "src/app/ops-login"];

/** Un hex con el modificador de opacidad de Tailwind no sobrevive a var():
 *  Tailwind no puede calcular el alfa de una variable. El alfa va dentro. */
const ALPHA = {
  "bg-[#c5f04a]/10": "bg-[var(--assist-dim)]",
  "bg-[#c5f04a]/20": "bg-[var(--assist-dim)]",
  "bg-[#c5f04a]/25": "bg-[var(--assist-dim)]",
  "border-[#c5f04a]/20": "border-[var(--assist-line)]",
  "border-[#c5f04a]/25": "border-[var(--assist-line)]",
  "border-[#c5f04a]/60": "border-[var(--assist-line)]",
  "text-[#c5f04a]/60": "text-[var(--assist-ink)]",
  "bg-[#a1a1a3]/8": "bg-[var(--ground-3)]",
  "border-[#a1a1a3]/25": "border-[var(--hairline)]",
  "bg-[#142b4b]/20": "bg-[var(--scrim)]",
  "bg-[#08090a]/70": "bg-[var(--scrim-void)]",
  "from-[#08090a]/70": "from-[var(--scrim-void)]",
  "to-[#08090a]/70": "to-[var(--scrim-void)]",
};

const INK_PREFIX = new Set(["text", "fill", "stroke", "decoration", "caret", "placeholder", "marker"]);
const LINE_PREFIX = new Set(["border", "divide", "outline", "ring"]);
const BG_PREFIX = new Set(["bg", "accent", "from", "via", "to", "shadow"]);

function rgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function luminance(hex) {
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = rgb(hex);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
/**
 * Croma, no saturación. La saturación HLS de un color muy claro tiende a 1
 * (#fff3df da 1,00), así que separar «relleno de marca» de «relleno suave» con
 * ella manda el verde lima al pálido. La distancia max-min no miente.
 */
function chroma(hex) {
  const [r, g, b] = rgb(hex);
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}
function hueSat(hex) {
  const [r, g, b] = rgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return [0, 0];
  const l = (max + min) / 2;
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [((h * 60) + 360) % 360, s];
}

/**
 * El papel que cumple un color, no su valor. Tres paletas distintas sólo caen
 * en una si se clasifica por función.
 *
 * El ámbar tiene su propia banda porque es el ÚNICO matiz que en Ops significa
 * algo: "requiere revisión". Sin ella cae en la rampa de luminancia y un aviso
 * se vuelve texto gris — que es exactamente el bug que tuvo esta conversión en
 * su primera versión.
 */
export function tokenFor(prefix, hex) {
  const L = luminance(hex);
  const [hue, sat] = hueSat(hex);
  const amber = sat > 0.25 && hue > 18 && hue < 62;
  const green = sat > 0.18 && hue >= 62 && hue <= 155;
  const info = sat > 0.25 && hue > 155 && hue <= 205;
  const red = sat > 0.18 && (hue <= 18 || hue >= 330);

  if (LINE_PREFIX.has(prefix)) {
    if (amber) return "--warn-line";
    if (green) return "--assist-line";
    if (info) return "--info-line";
    if (red) return "--risk-line";
    return L > 0.8 ? "--hairline" : "--rule";
  }
  if (BG_PREFIX.has(prefix)) {
    const solid = chroma(hex) > 0.35;
    if (amber) return solid ? "--warn-mid" : "--warn-soft";
    if (green) return solid ? "--assist" : "--assist-soft";
    if (info) return solid ? "--status-info" : "--info-soft";
    if (red) return solid ? "--status-risk" : "--risk-soft";
    if (L > 0.93) return "--ground-2";
    if (L > 0.85) return "--ground-3";
    if (L > 0.65) return "--ground-4";
    if (L < 0.08) return "--ink-fill";
    return "--ink-40";
  }
  // Tinta: prefijo de texto, o un hex suelto dentro de una cadena JS.
  if (amber) return "--status-warn";
  // Un verde casi negro no es «el verde de la marca en oscuro»: es la tinta
  // que va ENCIMA del relleno verde. Sobre `--assist`, `--assist-ink` da
  // 4,05:1 y no pasa; `--on-assist` da 14,35:1.
  if (green && L < 0.08) return "--on-assist";
  if (green) return "--assist-ink";
  if (info) return "--status-info";
  if (red) return "--status-risk";
  if (L < 0.08) return "--ink";
  if (L < 0.25) return "--ink-60";
  return "--ink-40";
}

/** Tres profundidades, no veinticuatro. El desenfoque decide. */
function shadowToken(blur) {
  return blur <= 4 ? "--shadow-sm" : blur > 45 ? "--shadow-pop" : "--shadow-md";
}

// Importable sin efectos: el test sólo quiere `tokenFor`, no que se reescriba
// el repositorio al cargar el módulo.
if (process.argv[1]?.endsWith("ops-tokens.mjs")) {
  const files = execFileSync("git", ["ls-tree", "-r", "--name-only", "HEAD", ...DIRS], { encoding: "utf8" })
    .split("\n").filter((f) => f.endsWith(".tsx"));

  let replaced = 0, shadows = 0;
  const leftover = new Map();

  for (const file of files) {
    const from = CHECK ? readFileSync(file, "utf8")
                       : execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8" });
    let out = from;
    for (const [a, b] of Object.entries(ALPHA)) out = out.split(a).join(b);

    out = out.replace(/shadow-\[0_(\d+)px_(\d+)px_rgba?\([0-9][^\]]*\]/g, (_m, _y, blur) => {
      shadows += 1;
      return `shadow-[var(${shadowToken(Number(blur))})]`;
    });

    out = out.replace(/(?<![\w-])([a-z][a-z-]*)-\[(#[0-9a-fA-F]{3,6})\](?![\w/])/g, (m, prefix, hex) => {
      const last = prefix.split("-").at(-1);
      const role = INK_PREFIX.has(prefix) || LINE_PREFIX.has(prefix) || BG_PREFIX.has(prefix) ? prefix : last;
      replaced += 1;
      return `${prefix}-[var(${tokenFor(role, hex)})]`;
    });
    out = out.replace(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g, (hex) => {
      replaced += 1;
      return `var(${tokenFor("text", hex)})`;
    });

    for (const m of out.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([0-9][^)]*\)/g)) {
      leftover.set(m[0], (leftover.get(m[0]) ?? 0) + 1);
    }
    if (!CHECK && out !== from) writeFileSync(file, out);
  }

  console.log(`${CHECK ? "[check] " : ""}${files.length} archivos · ${replaced} colores · ${shadows} sombras`);
  if (leftover.size) {
    console.log("color crudo restante:", [...leftover.entries()].map(([k, n]) => `${k}×${n}`).join(" "));
    process.exitCode = 1;
  } else {
    console.log("color crudo restante: ninguno");
  }
}
