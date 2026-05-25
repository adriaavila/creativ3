import type { Metadata } from "next";
import VerticalLandingPage from "@/components/landing/VerticalLandingPage";
import { VERTICALS } from "@/lib/verticals";

export const metadata: Metadata = {
  title: "IA y websites para inmobiliarias",
  description:
    "Captacion, calificacion y seguimiento de leads para inmobiliarias, brokers y property managers.",
};

export default function InmobiliariasPage() {
  return <VerticalLandingPage vertical={VERTICALS.inmobiliarias} />;
}
