import Hero from "@/components/landing/Hero";
import OfertaSection from "@/components/landing/OfertaSection";
import WhatsAppBanner from "@/components/landing/WhatsAppBanner";
import Servicios from "@/components/landing/Servicios";
import ProyectosShowcase from "@/components/landing/ProyectosShowcase";
import Colofon from "@/components/landing/Colofon";

export default function Home() {
  return (
    <main className="relative bg-[#f5f3ec]">
      <Hero />
      <OfertaSection />
      <WhatsAppBanner />
      <Servicios />
      <ProyectosShowcase />
      <Colofon />
    </main>
  );
}
