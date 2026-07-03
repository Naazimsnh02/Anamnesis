import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePatientContextMock = vi.fn();
const extractEntitiesFromDocumentMock = vi.fn();
const storeOriginalDocumentMock = vi.fn();
const getRosterMock = vi.fn();
const saveRosterMock = vi.fn();
const findDuplicateDocumentMock = vi.fn();
const mergeEntitiesIntoRosterMock = vi.fn();
const cogneeRememberMock = vi.fn();
const cogneeImproveMock = vi.fn();
const cogneeForgetMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock("@/lib/db/queries", () => ({
  requirePatientContext: requirePatientContextMock,
  NoPatientsError: class NoPatientsError extends Error {},
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
  RateLimitedError: class RateLimitedError extends Error {
    constructor(public retryAfterSeconds: number) {
      super("Rate limit exceeded");
    }
  },
}));
vi.mock("@/lib/gemini", () => ({ extractEntitiesFromDocument: extractEntitiesFromDocumentMock }));
vi.mock("@/lib/storage", () => ({ storeOriginalDocument: storeOriginalDocumentMock }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));
vi.mock("@/lib/roster", () => ({
  getRoster: getRosterMock,
  saveRoster: saveRosterMock,
  findDuplicateDocument: findDuplicateDocumentMock,
  mergeEntitiesIntoRoster: mergeEntitiesIntoRosterMock,
}));
vi.mock("@/lib/cognee", () => ({
  cogneeRemember: cogneeRememberMock,
  cogneeImprove: cogneeImproveMock,
  cogneeForget: cogneeForgetMock,
}));

const { POST } = await import("./route");
const { NoPatientsError } = await import("@/lib/db/queries");

function uploadReq(file: File | null) {
  const form = new FormData();
  if (file) form.set("file", file);
  return new Request("http://localhost/api/documents/upload", { method: "POST", body: form });
}

const entities = {
  documentType: "blood_report",
  documentDate: "2024-01-01",
  summary: "s",
  diagnoses: [],
  medications: [],
  labValues: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  requirePatientContextMock.mockResolvedValue({
    patient: { id: "p1", name: "Alice", datasetName: "ds-1" },
    clinicianId: "clin-1",
  });
  enforceRateLimitMock.mockResolvedValue(undefined);
  extractEntitiesFromDocumentMock.mockResolvedValue(entities);
  storeOriginalDocumentMock.mockResolvedValue("https://blob/doc.pdf");
  getRosterMock.mockResolvedValue({ diagnoses: [], medications: [], documents: [] });
  findDuplicateDocumentMock.mockReturnValue(null);
  mergeEntitiesIntoRosterMock.mockReturnValue({ diagnoses: [], medications: [], documents: [{ dataId: "d1" }] });
  cogneeRememberMock.mockResolvedValue({ status: 200, body: { items: [{ id: "d1" }] } });
  cogneeImproveMock.mockResolvedValue({ status: 200, body: {} });
});

describe("POST /api/documents/upload", () => {
  it("400s when no file is provided", async () => {
    const res = await POST(uploadReq(null));
    expect(res.status).toBe(400);
  });

  it("extracts entities, remembers the narrative, and merges into the roster on success", async () => {
    const file = new File(["fake pdf bytes"], "report.pdf", { type: "application/pdf" });
    const res = await POST(uploadReq(file));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.merged).toBe(false);
    expect(cogneeRememberMock).toHaveBeenCalled();
    expect(cogneeImproveMock).toHaveBeenCalledWith("ds-1");
    expect(saveRosterMock).toHaveBeenCalled();
  });

  it("still succeeds when original-file storage fails (best-effort, not fatal)", async () => {
    storeOriginalDocumentMock.mockRejectedValue(new Error("blob down"));
    const file = new File(["bytes"], "report.pdf", { type: "application/pdf" });
    const res = await POST(uploadReq(file));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.documentUrl).toBeNull();
  });

  it("forgets the superseded document and reports merged:true when a duplicate is found", async () => {
    findDuplicateDocumentMock.mockReturnValue({ dataId: "old-id", documentType: "blood_report", documentDate: "2024-01-01", narrative: "old" });
    cogneeForgetMock.mockResolvedValue({ status: 200, body: {} });

    const file = new File(["bytes"], "report.pdf", { type: "application/pdf" });
    const res = await POST(uploadReq(file));

    expect(cogneeForgetMock).toHaveBeenCalledWith({ dataId: "old-id", dataset: "ds-1" });
    const json = await res.json();
    expect(json.merged).toBe(true);
  });

  it("still succeeds when the duplicate forget() call fails (best-effort)", async () => {
    findDuplicateDocumentMock.mockReturnValue({ dataId: "old-id", documentType: "blood_report", documentDate: "2024-01-01", narrative: "old" });
    cogneeForgetMock.mockRejectedValue(new Error("forget failed"));

    const file = new File(["bytes"], "report.pdf", { type: "application/pdf" });
    const res = await POST(uploadReq(file));
    expect(res.status).toBe(200);
  });

  it("does not merge into the roster or call improve() when remember() fails", async () => {
    cogneeRememberMock.mockResolvedValue({ status: 500, body: { error: "down" } });
    const file = new File(["bytes"], "report.pdf", { type: "application/pdf" });
    const res = await POST(uploadReq(file));

    expect(res.status).toBe(500);
    expect(cogneeImproveMock).not.toHaveBeenCalled();
    expect(saveRosterMock).not.toHaveBeenCalled();
  });

  it("returns 409 when the org has no patients yet", async () => {
    requirePatientContextMock.mockRejectedValue(new NoPatientsError());
    const file = new File(["bytes"], "report.pdf", { type: "application/pdf" });
    const res = await POST(uploadReq(file));
    expect(res.status).toBe(409);
  });

  it("returns 429 with Retry-After when the clinician is rate limited", async () => {
    const { RateLimitedError } = await import("@/lib/rate-limit");
    enforceRateLimitMock.mockRejectedValue(new RateLimitedError(45));
    const file = new File(["bytes"], "report.pdf", { type: "application/pdf" });
    const res = await POST(uploadReq(file));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("45");
    expect(extractEntitiesFromDocumentMock).not.toHaveBeenCalled();
  });
});
