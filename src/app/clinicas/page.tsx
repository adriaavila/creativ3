import type { Metadata } from "next";
import VerticalLandingPage from "@/components/landing/VerticalLandingPage";
import { VERTICALS } from "@/lib/verticals";

export const metadata: Metadata = {
  title: "IA y websites para clinicas",
  description:
    "Landings premium, desarrollo web a medida y automatizaciones para clinicas esteticas, wellness y servicios de salud privada.",
};

export default function ClinicasPage() {
  return <VerticalLandingPage vertical={VERTICALS.clinicas} />;
}
