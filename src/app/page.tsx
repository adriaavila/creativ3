import type { Metadata } from "next";
import StudioHome, { STUDIO_FAQS } from "@/components/home/StudioHome";
import { faqJsonLd } from "@/lib/seo";

const TITLE = "Allok | Agencia de producto, web y automatización";
const DESCRIPTION =
  "Diseñamos webs, productos digitales y automatizaciones con IA para negocios que necesitan vender y operar mejor.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
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
            faqJsonLd(STUDIO_FAQS.map(({ question, answer }) => ({ q: question, a: answer }))),
          ),
        }}
      />
      <StudioHome />
    </>
  );
}
