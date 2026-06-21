import type { Metadata } from "next";
import VerticalLandingPage from "@/components/landing/VerticalLandingPage";
import { VERTICALS } from "@/lib/verticals";
import { serviceJsonLd } from "@/lib/seo";

const TITLE = "Páginas web y captación de leads para inmobiliarias";
const DESCRIPTION =
  "Captación, calificación y seguimiento de leads con agentes IA y WhatsApp para inmobiliarias, brokers y property managers en Venezuela y LatAm.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/inmobiliarias" },
};

export default function InmobiliariasPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd(TITLE, DESCRIPTION, "/inmobiliarias")),
        }}
      />
      <VerticalLandingPage vertical={VERTICALS.inmobiliarias} />
    </>
  );
}
