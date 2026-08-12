import type { Locale, Messages } from "@/lib/i18n";
import Hero from "./Hero";
import ProductStory from "./ProductStory";
import Benefits from "./Benefits";
import Positioning from "./Positioning";
import IdealCustomer from "./IdealCustomer";
import Pricing from "./Pricing";
import SevenDayPlan from "./SevenDayPlan";
import Faq from "./Faq";
import FinalCta from "./FinalCta";
import SiteFooter from "./SiteFooter";

export default function Home({ locale, messages }: { locale: Locale; messages: Messages }) {
  return (
    <main>
      <Hero locale={locale} messages={messages} />
      <Positioning messages={messages} />
      <Benefits messages={messages} />
      <ProductStory messages={messages} />
      <IdealCustomer messages={messages} />
      <Pricing messages={messages} />
      <SevenDayPlan messages={messages} />
      <Faq messages={messages} />
      <FinalCta messages={messages} />
      <SiteFooter locale={locale} messages={messages} />
    </main>
  );
}
