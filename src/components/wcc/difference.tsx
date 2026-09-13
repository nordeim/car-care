"use client";

import { CheckCircle2, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeforeAfter } from "@/components/wcc/before-after";
import { Reveal } from "@/components/wcc/reveal";
import { useWccDialogs } from "@/lib/wcc/booking-store";

const PILLARS = [
  "No rushed, quick-wipe cleanups — a true professional reset, inside and out",
  "Eco-friendly products that respect your paint and your driveway",
  "One team, one standard — every vehicle leaves like it's ours",
];

export function Difference() {
  const openBooking = useWccDialogs((s) => s.openBooking);

  return (
    <section id="difference" className="relative bg-background py-20 sm:py-28" aria-labelledby="difference-title">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Why We&apos;re Different
          </p>
          <h2
            id="difference-title"
            className="mt-3 max-w-3xl font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl"
          >
            Real Results — <span className="text-accent-teal">Not Quick Cleanups</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Most vehicles we see haven&apos;t been properly detailed in months — sometimes years. This
            isn&apos;t a wipe-down. It&apos;s a full professional reset, inside and out, finished to a
            standard you can see in the reflections.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {PILLARS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal variant="card">
            <figure>
              <BeforeAfter
                src="/images/interior-clean.webp"
                alt="Black leather interior"
                label="interior transformation"
              />
              <figcaption className="mt-3 flex items-baseline justify-between gap-3">
                <span className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
                  Interior Transformation
                </span>
                <span className="text-xs text-muted-foreground">Drag to compare · real customer work</span>
              </figcaption>
            </figure>
          </Reveal>
          <Reveal variant="card" delay={120}>
            <figure>
              <BeforeAfter
                src="/images/exterior-clean.webp"
                alt="Dark metallic paint on a fender"
                label="exterior transformation"
              />
              <figcaption className="mt-3 flex items-baseline justify-between gap-3">
                <span className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
                  Exterior Transformation
                </span>
                <span className="text-xs text-muted-foreground">Drag to compare · real customer work</span>
              </figcaption>
            </figure>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <div className="mt-10 flex flex-col items-start gap-4 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="relative hidden w-40 shrink-0 overflow-hidden rounded-md sm:block">
                <img
                  src="/images/detail-action.webp"
                  alt="Detailer machine polishing a black car under warm studio lights"
                  loading="lazy"
                  className="h-28 w-40 object-cover"
                />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-xl font-semibold uppercase tracking-wide">
                This is what a real detail looks like.
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Machine polish, clay decontamination, steam-sanitized interiors — every stage done by
                hand, in order, without skipping.
              </p>
            </div>
            <Button
              onClick={() => openBooking()}
              className="shine h-12 shrink-0 bg-primary px-6 font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90"
            >
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              View Packages &amp; Book
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
