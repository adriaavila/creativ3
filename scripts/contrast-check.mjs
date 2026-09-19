/**
 * Mide el contraste real de cada texto contra el fondo que de verdad tiene
 * detrás, en el navegador. Existe porque tres regresiones de esta conversión
 * —verde sobre negro, papel sobre lima, y un relleno que se volvió papel—
 * pasaron el build, el lint y los tests sin que nada chistara: sólo se ven
 * midiendo la pantalla.
 *
 * Un degradado (el cielo) no tiene background-color; subir hasta el papel de
 * detrás inventaría un fallo que no existe, así que se declara indecidible y
 * se salta. Lo mismo con los alfas modernos (oklab) que el CSS ya resolvió.
 *
 *   BASE_URL=http://localhost:3000 OPS_ACCESS_PASSWORD=… node scripts/contrast-check.mjs
 */
import { chromium } from "playwright";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PASS = process.env.OPS_ACCESS_PASSWORD ?? "";
const PAGES = ["/ops/growth","/ops/crm","/ops/crm?view=connections","/ops/clientes","/ops/agents","/ops/lab","/ops/portfolio","/ops-login","/","/vocero","/rei","/agencia"];

const PROBE = () => {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  // Un degradado (el cielo, el bloom) no tiene background-color: subir hasta
  // el papel de detrás inventa un fallo que en pantalla no existe. Se declara
  // indecidible y se salta.
  const bgOf = (el) => {
    let n = el;
    while (n) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== "none") return null;
      if (/oklab|oklch/.test(s.backgroundColor)) return null; // alfa moderno: indecidible aquí
      const c = parse(s.backgroundColor);
      if (c.length >= 3 && (c[3] === undefined || c[3] > 0.5)) return c;
      n = n.parentElement;
    }
    return [255, 255, 255];
  };
  const bad = [];
  for (const el of document.querySelectorAll("*")) {
    if (!el.childNodes.length) continue;
    const text = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(" ");
    if (!text) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) < 0.3) continue;
    const size = parseFloat(s.fontSize), weight = Number(s.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    const fg = parse(s.color);
    if (fg[3] !== undefined && fg[3] < 0.5) continue;
    const bg = bgOf(el);
    if (!bg) continue;                       // degradado: indecidible
    if (/oklab|oklch/.test(s.color)) continue; // alfa sobre alfa: lo mide el ojo
    const r = ratio(fg, bg);
    if (r < need) bad.push({ text: text.slice(0, 46), fg: s.color, bg: `rgb(${bg.join(",")})`, r: Math.round(r * 100) / 100, need, size: Math.round(size) });
  }
  return bad;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

// Sin contraseña sólo se miden las páginas públicas. No se pide ni se guarda:
// se lee de OPS_ACCESS_PASSWORD, la misma que usa el servidor.
if (PASS) {
  await p.goto(`${BASE}/ops-login`, { waitUntil: "networkidle" });
  await p.fill('input[type="password"]', PASS);
  await Promise.all([p.waitForURL(/\/ops/), p.click('button[type="submit"]')]);
} else {
  console.log("sin OPS_ACCESS_PASSWORD: sólo páginas públicas\n");
}

let total = 0;
const TALLY = new Map();
for (const path of PAGES) {
  if (!PASS && path.startsWith("/ops")) continue;
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(700);
  const bad = await p.evaluate(PROBE);
  total += bad.length;
  for (const b of bad) {
    const k = `${b.fg} sobre ${b.bg}  (${b.r}:1)`;
    TALLY.set(k, (TALLY.get(k) ?? 0) + 1);
  }
  if (bad.length) {
    console.log(`\n── ${path}  (${bad.length})`);
    const seen = new Set();
    for (const b of bad) {
      const key = `${b.fg}|${b.bg}|${b.size}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`   ${b.r}:1 (pide ${b.need})  ${b.fg} sobre ${b.bg}  ${b.size}px  «${b.text}»`);
    }
  } else console.log(`── ${path}  limpio`);
}
console.log(`\nTOTAL fallos de contraste: ${total}`);
console.log("\n── Resumen por par ──");
for (const [k, n] of [...TALLY.entries()].sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(4)}  ${k}`);
await browser.close();
