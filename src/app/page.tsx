import Hero from "@/components/landing/Hero";
import FeaturedSystems from "@/components/landing/FeaturedSystems";
import OutcomeServices from "@/components/landing/OutcomeServices";
import OutcomeFooter from "@/components/landing/OutcomeFooter";
import SmoothScroll from "@/components/landing/SmoothScroll";

export default function Home() {
  return (
    <>
      <main className="relative bg-[#f4f0e5]">
        <SmoothScroll />
        <Hero />
        <FeaturedSystems />
        <OutcomeServices />
      </main>
      <OutcomeFooter />
    </>
  );
}
