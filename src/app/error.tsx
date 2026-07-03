"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Root-level boundary for pages outside the (app) group — onboarding, the
// marketing page, sign-in/up — so a server-side error (e.g. auth() failing)
// shows a recoverable message instead of Next's default crash screen.
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("root route error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="eyebrow mb-2">Something went wrong</p>
        <h1 className="text-2xl font-medium">Couldn&apos;t load this page</h1>
        <p className="mt-2 text-sm text-black/60">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
