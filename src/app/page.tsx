import type { Metadata } from "next";
import StudioHome, { STUDIO_FAQS } from "@/components/home/StudioHome";
import { faqJsonLd } from "@/lib/seo";

const TITLE = "Allok | Webs, productos y automatizaciones que venden";
const DESCRIPTION =
  "Construimos landings, productos digitales y automatizaciones con IA para negocios que quieren vender más y operar mejor.";

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
