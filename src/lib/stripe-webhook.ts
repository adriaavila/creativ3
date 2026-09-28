import type Stripe from "stripe";
import { SETUP_SERVICE } from "@/lib/plans";

/**
 * Las llaves de firma, una por cuenta de Stripe que avisa a esta URL: la de
 * siempre (`STRIPE_WEBHOOK_SECRET`, puede traer varias separadas por coma) y la
 * de allok LLC (`STRIPE_WEBHOOK_SECRET_LLC`), donde vive el link de la puesta en marcha.
 */
export function webhookSecrets(raw: string | undefined): string[] {
  return (raw ?? "").split(",").map((secret) => secret.trim()).filter(Boolean);
}

/**
 * Qué se cobró. Lo que manda nuestro checkout va en `metadata.item`; la puesta en
 * marcha llega por su Payment Link, que se reconoce por su id o por la metadata
 * que el link copia a la sesión. Cualquier otro link sin metadata queda sin item.
 */
export function itemOf(session: Pick<Stripe.Checkout.Session, "metadata" | "payment_link">): string {
  const link = typeof session.payment_link === "string" ? session.payment_link : session.payment_link?.id;
  const setup = link === SETUP_SERVICE.paymentLinkId || session.metadata?.kind === "puesta_en_marcha";
  return session.metadata?.item ?? session.metadata?.plan ?? (setup ? "puesta-en-marcha" : "");
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
