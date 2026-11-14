"use client";

/**
 * Sentry verification page — https://docs.sentry.io/platforms/javascript/guides/nextjs/
 * Open http://localhost:3000/sentry-example-page and click “Throw Sample Error”.
 */
export default function SentryExamplePage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">Sentry example</h1>
      <p className="text-sm text-muted-foreground">
        Click the button below to throw a sample error and confirm it appears in
        Sentry Issues.
      </p>
      <button
        type="button"
        className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        onClick={() => {
          throw new Error("Sentry Test Error");
        }}
      >
        Throw Sample Error
      </button>
    </main>
  );
}
