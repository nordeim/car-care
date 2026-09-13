"use client";

import { Check, CalendarCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/wcc/reveal";
import { CERAMIC_TIERS } from "@/data/wcc/content";
import { usd } from "@/lib/wcc/booking";
import { useWccDialogs } from "@/lib/wcc/booking-store";
import { cn } from "@/lib/utils";

export function CeramicTiers() {
  const openBooking = useWccDialogs((s) => s.openBooking);

  return (
    <section
      className="relative border-y border-border bg-secondary/40 py-20 sm:py-28"
      aria-labelledby="ceramic-tiers-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Ceramic Coating
          </p>
          <h2
            id="ceramic-tiers-title"
            className="mt-3 font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl"
          >
            Protect Your Paint. <span className="text-accent-teal">Elevate Your Vehicle.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A professional-grade ceramic layer that shields your paint, amplifies gloss, and makes
            maintenance effortless — for years, not months. Already getting the Premium Detail?
            Upgrading to ceramic simply protects that result for longer.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {CERAMIC_TIERS.map((tier, idx) => (
            <Reveal key={tier.key} variant="card" delay={idx * 90}>
              <article
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-lg border bg-card",
                  tier.popular
                    ? "border-primary/70 shadow-[0_0_50px_-18px_rgba(242,166,28,0.45)]"
                    : "border-border",
                )}
              >
                {tier.popular && (
                  <div className="relative aspect-[16/5] w-full overflow-hidden border-b border-border">
                    <img
                      src="/images/ceramic-beads.webp"
                      alt="Water beading tightly on a ceramic-coated dark blue panel"
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent"
                      aria-hidden="true"
                    />
                    <span className="absolute left-6 top-5 rounded-full bg-primary px-3.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.22em] text-primary-foreground">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h3 className="font-display text-2xl font-semibold uppercase tracking-wide">
                      {tier.name}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tier.description}</p>

                  {/* dual pricing — both vehicle classes always visible */}
                  <div className="mt-5 divide-y divide-border rounded-md border border-border bg-background/60">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Sedan / Coupe
                      </span>
                      <span className="font-display text-2xl font-semibold text-foreground">
                        {usd(tier.prices.sedan)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        SUV / Truck / Van
                      </span>
                      <span className="font-display text-2xl font-semibold text-foreground">
                        {usd(tier.prices.suv)}
                      </span>
                    </div>
                  </div>

                  <h4 className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    What&apos;s included
                  </h4>
                  <ul className="mt-3 flex-1 space-y-2.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/85">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => openBooking(tier.key)}
                    className={cn(
                      "shine mt-7 h-12 w-full font-display text-sm font-semibold uppercase tracking-[0.14em]",
                      tier.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border bg-transparent text-foreground hover:bg-accent",
                    )}
                  >
                    <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                    Book Now
                  </Button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            * Final pricing may vary based on vehicle condition. Paint with heavy swirling,
            oxidation, or damage may require additional correction before coating application —
            we&apos;ll inspect and confirm before any work begins.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
