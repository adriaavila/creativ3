import type { Metadata } from "next";
import VerticalLandingPage from "@/components/landing/VerticalLandingPage";
import { VERTICALS } from "@/lib/verticals";

export const metadata: Metadata = {
  title: "IA y websites para academias",
  description:
    "Landing premium, reservas, captacion de alumnos y automatizacion WhatsApp para academias, coaches y servicios recurrentes.",
};

export default function AcademiasPage() {
  return <VerticalLandingPage vertical={VERTICALS.academias} />;
}
