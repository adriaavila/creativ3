import type { Locale, Messages } from "@/lib/i18n";
import Hero from "./Hero";
import ProductStory from "./ProductStory";
import Benefits from "./Benefits";
import SystemLayers from "./SystemLayers";
import Positioning from "./Positioning";
import IdealCustomer from "./IdealCustomer";
import Proof from "./Proof";
import Pricing from "./Pricing";
import SevenDayPlan from "./SevenDayPlan";
import Faq from "./Faq";
import FinalCta from "./FinalCta";
import SiteFooter from "./SiteFooter";

export default function Home({ locale, messages }: { locale: Locale; messages: Messages }) {
  return (
    <main>
      <Hero locale={locale} messages={messages} />
      <ProductStory messages={messages} />
      <Benefits messages={messages} />
      <SystemLayers messages={messages} />
      <Positioning messages={messages} />
      <IdealCustomer messages={messages} />
      <Proof messages={messages} />
      <Pricing messages={messages} />
      <SevenDayPlan messages={messages} />
      <Faq messages={messages} />
      <FinalCta messages={messages} />
      <SiteFooter locale={locale} messages={messages} />
    </main>
  );
}
