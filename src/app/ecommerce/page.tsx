import type { Metadata } from "next";
import VerticalLandingPage from "@/components/landing/VerticalLandingPage";
import { VERTICALS } from "@/lib/verticals";

export const metadata: Metadata = {
  title: "IA y websites para ecommerce",
  description:
    "Landing premium, asistente de ventas y automatizacion WhatsApp/email para ecommerce, marcas locales y tiendas con catalogo.",
};

export default function EcommercePage() {
  return <VerticalLandingPage vertical={VERTICALS.ecommerce} />;
}
