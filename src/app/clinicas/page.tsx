import type { Metadata } from "next";
import VerticalLandingPage from "@/components/landing/VerticalLandingPage";
import { VERTICALS } from "@/lib/verticals";
import { serviceJsonLd } from "@/lib/seo";

const TITLE = "Páginas web y agentes IA para clínicas";
const DESCRIPTION =
  "Landings premium, desarrollo web a medida y automatizaciones de WhatsApp para clínicas estéticas, wellness y salud privada en Venezuela y LatAm.";

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
