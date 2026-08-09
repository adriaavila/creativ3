import type { Metadata } from "next";
import VerticalLandingPage from "@/components/landing/VerticalLandingPage";
import { VERTICALS } from "@/lib/verticals";
import { serviceJsonLd } from "@/lib/seo";

const TITLE = "Sistema comercial para academias e institutos";
const DESCRIPTION =
  "Allok organiza consultas, seguimiento e inscripciones por WhatsApp para academias, coaches y servicios recurrentes en Venezuela y LatAm.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/academias" },
};

export default function AcademiasPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd(TITLE, DESCRIPTION, "/academias")),
        }}
      />
      <VerticalLandingPage vertical={VERTICALS.academias} />
    </>
  );
}
