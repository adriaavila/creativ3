import SmoothScroll from "@/components/landing/SmoothScroll";
import PageLoadChoreography from "@/components/landing/PageLoadChoreography";
import Hero from "@/components/landing/Hero";
import Tesis from "@/components/landing/Tesis";
import Servicios from "@/components/landing/Servicios";
import Marquee from "@/components/landing/Marquee";
import Principios from "@/components/landing/Principios";
import Metodo from "@/components/landing/Metodo";
import Puertas from "@/components/landing/Puertas";
import Colofon from "@/components/landing/Colofon";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <PageLoadChoreography />
      <main className="relative z-10">
        <Hero />
        <Tesis />
        <Servicios />
        <Marquee />
        <Principios />
        <Metodo />
        <Puertas />
        <Colofon />
      </main>
    </>
  );
}