import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const dbMock = { insert: vi.fn() };
vi.mock("@/lib/db/client", () => ({ db: dbMock }));

const { enforceRateLimit, RateLimitedError } = await import("./rate-limit");

function makeChain(count: number) {
  const chain: Record<string, unknown> = {};
  for (const m of ["values", "onConflictDoUpdate"]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.returning = vi.fn(async () => [{ count }]);
  return chain;
}

beforeEach(() => vi.clearAllMocks());

describe("enforceRateLimit", () => {
  it("allows the call when the window's count is at or under the limit", async () => {
    dbMock.insert.mockReturnValueOnce(makeChain(5));
    await expect(enforceRateLimit("clinician:1:upload", 20, 60)).resolves.toBeUndefined();
  });

  it("throws RateLimitedError once the count exceeds the limit", async () => {
    dbMock.insert.mockReturnValueOnce(makeChain(21));
    await expect(enforceRateLimit("clinician:1:upload", 20, 60)).rejects.toBeInstanceOf(
      RateLimitedError
    );
  });

  it("sets retryAfterSeconds to at most the window length", async () => {
    dbMock.insert.mockReturnValueOnce(makeChain(21));
    try {
      await enforceRateLimit("clinician:1:upload", 20, 60);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitedError);
      const rateLimitErr = err as InstanceType<typeof RateLimitedError>;
      expect(rateLimitErr.retryAfterSeconds).toBeGreaterThan(0);
      expect(rateLimitErr.retryAfterSeconds).toBeLessThanOrEqual(60);
    }
  });
});
