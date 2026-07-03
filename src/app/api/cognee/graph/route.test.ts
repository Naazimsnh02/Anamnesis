import { beforeEach, describe, expect, it, vi } from "vitest";

const cogneeGetGraphMock = vi.fn();
const cogneeListDatasetsMock = vi.fn();
const requirePatientContextMock = vi.fn();
const toClinicalGraphMock = vi.fn();

vi.mock("@/lib/cognee", () => ({
  cogneeGetGraph: cogneeGetGraphMock,
  cogneeListDatasets: cogneeListDatasetsMock,
}));
vi.mock("@/lib/graph", () => ({ toClinicalGraph: toClinicalGraphMock }));
vi.mock("@/lib/db/queries", () => ({
  requirePatientContext: requirePatientContextMock,
  NoPatientsError: class NoPatientsError extends Error {},
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  RateLimitedError: class RateLimitedError extends Error {},
}));

const { GET } = await import("./route");
const { NoPatientsError } = await import("@/lib/db/queries");

beforeEach(() => vi.clearAllMocks());

describe("GET /api/cognee/graph", () => {
  it("returns an empty graph when the patient has no matching dataset yet", async () => {
    requirePatientContextMock.mockResolvedValue({ patient: { datasetName: "ds-1" } });
    cogneeListDatasetsMock.mockResolvedValue({ status: 200, body: [{ id: "x", name: "other-dataset" }] });

    const res = await GET();
    expect(await res.json()).toEqual({ nodes: [], edges: [] });
    expect(cogneeGetGraphMock).not.toHaveBeenCalled();
  });

  it("fetches and converts the graph when the dataset exists", async () => {
    requirePatientContextMock.mockResolvedValue({ patient: { datasetName: "ds-1" } });
    cogneeListDatasetsMock.mockResolvedValue({ status: 200, body: [{ id: "ds-id-1", name: "ds-1" }] });
    cogneeGetGraphMock.mockResolvedValue({ status: 200, body: { raw: true } });
    toClinicalGraphMock.mockReturnValue({ nodes: [{ id: "n1" }], edges: [] });

    const res = await GET();
    expect(cogneeGetGraphMock).toHaveBeenCalledWith("ds-id-1");
    expect(await res.json()).toEqual({ nodes: [{ id: "n1" }], edges: [] });
  });

  it("surfaces a >=400 dataset-list failure with the same status", async () => {
    requirePatientContextMock.mockResolvedValue({ patient: { datasetName: "ds-1" } });
    cogneeListDatasetsMock.mockResolvedValue({ status: 503, body: { detail: "down" } });

    const res = await GET();
    expect(res.status).toBe(503);
  });

  it("returns 409 when the org has no patients yet", async () => {
    requirePatientContextMock.mockRejectedValue(new NoPatientsError());
    const res = await GET();
    expect(res.status).toBe(409);
  });
});
