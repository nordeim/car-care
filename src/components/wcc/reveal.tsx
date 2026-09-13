"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll-reveal wrapper (pattern ported from the home-financing
 * foundation): sections start hidden and animate in once they intersect
 * the viewport. prefers-reduced-motion is neutralized in globals.css.
 */
export function Reveal({
  children,
  variant = "text",
  delay = 0,
  className,
}: {
  children: ReactNode;
  variant?: "text" | "card";
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal=""
      className={[
        "transition-all duration-500 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : variant === "card"
            ? "translate-y-8 scale-[0.98] opacity-0"
            : "translate-y-6 opacity-0",
        className ?? "",
      ].join(" ")}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
