"use client";

import { MapPin, Phone, Mail, Clock, Leaf } from "lucide-react";
import { Logo } from "@/components/wcc/site-header";
import { BUSINESS, SERVICE_AREAS } from "@/data/wcc/content";

const FOOTER_NAV = [
  { href: "#difference", label: "Why We're Different" },
  { href: "#pricing", label: "Services & Pricing" },
  { href: "#ceramic", label: "Ceramic Coating" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background" aria-label="Site footer">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* brand + about */}
          <div>
            <Logo />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Based in Framingham, MA, {BUSINESS.name} provides professional auto detailing, ceramic
              coating, and paint protection throughout MetroWest Boston. Showroom-quality results,
              eco-friendly products, and over 16 years of hands-on experience — shop, mobile, or
              pickup &amp; delivery.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Leaf className="h-4 w-4" aria-hidden="true" />
              Eco-Friendly Auto Detailing · Since {BUSINESS.since}
            </p>
          </div>

          {/* contact */}
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
              Contact
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {BUSINESS.address}
              </li>
              <li>
                <a
                  href={BUSINESS.phoneHref}
                  className="flex items-center gap-2.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {BUSINESS.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="flex items-center gap-2.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {BUSINESS.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {BUSINESS.hours}
              </li>
            </ul>
          </div>

          {/* nav + areas */}
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
              Explore
            </h2>
            <nav aria-label="Footer" className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {FOOTER_NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <h2 className="mt-7 font-display text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
              Service Areas
            </h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {SERVICE_AREAS.map((area) => (
                <li
                  key={area}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          {/* suppressHydrationWarning: the year is computed at prerender AND
              on hydration — over a New Year boundary the prerendered HTML can
              legitimately differ by one year from the hydrating client. */}
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} {BUSINESS.name} · MetroWest Boston Auto Detailing
          </p>
          <p>
            {BUSINESS.address} ·{" "}
            <a href={BUSINESS.phoneHref} className="transition-colors hover:text-primary">
              {BUSINESS.phone}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
