"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/wcc/reveal";
import { FAQS } from "@/data/wcc/content";

export function Faq() {
  return (
    <section id="faq" className="relative py-20 sm:py-28" aria-labelledby="faq-title">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Got Questions?
          </p>
          <h2
            id="faq-title"
            className="mt-3 font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl"
          >
            Frequently Asked Questions
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <Accordion type="single" collapsible className="mt-10">
            {FAQS.map((faq, i) => (
              <AccordionItem key={faq.question} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left font-display text-base font-medium uppercase tracking-[0.06em] hover:text-primary hover:no-underline sm:text-lg [&>svg]:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
