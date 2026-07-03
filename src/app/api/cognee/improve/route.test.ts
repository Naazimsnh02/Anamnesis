import { beforeEach, describe, expect, it, vi } from "vitest";

const cogneeImproveMock = vi.fn();
const requirePatientContextMock = vi.fn();

vi.mock("@/lib/cognee", () => ({ cogneeImprove: cogneeImproveMock }));
vi.mock("@/lib/db/queries", () => ({
  requirePatientContext: requirePatientContextMock,
  NoPatientsError: class NoPatientsError extends Error {},
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  RateLimitedError: class RateLimitedError extends Error {},
}));

const { POST } = await import("./route");
const { NoPatientsError } = await import("@/lib/db/queries");

beforeEach(() => vi.clearAllMocks());

describe("POST /api/cognee/improve", () => {
  it("calls cogneeImprove with the active patient's dataset and returns its body", async () => {
    requirePatientContextMock.mockResolvedValue({ patient: { datasetName: "ds-1" } });
    cogneeImproveMock.mockResolvedValue({ status: 200, body: { improved: true } });

    const res = await POST();
    expect(cogneeImproveMock).toHaveBeenCalledWith("ds-1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ improved: true });
  });

  it("returns 409 when the org has no patients yet", async () => {
    requirePatientContextMock.mockRejectedValue(new NoPatientsError());
    const res = await POST();
    expect(res.status).toBe(409);
  });

  it("returns 500 for unexpected errors", async () => {
    requirePatientContextMock.mockRejectedValue(new Error("boom"));
    const res = await POST();
    expect(res.status).toBe(500);
  });
});
