import Hero from "@/components/landing/Hero";
import Servicios from "@/components/landing/Servicios";
import LiveBuild from "@/components/landing/LiveBuild";
import ProyectosShowcase from "@/components/landing/ProyectosShowcase";
import OfertaSection from "@/components/landing/OfertaSection";
import Colofon from "@/components/landing/Colofon";
import SmoothScroll from "@/components/landing/SmoothScroll";

export default function Home() {
  return (
    <main className="relative bg-[#f5f3ec]">
      <SmoothScroll />
      <Hero />
      <Servicios />
      <LiveBuild />
      <ProyectosShowcase />
      <OfertaSection />
      <Colofon />
    </main>
  );
}
