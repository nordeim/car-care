"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Drag-to-compare before/after slider.
 *
 * The "before" layer is the same photo as "after", run through a dirty-vision
 * CSS filter (dust, dullness, streaks) so both halves align pixel-perfectly —
 * the same trick used for real transformation shots.
 */
export function BeforeAfter({
  src,
  alt,
  label,
  className,
}: {
  src: string;
  alt: string;
  label: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(96, Math.max(4, pct)));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      setDragging(true);
      setFromClientX(e.clientX);
    },
    [setFromClientX],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      setFromClientX(e.clientX);
    },
    [dragging, setFromClientX],
  );

  const stop = useCallback(() => setDragging(false), []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPos((p) => Math.max(4, p - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPos((p) => Math.min(96, p + 5));
    }
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [dragging]);

  return (
    <div
      ref={containerRef}
      role="slider"
      aria-label={`Before and after comparison — ${label}. Use arrow keys to move the divider.`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      onKeyDown={onKeyDown}
      className={cn(
        "group relative aspect-[16/10] w-full touch-none select-none overflow-hidden rounded-lg border border-border bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {/* AFTER (clean) — base layer */}
      <img
        src={src}
        alt={`${alt} — after professional detailing`}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* BEFORE (filtered) — clipped to left of the divider */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        aria-hidden="true"
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            filter: "grayscale(0.55) sepia(0.28) brightness(0.62) contrast(0.86) saturate(0.7)",
          }}
        />
        {/* dust film + streaks overlay */}
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{
            background:
              "linear-gradient(105deg, rgba(94,78,50,0.28) 0%, rgba(60,55,44,0.14) 30%, rgba(94,86,60,0.22) 55%, rgba(52,48,40,0.12) 80%, rgba(88,74,48,0.3) 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(97deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 9px), radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.06), transparent 60%)",
          }}
        />
      </div>

      {/* labels */}
      <span className="pointer-events-none absolute left-3 top-3 rounded-sm bg-black/70 px-2.5 py-1 font-display text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
        Before
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-sm bg-primary px-2.5 py-1 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground">
        After
      </span>

      {/* divider + handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.55)]"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/60 text-white shadow-lg backdrop-blur-sm">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 6 4 12l5 6M15 6l5 6-5 6" />
          </svg>
        </div>
      </div>

      <span className="sr-only">
        Drag the handle (or use arrow keys) to compare the before and after states.
      </span>
    </div>
  );
}
