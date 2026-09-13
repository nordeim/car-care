"use client";

import { useState } from "react";
import { Check, Car, Truck, CalendarCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/wcc/reveal";
import { PACKAGES, type VehicleType } from "@/data/wcc/content";
import { usd } from "@/lib/wcc/booking";
import { useWccDialogs } from "@/lib/wcc/booking-store";
import { cn } from "@/lib/utils";

export function Packages() {
  const [vehicle, setVehicle] = useState<VehicleType>("sedan");
  const openBooking = useWccDialogs((s) => s.openBooking);

  return (
    <section
      id="pricing"
      className="relative border-y border-border bg-secondary/40 py-20 sm:py-28"
      aria-labelledby="pricing-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Services &amp; Pricing
          </p>
          <h2
            id="pricing-title"
            className="mt-3 font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl"
          >
            Choose Your Level of Detail
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            No shortcuts. No hidden fees. Just real results — and a clear price before we touch the
            car. Most customers choose the Premium package for the best overall result.
          </p>
        </Reveal>

        {/* vehicle type toggle */}
        <Reveal delay={80}>
          <div
            role="radiogroup"
            aria-label="Vehicle type"
            className="mt-8 inline-flex rounded-md border border-border bg-background p-1"
          >
            <button
              role="radio"
              aria-checked={vehicle === "sedan"}
              onClick={() => setVehicle("sedan")}
              className={cn(
                "flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors",
                vehicle === "sedan"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Car className="h-4 w-4" aria-hidden="true" />
              Sedan
            </button>
            <button
              role="radio"
              aria-checked={vehicle === "suv"}
              onClick={() => setVehicle("suv")}
              className={cn(
                "flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors",
                vehicle === "suv"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Truck className="h-4 w-4" aria-hidden="true" />
              SUV / Truck / Van
            </button>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {PACKAGES.map((pkg, idx) => (
            <Reveal key={pkg.key} variant="card" delay={idx * 100}>
              <article
                className={cn(
                  "relative flex h-full flex-col rounded-lg border bg-card p-6 sm:p-8",
                  pkg.popular ? "border-primary/70 shadow-[0_0_50px_-18px_rgba(242,166,28,0.45)]" : "border-border",
                )}
              >
                {pkg.popular && (
                  <span className="absolute -top-3.5 left-6 rounded-full bg-primary px-3.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.22em] text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-2xl font-semibold uppercase tracking-wide">
                  {pkg.name}
                </h3>
                <p className="mt-1 text-sm font-medium uppercase tracking-[0.14em] text-primary">
                  {pkg.tagline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pkg.description}</p>

                <div className="mt-5 flex items-baseline gap-2.5">
                  <span className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                    {usd(pkg.prices[vehicle])}
                  </span>
                  <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {vehicle === "sedan" ? "Sedan" : "SUV / Truck / Van"} · {pkg.durationHours}
                  </span>
                </div>

                <h4 className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  What&apos;s included
                </h4>
                <ul className="mt-3 grid flex-1 gap-2.5 sm:grid-cols-2">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                  <Button
                    onClick={() => openBooking(pkg.key)}
                    className="shine h-12 flex-1 bg-primary font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90"
                  >
                    <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                    Book Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openBooking(pkg.key)}
                    className="h-12 border-border font-display text-sm font-medium uppercase tracking-[0.14em] hover:bg-accent hover:text-foreground"
                  >
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                    Smart Add-On
                  </Button>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Final pricing may vary with vehicle condition — heavy pet hair, sap, or neglect may
                  need extra time. We&apos;ll always confirm before starting.
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
