"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { BUSINESS } from "@/data/wcc/content";

/**
 * Mobile-only floating "call" button, mirroring the source site's phone FAB.
 * Appears after the visitor scrolls past the hero (which already carries the
 * phone link) and hides again near the footer CTA column to avoid overlap.
 */
export function CallFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={BUSINESS.phoneHref}
      aria-label={`Call ${BUSINESS.name} at ${BUSINESS.phone}`}
      className={
        "fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full " +
        "bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(242,166,28,0.65)] " +
        "transition-all duration-300 motion-reduce:transition-none lg:hidden " +
        (visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")
      }
    >
      <Phone className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}
