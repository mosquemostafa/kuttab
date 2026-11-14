"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

/** App Router root error boundary (Sentry manual setup). */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html suppressHydrationWarning>
      <body>
        {/*
          `NextError` requires `statusCode`; App Router does not expose it for errors,
          so we pass 0 for a generic message (see Sentry Next.js manual setup).
        */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
