import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { rateLimitBuckets } from "@/lib/db/schema";

export class RateLimitedError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super("Rate limit exceeded — try again shortly.");
    this.name = "RateLimitedError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// Fixed-window counter backed by Postgres (see rateLimitBuckets in schema.ts
// for why this can't just be an in-memory Map on Vercel's stateless
// functions). Every call for the same `key` within the same `windowSeconds`
// bucket increments one row; once the count exceeds `limit`, throws
// RateLimitedError with how long until the window resets.
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<void> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowStartSeconds = nowSeconds - (nowSeconds % windowSeconds);
  const windowStart = new Date(windowStartSeconds * 1000);

  const [row] = await db
    .insert(rateLimitBuckets)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimitBuckets.key, rateLimitBuckets.windowStart],
      set: { count: sql`${rateLimitBuckets.count} + 1` },
    })
    .returning();

  if (row.count > limit) {
    const resetAtSeconds = windowStartSeconds + windowSeconds;
    const retryAfterSeconds = Math.max(1, resetAtSeconds - nowSeconds);
    throw new RateLimitedError(retryAfterSeconds);
  }
}
