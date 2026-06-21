import type { Metadata } from "next";
import VerticalLandingPage from "@/components/landing/VerticalLandingPage";
import { VERTICALS } from "@/lib/verticals";
import { serviceJsonLd } from "@/lib/seo";

const TITLE = "Páginas web y captación de alumnos para academias";
const DESCRIPTION =
  "Landing premium, reservas, captación de alumnos y automatización de WhatsApp para academias, coaches y servicios recurrentes en Venezuela y LatAm.";

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
