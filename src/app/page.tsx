import Hero from "@/components/landing/Hero";
import Servicios from "@/components/landing/Servicios";
import ProyectosShowcase from "@/components/landing/ProyectosShowcase";
import Colofon from "@/components/landing/Colofon";

export default function Home() {
  return (
    <main className="relative bg-[#f5f3ec]">
      <Hero />
      <Servicios />
      <ProyectosShowcase />
      <Colofon />
    </main>
  );
}
