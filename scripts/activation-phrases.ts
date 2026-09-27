// Lista cada mensaje de WhatsApp que la web de allok deja escrito ("Hola, vengo de allok.fun. …"),
// sin repetir, para pegarlo en Vocero → `principal` → Tu agente → Mensajes que activan.
// El agente sólo despierta con la frase EXACTA: si cambia un texto o un plan de la web, se vuelve a pegar.
// Uso: node --import tsx scripts/activation-phrases.ts
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PLANS, planCta } from "../src/lib/plans";

const phrases = new Set<string>();

// 1. Los textos fijos del código (un `$` suelto como en "US$499" vale; `${` no).
(function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) {
      for (const [, text] of readFileSync(path, "utf8").matchAll(/["'`](Hola, vengo de allok\.fun\.(?:[^"'`$]|\$(?!\{))*)["'`]/g)) {
        phrases.add(text.trim());
      }
    }
  }
})("src");

// 2. Los que se arman por plan. Home: `planCta`. REI: espejo de `src/app/rei/page.tsx` (botón de cada plan).
for (const plan of PLANS) {
  phrases.add(new URL(planCta(plan).href).searchParams.get("text") ?? "");
  phrases.add(
    plan.appPlan
      ? `Hola, vengo de allok.fun. Quiero el plan ${plan.name} para mi inmobiliaria.`
      : `Hola, vengo de allok.fun. Quiero la implementación de allok (US$${plan.price}) para mi inmobiliaria.`,
  );
}

const list = [...phrases].filter(Boolean).sort();
console.log(list.join("\n"));
console.error(`\n${list.length} frases`);
