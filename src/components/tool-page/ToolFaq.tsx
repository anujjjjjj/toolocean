import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section } from "./Section";
import type { ToolFaqEntry } from "@/types/toolContent";

/**
 * Two non-obvious constraints drive this component:
 *
 * 1. Radix's Accordion.Header already renders an <h3> around the trigger, so the
 *    question text is passed as a plain string. Wrapping it in our own heading
 *    would nest <h3> inside a <button>, which is invalid (button only accepts
 *    phrasing content) and breaks heading-order tooling.
 *
 * 2. Radix unmounts collapsed content by default. That would leave every answer
 *    out of the prerendered HTML while the FAQPage JSON-LD still claimed it,
 *    a visible-content mismatch. `forceMount` keeps the answers in the DOM at
 *    all times; Radix marks them [hidden] when collapsed, which Google's FAQ
 *    guidance explicitly permits for expandable answers.
 */
export function ToolFaq({ faqs, heading, lede }: { faqs: ToolFaqEntry[]; heading: string; lede?: string }) {
  if (faqs.length === 0) return null;

  return (
    <Section id="faq" heading={heading} lede={lede}>
      <Accordion type="multiple" className="mx-auto max-w-3xl">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.question} value={`faq-${index}`}>
            <AccordionTrigger className="text-left font-heading text-base font-medium hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent forceMount className="text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}
