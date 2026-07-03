import { beforeEach, describe, expect, it, vi } from "vitest";

const cogneeForgetMock = vi.fn();
const requirePatientContextMock = vi.fn();

vi.mock("@/lib/cognee", () => ({ cogneeForget: cogneeForgetMock }));
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

function req(body: unknown) {
  return new Request("http://localhost/api/cognee/forget", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/cognee/forget", () => {
  it("400s when dataId is missing", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it("400s when the body isn't valid JSON", async () => {
    const res = await POST(new Request("http://localhost/api/cognee/forget", { method: "POST", body: "not json" }));
    expect(res.status).toBe(400);
  });

  it("scopes the forget() call to the active patient's own dataset, defaulting memoryOnly to false", async () => {
    requirePatientContextMock.mockResolvedValue({ patient: { datasetName: "ds-1" } });
    cogneeForgetMock.mockResolvedValue({ status: 200, body: { deleted: true } });

    const res = await POST(req({ dataId: "d1" }));
    expect(cogneeForgetMock).toHaveBeenCalledWith({ dataId: "d1", dataset: "ds-1", memoryOnly: false });
    expect(res.status).toBe(200);
  });

  it("passes through memoryOnly:true when explicitly requested", async () => {
    requirePatientContextMock.mockResolvedValue({ patient: { datasetName: "ds-1" } });
    cogneeForgetMock.mockResolvedValue({ status: 200, body: {} });

    await POST(req({ dataId: "d1", memoryOnly: true }));
    expect(cogneeForgetMock).toHaveBeenCalledWith({ dataId: "d1", dataset: "ds-1", memoryOnly: true });
  });

  it("returns 409 when the org has no patients yet", async () => {
    requirePatientContextMock.mockRejectedValue(new NoPatientsError());
    const res = await POST(req({ dataId: "d1" }));
    expect(res.status).toBe(409);
  });
});
