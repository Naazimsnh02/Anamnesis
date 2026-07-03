import { beforeEach, describe, expect, it, vi } from "vitest";

const cogneeRecallMock = vi.fn();
const requirePatientContextMock = vi.fn();

vi.mock("@/lib/cognee", () => ({ cogneeRecall: cogneeRecallMock }));
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
  return new Request("http://localhost/api/cognee/recall", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/cognee/recall", () => {
  it("400s when query is missing or blank", async () => {
    const res = await POST(req({ query: "  " }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "query is required" });
  });

  it("returns the parsed answer/evidence on success", async () => {
    requirePatientContextMock.mockResolvedValue({ patient: { datasetName: "ds-1" } });
    cogneeRecallMock.mockResolvedValue({
      status: 200,
      body: [{ text: "Kidney function is declining.", source: "graph_completion" }],
    });

    const res = await POST(req({ query: "why is kidney function declining?" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.answer).toBe("Kidney function is declining.");
    expect(json.source).toBe("graph_completion");
    expect(json.raw).toBeDefined();
  });

  it("propagates a >=400 Cognee status as an error envelope with the same status", async () => {
    requirePatientContextMock.mockResolvedValue({ patient: { datasetName: "ds-1" } });
    cogneeRecallMock.mockResolvedValue({ status: 502, body: { detail: "upstream down" } });

    const res = await POST(req({ query: "test" }));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe("Recall failed");
  });

  it("returns 409 when the org has no patients yet", async () => {
    requirePatientContextMock.mockRejectedValue(new NoPatientsError());
    const res = await POST(req({ query: "test" }));
    expect(res.status).toBe(409);
  });

  it("returns 500 with the error message for unexpected errors", async () => {
    requirePatientContextMock.mockRejectedValue(new Error("db exploded"));
    const res = await POST(req({ query: "test" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "db exploded" });
  });
});
