import type { Messages } from "@/lib/i18n";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Faq({ messages }: { messages: Messages }) {
  const { home } = messages;

  return (
    <section className="border-t border-[var(--line)] py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-10">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--lima)]">
            {home.faqLabel}
          </span>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.02em] text-[var(--text-primary)] sm:text-4xl">
            {home.faqTitle}
          </h2>
        </div>

        <Accordion type="single" collapsible className="rounded-[var(--r-xl)] border border-[var(--line)] px-5">
          {home.faqs.map(([question, answer]) => (
            <AccordionItem key={question} value={question}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
