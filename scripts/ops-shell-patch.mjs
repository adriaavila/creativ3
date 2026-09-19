/**
 * Los dos retoques que `ops-tokens.mjs` no puede deducir, porque no son un
 * color sino una decisión de estructura. Se corre después de él.
 */
import { globSync, readFileSync, writeFileSync } from "node:fs";

const SHELL = "src/components/ops/OpsShell.tsx";
writeFileSync(SHELL, `import type { ReactNode } from "react";
import OpsNav from "@/components/ops/OpsNav";

/**
 * El marco de Ops.
 *
 * \`allok-ops\` es lo que pone a Ops en el mismo sistema que la web y que la app
 * del cliente: los mismos escalones de superficie, las mismas tintas y el mismo
 * verde de asistencia, con los estados que una herramienta de trabajo necesita
 * y una landing no. El ámbito se basta solo — no lleva \`.allok\` al lado — y no
 * pinta: el fondo lo pone esta clase.
 *
 * La página va un escalón por debajo (\`--ground-2\`) para que una tarjeta blanca
 * se lea elevada sin necesidad de sombra.
 */
export default function OpsShell({ children }: { children: ReactNode }) {
  return (
    <div className="allok-ops ops-shell min-h-dvh bg-[var(--ground-2)] text-[var(--ink)] antialiased">
      <OpsNav global />
      <div className="min-h-dvh overflow-x-hidden pt-[68px] md:ml-[224px] md:pt-0">
        {children}
      </div>
    </div>
  );
}
`);

const LOGIN = "src/app/ops-login/page.tsx";
let login = readFileSync(LOGIN, "utf8");
const before = login;
login = login.replace(
  /<main className="((?:on-ink )?)(relative flex min-h-screen[^"]*?)bg-\[var\(--(?:ink|ink-fill|void)\)\]([^"]*?)text-(?:white|\[var\(--[a-z-]+\)\])"/,
  '<main className="on-ink allok-ops $2bg-[var(--void)]$3text-[var(--ink)]"',
);
// Idempotente: si ya lleva el ámbito, no hay nada que hacer.
if (login === before && !/<main className="on-ink allok-ops /.test(login)) {
  throw new Error("ops-login: no encontré el <main> que lleva el ámbito");
}
if (login !== before) writeFileSync(LOGIN, login);

// ── Tinta sobre un relleno de marca ────────────────────────────────────────
// Se decide por el MISMO className, que es lo único visible sin renderizar:
// dentro de un trozo oscuro `--ink` es papel, y papel sobre lima da 1,2:1.
// `--on-assist` da 14,35:1.
const FILL = /bg-\[var\(--(?:assist|warn-mid)\)\]/;
let onFill = 0;
for (const file of globSync("src/components/ops/**/*.tsx").concat(globSync("src/app/ops*/**/*.tsx"))) {
  const before = readFileSync(file, "utf8");
  const after = before.replace(/"([^"]*)"/g, (m, body) => {
    if (!FILL.test(body)) return m;
    const fixed = body
      .replace(/text-\[var\(--ink(?:-\d+)?\)\]/g, "text-[var(--on-assist)]")
      .replace(/(^|\s)text-white(?=\s|$)/g, "$1text-[var(--on-assist)]");
    if (fixed === body) return m;
    onFill += 1;
    return `"${fixed}"`;
  });
  if (after !== before) writeFileSync(file, after);
}

console.log(`OpsShell y ops-login al día · ${onFill} tintas sobre relleno corregidas`);
