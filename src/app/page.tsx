import type { Metadata } from "next";
import StudioHome, { STUDIO_FAQS } from "@/components/home/StudioHome";
import { faqJsonLd } from "@/lib/seo";

const TITLE = "Releva | Webs y automatizaciones que traen clientes";
const DESCRIPTION =
  "Landings, tiendas y automatizaciones con IA para negocios. Primer entregable en 3 días, precio cerrado desde USD 199.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  keywords: [
    "Releva",
    "landing page",
    "automatizacion con IA",
    "agente WhatsApp",
    "desarrollo web Next.js",
    "dashboard a medida",
    "MVP",
    "Adri Ávila",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    type: "website",
    locale: "es_VE",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqJsonLd(STUDIO_FAQS.map((f) => ({ q: f.question, a: f.answer }))),
          ),
        }}
      />
      <StudioHome />
    </>
  );
}
