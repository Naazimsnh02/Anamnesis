// Next.js client-side startup hook (App Router convention, runs in the
// browser). No-ops until NEXT_PUBLIC_SENTRY_DSN is set — mirrors
// src/instrumentation.ts's server-side gate.
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
