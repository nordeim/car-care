"use client";

import { CalendarCheck, MessageCircleQuestion, Phone, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/wcc/reveal";
import { BUSINESS } from "@/data/wcc/content";
import { useWccDialogs } from "@/lib/wcc/booking-store";

export function FinalCta() {
  const openBooking = useWccDialogs((s) => s.openBooking);
  const openQuestion = useWccDialogs((s) => s.openQuestion);

  return (
    <section
      aria-labelledby="final-cta-title"
      className="grain relative overflow-hidden border-t border-border bg-card py-20 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-primary/15 to-transparent"
      />
      <div className="relative mx-auto w-full max-w-5xl px-4 text-center sm:px-6">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <Flame className="h-4 w-4" aria-hidden="true" />
            Limited spots each week
          </p>
          <h2
            id="final-cta-title"
            className="mt-6 font-display text-5xl font-bold uppercase leading-[1.02] tracking-tight sm:text-7xl"
          >
            Your Vehicle
            <br />
            <span className="text-primary">Won&apos;t Wait.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Every week you wait, the salt keeps working and the interior keeps settling in. Book now
            and we&apos;ll handle everything — scheduling, pickup, the works.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => openBooking()}
              className="shine h-14 bg-primary px-9 font-display text-base font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90"
            >
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
              Book Now
            </Button>
            <a
              href={BUSINESS.phoneHref}
              className="inline-flex h-14 items-center justify-center gap-2.5 rounded-md border border-border bg-background px-7 font-display text-base font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
              Call or Text {BUSINESS.phone}
            </a>
            <Button
              variant="ghost"
              onClick={openQuestion}
              className="h-14 px-6 font-display text-base font-medium uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            >
              <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
              Ask a Question
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
