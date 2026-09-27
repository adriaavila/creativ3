import type Stripe from "stripe";

/**
 * `STRIPE_WEBHOOK_SECRET` puede traer varias llaves separadas por coma, una por
 * cuenta de Stripe que avisa a esta URL: la de siempre y la de allok LLC, donde
 * vive el link de la puesta en marcha.
 */
export function webhookSecrets(raw: string | undefined): string[] {
  return (raw ?? "").split(",").map((secret) => secret.trim()).filter(Boolean);
}

/** El evento si alguna de las llaves lo firma; si ninguna, null. */
export function verifiedEvent(stripe: Stripe, payload: string, signature: string, secrets: string[]): Stripe.Event | null {
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch {
      // Lo firmó otra cuenta: se prueba la llave siguiente.
    }
  }
  return null;
}
