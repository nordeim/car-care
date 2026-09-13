"use client";

import { CalendarCheck, MessageCircleQuestion, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS } from "@/data/wcc/content";
import { useWccDialogs } from "@/lib/wcc/booking-store";

const MODES = ["Mobile", "Shop", "Pickup & Delivery"];

export function Hero() {
  const openBooking = useWccDialogs((s) => s.openBooking);
  const openQuestion = useWccDialogs((s) => s.openQuestion);

  return (
    <section id="top" className="grain relative isolate flex min-h-[100svh] items-end overflow-hidden">
      {/* backdrop */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/hero-car.webp"
          srcSet="
            /images/hero-car-640w.webp 640w,
            /images/hero-car-1024w.webp 1024w,
            /images/hero-car.webp 1344w
          "
          sizes="100vw"
          alt="Glossy black sedan with water beading on fresh paint inside a dark detailing studio"
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-background/35" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-32 sm:px-6 sm:pb-20">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent-teal">
          Auto Detailing &amp; Ceramic Coating — Framingham, MA
        </p>
        <p className="mb-5 mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-black/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary backdrop-blur-sm">
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
            ))}
          </span>
          {BUSINESS.stats.rating} · {BUSINESS.stats.vehicles} vehicles detailed
        </p>

        <h1 className="max-w-4xl font-display text-[2.6rem] font-bold uppercase leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Your Car
          <br />
          Deserves <span className="text-primary">Better.</span>
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-relaxed text-foreground/85">
          Real detailing. Real results. We don&apos;t cut corners — ever. Professional auto detailing
          &amp; ceramic coating in Framingham and MetroWest Boston.
        </p>

        <ul className="mt-5 flex flex-wrap items-center gap-2" aria-label="Service options">
          {MODES.map((m) => (
            <li
              key={m}
              className="rounded-full border border-border bg-black/40 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/90 backdrop-blur-sm"
            >
              {m}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            onClick={() => openBooking()}
            className="shine h-12 bg-primary px-7 font-display text-base font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90"
          >
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            Book Your Detail
          </Button>
          <Button
            variant="outline"
            onClick={openQuestion}
            className="h-12 border-border/80 bg-black/30 px-7 font-display text-base font-medium uppercase tracking-[0.14em] text-foreground backdrop-blur-sm hover:bg-accent hover:text-foreground"
          >
            <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
            Ask A Question
          </Button>
          <a
            href={BUSINESS.phoneHref}
            className="inline-flex h-12 items-center justify-center gap-2 px-4 font-display text-base font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:text-primary"
          >
            <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
            Call or Text {BUSINESS.phone}
          </a>
        </div>

        {/* stat band */}
        <dl className="mt-12 grid max-w-2xl grid-cols-3 divide-x divide-border rounded-lg border border-border bg-black/45 backdrop-blur-md">
          <div className="p-4 text-center sm:p-5">
            <dt className="order-2 mt-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Years in Business
            </dt>
            <dd className="order-1 font-display text-3xl font-semibold text-primary sm:text-4xl">
              {BUSINESS.stats.years}
            </dd>
          </div>
          <div className="p-4 text-center sm:p-5">
            <dt className="order-2 mt-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Vehicles Detailed
            </dt>
            <dd className="order-1 font-display text-3xl font-semibold text-primary sm:text-4xl">
              {BUSINESS.stats.vehicles}
            </dd>
          </div>
          <div className="p-4 text-center sm:p-5">
            <dt className="order-2 mt-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Star Rating
            </dt>
            <dd className="order-1 font-display text-3xl font-semibold text-primary sm:text-4xl">
              {BUSINESS.stats.rating}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
