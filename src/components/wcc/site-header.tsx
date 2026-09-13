"use client";

import { useEffect, useState } from "react";
import { Menu, Phone, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BUSINESS } from "@/data/wcc/content";
import { useWccDialogs } from "@/lib/wcc/booking-store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#difference", label: "Why We're Different" },
  { href: "#pricing", label: "Services & Pricing" },
  { href: "#ceramic", label: "Ceramic Coating" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

export function Logo({ className }: { className?: string }) {
  return (
    // No aria-label: the accessible name is composed from the link's content
    // (visible wordmark + sr-only hint), which satisfies WCAG 2.5.3
    // Label-in-Name by construction — an aria-label that re-states the
    // wordmark fails axe's label-content-name-mismatch when block-level
    // spans are concatenated without separators (audit cycle 2, M-2).
    <a href="#top" className={cn("group flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary font-display text-lg font-bold text-primary-foreground transition-transform group-hover:-rotate-6"
      >
        W
      </span>
      <span className="leading-none">
        <span className="block font-display text-lg font-semibold uppercase tracking-[0.12em] text-foreground">
          We Care
        </span>
        <span className="block font-display text-[11px] font-medium uppercase tracking-[0.34em] text-primary">
          Car Care
        </span>
      </span>
      <span className="sr-only"> — back to top</span>
    </a>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const openBooking = useWccDialogs((s) => s.openBooking);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/90 backdrop-blur-md"
          : "border-b border-transparent bg-gradient-to-b from-black/60 to-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <a
            href={BUSINESS.phoneHref}
            className="hidden items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary sm:flex"
          >
            <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="font-display tracking-wider">{BUSINESS.phone}</span>
          </a>
          <Button
            onClick={() => openBooking()}
            className="shine hidden h-10 bg-primary px-5 font-display text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90 sm:inline-flex"
          >
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            Book Your Detail
          </Button>

          {/* Mobile nav */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
                className="h-10 w-10 lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm border-border bg-background p-0">
              <SheetHeader className="border-b border-border p-5">
                <SheetTitle asChild>
                  <div>
                    <Logo />
                  </div>
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col p-3">
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-3 py-3.5 font-display text-base font-medium uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-accent"
                  >
                    {item.label}
                  </a>
                ))}
                <a
                  href={BUSINESS.phoneHref}
                  className="mt-2 flex items-center gap-2.5 rounded-md border border-border px-3 py-3.5 font-display text-base font-medium uppercase tracking-[0.12em] text-primary"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {BUSINESS.phone}
                </a>
                <Button
                  onClick={() => {
                    setMenuOpen(false);
                    openBooking();
                  }}
                  className="shine mt-3 h-12 bg-primary font-display text-base font-semibold uppercase tracking-[0.14em] text-primary-foreground hover:bg-primary/90"
                >
                  <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                  Book Your Detail
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
