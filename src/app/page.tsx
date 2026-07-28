import type { Metadata } from "next";
import StudioHome from "@/components/home/StudioHome";

export const metadata: Metadata = {
  title: "creativv | Productos y Experimentos de Adri Ávila",
  description:
    "Conecto lo que observo con productos que pueden existir. Productos digitales, sistemas y experimentos por Adri Ávila.",
  alternates: { canonical: "/" },
  keywords: [
    "creativv",
    "Adri Ávila",
    "productos digitales",
    "REI",
    "Shopea",
    "Frontia",
    "Mística",
    "Soapy",
    "experimentos",
  ],
  openGraph: {
    title: "creativv | Conecto lo que observo con productos que pueden existir",
    description:
      "Creativv es el lugar donde convierto observaciones del mercado en productos digitales, sistemas y experimentos.",
    url: "/",
    type: "website",
    locale: "es_VE",
  },
  twitter: {
    card: "summary_large_image",
    title: "creativv | Productos y experimentos de Adri Ávila",
    description:
      "Creativv es el lugar donde convierto observaciones del mercado en productos digitales, sistemas y experimentos.",
  },
};

export default function Home() {
  return <StudioHome />;
}



