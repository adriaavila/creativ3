import type { Metadata } from "next";
import WhatsAppRevenuePage from "@/components/landing/WhatsAppRevenuePage";

export const metadata: Metadata = {
  title: "Sistema WhatsApp Revenue en 7 dias",
  description:
    "Instalamos un sistema de ventas con IA para responder, calificar, dar seguimiento y agendar clientes por WhatsApp en 7 dias.",
};

export default function Home() {
  return <WhatsAppRevenuePage />;
}
