import type { Metadata } from "next";
import VerticalLandingPage from "@/components/landing/VerticalLandingPage";
import { VERTICALS } from "@/lib/verticals";
import { serviceJsonLd } from "@/lib/seo";

const TITLE = "Tiendas online y automatización para ecommerce";
const DESCRIPTION =
  "Landing premium, asistente de ventas y automatización de WhatsApp/email para ecommerce, marcas locales y tiendas con catálogo en Venezuela y LatAm.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/ecommerce" },
};

export default function EcommercePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd(TITLE, DESCRIPTION, "/ecommerce")),
        }}
      />
      <VerticalLandingPage vertical={VERTICALS.ecommerce} />
    </>
  );
}
