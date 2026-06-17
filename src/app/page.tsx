import Hero from "@/components/landing/Hero";
import PainValueSection from "@/components/landing/PainValueSection";
import OfertaSection from "@/components/landing/OfertaSection";
import WhatsAppBanner from "@/components/landing/WhatsAppBanner";
import Servicios from "@/components/landing/Servicios";
import ProyectosShowcase from "@/components/landing/ProyectosShowcase";
import ProcessSection from "@/components/landing/ProcessSection";
import Colofon from "@/components/landing/Colofon";

export default function Home() {
  return (
    <main className="relative bg-[#f5f3ec]">
      <Hero />
      <PainValueSection />
      <OfertaSection />
      <WhatsAppBanner />
      <Servicios />
      <ProyectosShowcase />
      <ProcessSection />
      <Colofon />
    </main>
  );
}
