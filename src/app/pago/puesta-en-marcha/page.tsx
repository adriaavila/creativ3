import type { Metadata } from "next";
import ProjectCheckout from "@/components/billing/ProjectCheckout";
import { SETUP_SERVICE } from "@/lib/plans";

const TITLE = "Puesta en marcha | allok";
const DESCRIPTION =
  "Conectamos tu WhatsApp, cargamos tu agente y lo ajustamos sobre conversaciones reales. Pago único de US$499.";

// ponytail: link que se manda en la conversación de venta, no se enlaza desde la web.
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  robots: { index: false, follow: false },
};

export default function SetupPaymentPage() {
  return (
    <ProjectCheckout
      item="puesta-en-marcha"
      client="puesta-en-marcha"
      eyebrow={SETUP_SERVICE.name}
      title="Lo dejamos andando nosotros."
      lead="Conectamos tu número de siempre, cargamos tu agente con tus precios y servicios y lo ajustamos sobre conversaciones reales."
      included={[...SETUP_SERVICE.features]}
      priceLabel={SETUP_SERVICE.name}
      currencySymbol="$"
      amount={String(SETUP_SERVICE.price)}
      currencyCode="USD"
      note="Pago único. Se confirma al instante y recibes tu comprobante por correo."
      cta={`Pagar $${SETUP_SERVICE.price} de forma segura`}
    />
  );
}
