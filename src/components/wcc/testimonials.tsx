"use client";

import { Star, Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Reveal } from "@/components/wcc/reveal";
import { BUSINESS, TESTIMONIALS } from "@/data/wcc/content";

export function Testimonials() {
  return (
    <section
      id="reviews"
      className="relative border-y border-border bg-secondary/40 py-20 sm:py-28"
      aria-labelledby="reviews-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Don&apos;t Take Our Word For It
          </p>
          <h2
            id="reviews-title"
            className="mt-3 font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl"
          >
            Real People. Real Results.
          </h2>
          <p className="mt-4 inline-flex flex-wrap items-center gap-2.5 text-lg text-muted-foreground">
            <span className="flex items-center gap-1" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-5 w-5 fill-primary text-primary" />
              ))}
            </span>
            <strong className="font-display text-xl text-foreground">{BUSINESS.stats.rating}</strong>
            · {BUSINESS.stats.reviewCount} reviews on Google
          </p>
        </Reveal>
      </div>

      <Reveal
        delay={120}
        className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6 xl:px-20"
      >
        <Carousel
          opts={{ align: "start", loop: true }}
          aria-label="Customer reviews carousel"
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {TESTIMONIALS.map((t) => (
              <CarouselItem key={t.name + t.date} className="pl-4 md:basis-1/2 xl:basis-1/3">
                <figure className="flex h-full flex-col rounded-lg border border-border bg-card p-6">
                  <Quote className="h-6 w-6 text-primary/70" aria-hidden="true" />
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                    {t.text}
                  </blockquote>
                  <figcaption className="mt-5 border-t border-border pt-4">
                    <span className="flex items-center gap-1" aria-label="Rated 5 out of 5 stars">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
                      ))}
                    </span>
                    <span className="mt-2 block font-display text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
                      {t.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{t.date}</span>
                  </figcaption>
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* Arrows live in the outer gutter (xl+) so they never cover card
              text; below xl the carousel is swipe/drag + keyboard driven. */}
          <CarouselPrevious
            className="max-xl:hidden h-11 w-11 border-border bg-background/90 text-foreground shadow-md backdrop-blur-sm hover:bg-accent"
            aria-label="Previous reviews"
          />
          <CarouselNext
            className="max-xl:hidden h-11 w-11 border-border bg-background/90 text-foreground shadow-md backdrop-blur-sm hover:bg-accent"
            aria-label="Next reviews"
          />
        </Carousel>
      </Reveal>
    </section>
  );
}
