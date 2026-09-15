/**
 * Crea en Stripe el producto y los tres precios recurrentes del CRM, e
 * imprime los ids para pegarlos en las variables de entorno.
 *
 *   pnpm stripe:setup            # simulacro: dice qué crearía, no crea nada
 *   pnpm stripe:setup --apply    # crea de verdad
 *
 * Es idempotente por `lookup_key`: si un precio ya existe lo reutiliza en vez
 * de crear un duplicado, así que se puede correr dos veces sin ensuciar la
 * cuenta. Los precios de Stripe son inmutables — para cambiar un importe se
 * crea uno nuevo y se archiva el viejo; este script nunca archiva nada.
 *
 * Usa la STRIPE_SECRET_KEY del entorno: con la clave de prueba crea en
 * sandbox, con la real crea en la cuenta real. Revisa cuál tienes cargada
 * antes de pasar --apply.
 */
import Stripe from "stripe";
import { PLANS } from "../src/lib/plans";

const apply = process.argv.includes("--apply");
const secret = process.env.STRIPE_SECRET_KEY;

if (!secret) {
  console.error("Falta STRIPE_SECRET_KEY.");
  process.exit(1);
}

const stripe = new Stripe(secret, { apiVersion: "2026-04-22.dahlia" });
const live = secret.startsWith("sk_live") || secret.startsWith("rk_live");

const PRODUCT_LOOKUP = "allok-crm";
const envName = (key: string) => `STRIPE_PRICE_ALLOK_${key.toUpperCase()}_MONTHLY`;

async function findProduct(): Promise<Stripe.Product | null> {
  const found = await stripe.products.search({
    query: `metadata['lookup_key']:'${PRODUCT_LOOKUP}'`,
    limit: 1,
  });
  return found.data[0] ?? null;
}

async function findPrice(lookupKey: string): Promise<Stripe.Price | null> {
  const found = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  return found.data[0] ?? null;
}

async function main() {
  console.log(`\nCuenta: ${live ? "REAL (live)" : "prueba (test)"}`);
  console.log(apply ? "Modo: CREAR\n" : "Modo: simulacro — no se crea nada. Usa --apply.\n");

  let product = await findProduct();
  if (product) {
    console.log(`producto  ✓ ya existe  ${product.id}`);
  } else if (apply) {
    product = await stripe.products.create({
      name: "allok — CRM de WhatsApp",
      description: "Atiende, califica y agenda en el WhatsApp de tu negocio.",
      metadata: { lookup_key: PRODUCT_LOOKUP },
    });
    console.log(`producto  + creado     ${product.id}`);
  } else {
    console.log('producto  · crearía    "allok — CRM de WhatsApp"');
  }

  const out: string[] = [`STRIPE_PRODUCT_ALLOK=${product?.id ?? "<pendiente>"}`];

  for (const plan of PLANS) {
    const lookupKey = `allok-${plan.key}-monthly`;
    const existing = await findPrice(lookupKey);

    if (existing) {
      const amount = (existing.unit_amount ?? 0) / 100;
      const drift = amount !== plan.price ? `  ⚠ Stripe dice $${amount}, el sitio $${plan.price}` : "";
      console.log(`${plan.key.padEnd(9)} ✓ ya existe  ${existing.id}${drift}`);
      out.push(`${envName(plan.key)}=${existing.id}`);
      continue;
    }

    if (!apply || !product) {
      console.log(`${plan.key.padEnd(9)} · crearía    US$${plan.price}/mes`);
      out.push(`${envName(plan.key)}=<pendiente>`);
      continue;
    }

    const price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: plan.price * 100,
      recurring: { interval: "month" },
      lookup_key: lookupKey,
      nickname: `allok ${plan.name} — mensual`,
      metadata: { plan: plan.key },
    });
    console.log(`${plan.key.padEnd(9)} + creado     ${price.id}`);
    out.push(`${envName(plan.key)}=${price.id}`);
  }

  console.log("\n── Para las variables de entorno ──");
  console.log(out.join("\n"));
  console.log();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
