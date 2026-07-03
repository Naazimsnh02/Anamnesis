import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePatientContextMock = vi.fn();
const getRosterMock = vi.fn();

vi.mock("@/lib/db/queries", () => ({
  requirePatientContext: requirePatientContextMock,
  NoPatientsError: class NoPatientsError extends Error {},
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  RateLimitedError: class RateLimitedError extends Error {},
}));
vi.mock("@/lib/roster", () => ({ getRoster: getRosterMock }));

const { GET } = await import("./route");
const { NoPatientsError } = await import("@/lib/db/queries");

beforeEach(() => vi.clearAllMocks());

describe("GET /api/documents/roster", () => {
  it("returns the active patient's roster plus patient info", async () => {
    requirePatientContextMock.mockResolvedValue({ patient: { id: "p1", name: "Alice" } });
    getRosterMock.mockResolvedValue({ diagnoses: [], medications: [], documents: [] });

    const res = await GET();
    expect(await res.json()).toEqual({
      diagnoses: [],
      medications: [],
      documents: [],
      patient: { id: "p1", name: "Alice" },
    });
  });

  it("returns 409 when the org has no patients yet", async () => {
    requirePatientContextMock.mockRejectedValue(new NoPatientsError());
    const res = await GET();
    expect(res.status).toBe(409);
  });
});
