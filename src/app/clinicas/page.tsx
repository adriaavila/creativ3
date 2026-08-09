import type { Metadata } from "next";
import VerticalLandingPage from "@/components/landing/VerticalLandingPage";
import { VERTICALS } from "@/lib/verticals";
import { serviceJsonLd } from "@/lib/seo";

const TITLE = "Sistema comercial para clínicas estéticas y wellness";
const DESCRIPTION =
  "Allok organiza consultas, agenda y seguimiento por WhatsApp para clínicas estéticas, wellness y salud privada en Venezuela y LatAm.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/clinicas" },
};

export default function ClinicasPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd(TITLE, DESCRIPTION, "/clinicas")),
        }}
      />
      <VerticalLandingPage vertical={VERTICALS.clinicas} />
    </>
  );
}
