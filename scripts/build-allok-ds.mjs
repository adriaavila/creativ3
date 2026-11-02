#!/usr/bin/env node
// allok design system → the site.
//
// Sources (copied as-is from the design system artifact, never edited here):
//   src/styles/allok/tokens.json   the tokens
//   src/styles/allok/bundle.css    the component stylesheet
//   src/styles/allok/home.src.css  the home demos' styles (from the Home card)
// Output (generated, committed, do not edit):
//   src/styles/allok/tokens.css    tokens compiled to custom properties + type classes
//   src/styles/allok/allok.css     bundle.css with every selector scoped under `.ak`
//   src/styles/allok/home.css      home.src.css, scoped the same way
//
// Why scoped: the rest of allok.fun (/agente-whatsapp, /ops, the funnel) runs on
// Tailwind and already defines --ink, .btn-like names and its own fonts. Under
// `.ak` the system paints only what sits inside a `.ak` root, and nothing else
// on the site changes.
//
//   node scripts/build-allok-ds.mjs          write the outputs
//   node scripts/build-allok-ds.mjs --check  exit 1 if the outputs are stale
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "src/styles/allok");
const SCOPE = ".ak";

// ── tokens.json → tokens.css ─────────────────────────────────────────────
export function compileTokens(t) {
  const out = [];
  const themes = t.color.themes.map((x) => x.id);
  const valueIn = (v, theme) => (typeof v === "string" ? v : (v[theme] ?? v[themes[0]]));
  const aliasOf = (v) => {
    const m = /^\{([A-Za-z0-9_.-]+)\}$/.exec(v);
    return m ? `var(--${m[1]})` : v;
  };
  themes.forEach((theme, i) => {
    const sel = [`${SCOPE}[data-theme="${theme}"]`, `${SCOPE} [data-theme="${theme}"]`];
    if (i === 0) sel.unshift(SCOPE);
    const decls = t.color.tokens
      .filter((tok) => i === 0 || typeof tok.value !== "string")
      .map((tok) => `  --${tok.name}: ${aliasOf(valueIn(tok.value, theme))};`);
    out.push(`${sel.join(",\n")} {\n${decls.join("\n")}\n}`);
  });
  const flat = [];
  for (const [key, fam] of Object.entries(t)) {
    if (["name", "version", "meta", "color", "type"].includes(key)) continue;
    if (!fam || !Array.isArray(fam.tokens)) continue;
    for (const tok of fam.tokens) flat.push(`  --${tok.name}: ${tok.value};`);
  }
  for (const [k, v] of Object.entries(t.type.families)) flat.push(`  --font-${k}: ${v};`);
  out.push(`${SCOPE} {\n${flat.join("\n")}\n}`);
  const px = (v) => (typeof v === "number" ? `${v}px` : v);
  for (const g of t.type.groups) {
    for (const s of g.styles) {
      const fam = s.family ?? g.family;
      const d = [`font-family: var(--font-${fam})`, `font-size: ${px(s.fontSize)}`];
      if (s.lineHeight !== undefined) d.push(`line-height: ${s.lineHeight}`);
      if (s.letterSpacing !== undefined) d.push(`letter-spacing: ${px(s.letterSpacing)}`);
      if (s.fontWeight !== undefined) d.push(`font-weight: ${s.fontWeight}`);
      out.push(`${SCOPE} .${s.name} { ${d.join("; ")}; }`);
    }
  }
  const faces = t.type.fonts.map((f) => {
    const file = f.file.split("/").pop();
    return `@font-face { font-family: "${f.family}"; src: url("/allok/${file}") format("woff2"); font-weight: ${f.weight}; font-style: ${f.style ?? "normal"}; font-display: swap; }`;
  });
  return `/* allok — generated from tokens.json by scripts/build-allok-ds.mjs. Do not edit. */\n${faces.join("\n")}\n${out.join("\n\n")}\n`;
}

// ── bundle.css → allok.css ───────────────────────────────────────────────
function scopeSelector(sel) {
  const s = sel.trim();
  if (!s) return s;
  if (s === ":root") return SCOPE;
  if (s === "html") return `html:has(${SCOPE})`;
  if (s === SCOPE || s.startsWith(`${SCOPE} `) || s.startsWith(`${SCOPE}.`) || s.startsWith(`${SCOPE}[`) || s.startsWith(`${SCOPE}:`))
    return s;
  // motion.js puts .motion on <html>: keep it outside the scope.
  if (s.startsWith(".motion ")) return `.motion ${SCOPE} ${s.slice(".motion ".length)}`;
  if (s.startsWith("[data-theme")) return `${SCOPE}${s.split(" ")[0]}${s.includes(" ") ? s.slice(s.indexOf(" ")) : ""}, ${SCOPE} ${s}`;
  return `${SCOPE} ${s}`;
}

function splitTopLevelCommas(s) {
  const parts = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; } else cur += ch;
  }
  parts.push(cur);
  return parts;
}

export function scopeCss(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let out = "", i = 0;
  // Walks blocks. Inside @media/@supports the rules are scoped too; inside
  // @keyframes nothing is touched.
  function block(endAtBrace, inKeyframes) {
    let res = "";
    while (i < css.length) {
      const open = css.indexOf("{", i);
      const close = css.indexOf("}", i);
      if (close !== -1 && (open === -1 || close < open)) {
        res += css.slice(i, close);
        i = close + 1;
        if (endAtBrace) return res;
        continue;
      }
      if (open === -1) { res += css.slice(i); i = css.length; return res; }
      const prelude = css.slice(i, open).trim();
      i = open + 1;
      if (prelude.startsWith("@")) {
        const kf = /^@(-webkit-)?keyframes/.test(prelude);
        res += `\n${prelude} {${block(true, kf)}}`;
      } else if (inKeyframes) {
        const end = css.indexOf("}", i);
        res += `${prelude} {${css.slice(i, end)}}`;
        i = end + 1;
      } else {
        const end = css.indexOf("}", i);
        const sel = splitTopLevelCommas(prelude).map(scopeSelector).join(", ");
        res += `\n${sel} {${css.slice(i, end).trim()}}`;
        i = end + 1;
      }
    }
    return res;
  }
  out = block(false, false);
  return `/* allok — scoped under ${SCOPE} by scripts/build-allok-ds.mjs. Do not edit. */${out}\n`;
}

const tokens = compileTokens(JSON.parse(readFileSync(join(dir, "tokens.json"), "utf8")));
const allok = scopeCss(readFileSync(join(dir, "bundle.css"), "utf8"));
const home = scopeCss(readFileSync(join(dir, "home.src.css"), "utf8"));
const targets = [["tokens.css", tokens], ["allok.css", allok], ["home.css", home]];

if (process.argv.includes("--check")) {
  const stale = targets.filter(([f, c]) => {
    try { return readFileSync(join(dir, f), "utf8") !== c; } catch { return true; }
  });
  if (stale.length) {
    console.error(`stale: ${stale.map(([f]) => f).join(", ")} — run node scripts/build-allok-ds.mjs`);
    process.exit(1);
  }
  console.log("allok design system: outputs up to date");
} else {
  for (const [f, c] of targets) writeFileSync(join(dir, f), c);
  console.log("allok design system: wrote tokens.css, allok.css and home.css");
}
