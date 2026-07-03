import "server-only";

// Structured, one-line-per-event server logging. Plain console.error() calls
// scattered through the route handlers were untraceable (no event name, no
// context, no consistent shape) — this gives every "best-effort, non-fatal"
// failure (storeOriginalDocument, cogneeImprove, cogneeForget, seed-demo
// remember()) a single JSON line that's greppable in Vercel's log viewer and
// forwards to Sentry when SENTRY_DSN is configured (see instrumentation.ts).
export function logError(event: string, err: unknown, context?: Record<string, unknown>) {
  const entry = {
    level: "error" as const,
    event,
    message: err instanceof Error ? err.message : String(err),
    ...context,
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(entry));

  if (process.env.SENTRY_DSN) {
    import("@sentry/nextjs")
      .then((Sentry) =>
        Sentry.captureException(err, { tags: { event }, extra: context })
      )
      .catch(() => {});
  }
}
