"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Catches errors thrown by (app)/layout.tsx's requireOrgContext() (e.g. the
// Postgres upsert failing) or any page/route under this group — without
// this boundary, a DB hiccup would take down the whole authenticated app
// with Next's default unstyled crash screen.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("(app) route error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center px-6">
      <div className="card max-w-md p-6 text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="display d-md mt-2 text-[var(--ink)]">Couldn&apos;t load this page</h1>
        <p className="lede mt-3 text-sm text-[var(--ink-soft)]">
          {error.message || "An unexpected error occurred."}
        </p>
        <button onClick={reset} className="btn btn-primary mt-6">
          Try again
        </button>
      </div>
    </div>
  );
}
