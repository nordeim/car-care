"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

/**
 * Sonner toaster. The site is dark-only (see `layout.tsx` `className="dark"`),
 * so the theme is pinned instead of pulling in next-themes.
 */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="dark"
    className="toaster group"
    style={
      {
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      } as React.CSSProperties
    }
    {...props}
  />
);

export { Toaster };
