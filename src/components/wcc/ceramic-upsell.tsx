"use client";

import { Droplets, CalendarCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/wcc/reveal";
import { BeforeAfter } from "@/components/wcc/before-after";
import { CERAMIC_ADDON, CERAMIC_BENEFITS, BUSINESS } from "@/data/wcc/content";
import { useWccDialogs } from "@/lib/wcc/booking-store";

export function CeramicUpsell() {
  const openBooking = useWccDialogs((s) => s.openBooking);

  return (
    <section id="ceramic" className="grain relative overflow-hidden py-20 sm:py-28" aria-labelledby="ceramic-title">
      {/* ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Smart Add-On
          </p>
          <h2
            id="ceramic-title"
            className="mt-3 max-w-4xl font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl"
          >
            A Great Detail Is Step One.
            <br />
            <span className="text-primary">This Is What Makes It Last.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            We all live in New England — your vehicle deals with a lot. Road salt in the winter, sap
            and pollen in the summer, UV all year round. Ceramic coating keeps that just-detailed
            look far longer than any wax or sealant can.
          </p>
        </Reveal>

        {/* benefits grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CERAMIC_BENEFITS.map((b, i) => (
            <Reveal key={b.title} variant="card" delay={i * 80}>
              <article className="h-full rounded-lg border border-border bg-card p-6">
                <Droplets className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-display text-lg font-semibold uppercase tracking-wide">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* offer panel */}
        <Reveal delay={120}>
          <div className="mt-12 grid items-center gap-8 rounded-lg border border-primary/40 bg-gradient-to-br from-card to-secondary/60 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                Same Dirt. Completely Different Result.
              </p>
              <h3 className="mt-3 font-display text-2xl font-bold uppercase leading-tight sm:text-4xl">
                Add 1-Year Ceramic To Your Detail
              </h3>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
                {CERAMIC_ADDON.note} Water beads right off, grime stops sticking, and the gloss holds
                for a full year instead of a couple of months.
              </p>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-display text-5xl font-bold text-primary">
                  ${CERAMIC_ADDON.price}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  ${CERAMIC_ADDON.regularPrice}
                </span>
                <span className="rounded-full border border-primary/50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Bundle Price
                </span>
              </div>
              <Button
                onClick={() => openBooking("premium-full")}
                className="shine mt-7 h-12 bg-primary px-7 font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90"
              >
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                Add Ceramic Protection
              </Button>
            </div>
            <div>
              <BeforeAfter
                src="/images/ceramic-beads.webp"
                alt="Water beading on ceramic-coated paint"
                label="ceramic coating hydrophobic effect"
                className="aspect-[4/3]"
              />
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowRight className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Most customers add this once they see the difference. Ask about it at drop-off — or
                call {BUSINESS.phone}.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
