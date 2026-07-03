import { beforeEach, describe, expect, it, vi } from "vitest";

const cogneeHealthMock = vi.fn();

vi.mock("@/lib/cognee", () => ({ cogneeHealth: cogneeHealthMock }));
vi.mock("@/lib/db/queries", () => ({
  NoPatientsError: class NoPatientsError extends Error {},
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  RateLimitedError: class RateLimitedError extends Error {},
}));

const { GET } = await import("./route");

beforeEach(() => vi.clearAllMocks());

describe("GET /api/cognee/health", () => {
  it("proxies the Cognee health status and body", async () => {
    cogneeHealthMock.mockResolvedValue({ status: 200, body: { status: "ok" } });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("returns 500 with the error message when the Cognee call throws", async () => {
    cogneeHealthMock.mockRejectedValue(new Error("connection refused"));
    const res = await GET();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "connection refused" });
  });
});
