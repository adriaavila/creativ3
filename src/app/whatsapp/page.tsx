import type { Metadata } from "next";
import WhatsAppRevenuePage from "@/components/landing/WhatsAppRevenuePage";

export const metadata: Metadata = {
  title: "Sistema WhatsApp Revenue en 7 dias | creativv",
  description:
    "Instalamos un sistema de ventas con IA para responder, calificar, dar seguimiento y agendar clientes por WhatsApp en 7 dias.",
  alternates: { canonical: "/whatsapp" },
};

export default function WhatsAppPage() {
  return <WhatsAppRevenuePage />;
}
