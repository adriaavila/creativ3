import type { Metadata } from "next";
import ProjectCheckout from "@/components/billing/ProjectCheckout";

const TITLE = "Juanete × allok — que empiece la función";
const DESCRIPTION =
  "El proyecto de Juanete, el grupo de comedia musical, sigue en marcha con allok. Confirma tu pago en un minuto y seguimos construyendo.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://allok.fun/pago/juanete",
    siteName: "allok",
    locale: "es",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function JuanetePaymentPage() {
  return (
    <ProjectCheckout
      item="project-deposit"
      client="juanete"
      eyebrow="Juanete"
      title="El grupo de comedia musical."
      lead="Confirma el pago acordado para continuar el proyecto de Juanete con allok."
      included={[
        "Trabajo acordado para el proyecto",
        "Seguimiento y coordinación",
        "Comprobante de pago por correo",
      ]}
      priceLabel="Proyecto Juanete"
      currencySymbol="$"
      amount="200"
      currencyCode="USD"
      note="Pago único. Se confirma al instante y recibes tu comprobante por correo."
      cta="Pagar $200 de forma segura"
    />
  );
}
