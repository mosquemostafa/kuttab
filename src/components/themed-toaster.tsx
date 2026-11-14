"use client";

import type { CSSProperties } from "react";
import { Toaster } from "react-hot-toast";

/** Uses design tokens so light/dark follow `html` class from next-themes. */
const surface: CSSProperties = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  boxShadow: "0 4px 14px oklch(0 0 0 / 0.14)",
};

export function ThemedToaster() {
  return (
    <Toaster
      toastOptions={{
        style: surface,
        success: {
          style: surface,
          iconTheme: {
            primary: "rgb(34 197 94)",
            secondary: "#ffffff",
          },
        },
        error: {
          style: surface,
          iconTheme: {
            primary: "rgb(239 68 68)",
            secondary: "#ffffff",
          },
        },
        loading: {
          style: surface,
          iconTheme: {
            primary: "var(--foreground)",
            secondary: "var(--muted)",
          },
        },
      }}
    />
  );
}
