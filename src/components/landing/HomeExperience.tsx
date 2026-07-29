"use client";

import { useState } from "react";
import type { LandingIntent } from "@/lib/landing-intent";
import Hero from "./Hero";
import WhatsAppBanner from "./WhatsAppBanner";
import ProyectosShowcase from "./ProyectosShowcase";
import FeaturedSystems from "./FeaturedSystems";
import OfertaSection from "./OfertaSection";
import OutcomeServices from "./OutcomeServices";
import Colofon from "./Colofon";
import SmoothScroll from "./SmoothScroll";

export default function HomeExperience() {
  const [intent, setIntent] = useState<LandingIntent>("efficiency");

  return (
    <div data-landing-intent={intent}>
      <main className="relative bg-[#f3f3f3]">
        <SmoothScroll />
        <Hero intent={intent} onIntentChange={setIntent} />
        <WhatsAppBanner />
        <ProyectosShowcase />
        <FeaturedSystems intent={intent} />
        <OutcomeServices intent={intent} />
        <OfertaSection />
      </main>
      <Colofon />
    </div>
  );
}

