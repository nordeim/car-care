"use client";

import { Check, CalendarCheck, Sofa } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/wcc/reveal";
import { INTERIOR_ONLY } from "@/data/wcc/content";
import { usd } from "@/lib/wcc/booking";
import { useWccDialogs } from "@/lib/wcc/booking-store";

export function InteriorOnly() {
  const openBooking = useWccDialogs((s) => s.openBooking);

  return (
    <section className="relative py-20 sm:py-28" aria-labelledby="interior-title">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Not every vehicle needs a full detail — and that&apos;s okay.
          </p>
          <h2
            id="interior-title"
            className="mt-3 font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl"
          >
            Only Need the <span className="text-accent-teal">Interior</span> Done?
          </h2>
        </Reveal>

        <Reveal variant="card" delay={100}>
          <div className="mt-10 grid items-stretch gap-0 overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[1fr_1.1fr]">
            <div className="relative min-h-64">
              <img
                src="/images/interior-detail.webp"
                alt="Detailer steam cleaning a black leather interior"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute left-4 top-4 rounded-sm bg-black/70 px-2.5 py-1 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                Steam-sanitized
              </span>
            </div>
            <div className="flex flex-col p-6 sm:p-9">
              <div className="flex items-center gap-2.5">
                <Sofa className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="font-display text-2xl font-semibold uppercase tracking-wide">
                  {INTERIOR_ONLY.name}
                </h3>
              </div>
              <p className="mt-1 text-sm font-medium uppercase tracking-[0.14em] text-primary">
                {INTERIOR_ONLY.tagline}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {INTERIOR_ONLY.description}
              </p>

              <div className="mt-5 flex items-baseline gap-2.5">
                <span className="font-display text-4xl font-bold text-foreground">
                  {usd(INTERIOR_ONLY.prices.sedan)}
                </span>
                <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Sedan · or {usd(INTERIOR_ONLY.prices.suv)} for SUV / Truck / Van
                </span>
              </div>

              <ul className="mt-6 grid flex-1 gap-2.5 sm:grid-cols-2">
                {INTERIOR_ONLY.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => openBooking(INTERIOR_ONLY.key)}
                className="shine mt-7 h-12 w-full bg-primary font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90 sm:w-auto sm:self-start sm:px-8"
              >
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                Book Interior Detail
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
