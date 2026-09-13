"use client";

import { CalendarCheck, MessageCircleQuestion, Phone, Star } from "lucide-react";
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
      className="relative isolate overflow-hidden border-t border-border py-24 sm:py-36"
    >
      {/* backdrop */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/detail-action.webp"
          alt=""
          loading="lazy"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-background/88" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40" aria-hidden="true" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 text-center sm:px-6">
        <Reveal>
          <p
            className="inline-flex items-center gap-2 rounded-full border border-border bg-black/45 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm"
            aria-label={`Rated ${BUSINESS.stats.rating} out of 5 stars from ${BUSINESS.stats.reviewCount} Google reviews`}
          >
            <span className="flex items-center gap-0.5" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
              ))}
            </span>
            {BUSINESS.stats.rating} · {BUSINESS.stats.reviewCount} Google reviews
          </p>
          <h2
            id="final-cta-title"
            className="mt-6 font-display text-5xl font-bold uppercase leading-[1.02] tracking-tight text-white sm:text-7xl"
          >
            Your Vehicle
            <br />
            <span className="text-primary">Won&apos;t Wait.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-foreground/85">
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
            <Button
              variant="outline"
              onClick={openQuestion}
              className="h-14 border-border/80 bg-black/30 px-7 font-display text-base font-medium uppercase tracking-[0.14em] text-foreground backdrop-blur-sm hover:bg-accent hover:text-foreground"
            >
              <MessageCircleQuestion className="h-5 w-5 text-primary" aria-hidden="true" />
              Ask a Question
            </Button>
          </div>
          <a
            href={BUSINESS.phoneHref}
            className="mt-6 inline-flex items-center gap-2 font-display text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Prefer to talk? Call or text {BUSINESS.phone}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
