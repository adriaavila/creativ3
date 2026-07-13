"use client";

import { useState } from "react";
import type { LandingIntent } from "@/lib/landing-intent";
import FeaturedSystems from "./FeaturedSystems";
import Hero from "./Hero";
import OutcomeFooter from "./OutcomeFooter";
import OutcomeServices from "./OutcomeServices";
import SmoothScroll from "./SmoothScroll";

export default function HomeExperience() {
  const [intent, setIntent] = useState<LandingIntent>("efficiency");

  return (
    <div data-landing-intent={intent}>
      <main className="relative bg-[#f4f0e5]">
        <SmoothScroll />
        <Hero intent={intent} onIntentChange={setIntent} />
        <FeaturedSystems intent={intent} />
        <OutcomeServices intent={intent} />
      </main>
      <OutcomeFooter intent={intent} />
    </div>
  );
}
