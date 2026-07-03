import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePatientContextMock = vi.fn();
const getRosterMock = vi.fn();
const saveRosterMock = vi.fn();
const cogneeRememberMock = vi.fn();
const cogneeImproveMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock("@/lib/db/queries", () => ({
  requirePatientContext: requirePatientContextMock,
  NoPatientsError: class NoPatientsError extends Error {},
}));
vi.mock("@/lib/roster", () => ({ getRoster: getRosterMock, saveRoster: saveRosterMock }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));
vi.mock("@/lib/cognee", () => ({ cogneeRemember: cogneeRememberMock, cogneeImprove: cogneeImproveMock }));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
  RateLimitedError: class RateLimitedError extends Error {
    constructor(public retryAfterSeconds: number) {
      super("Rate limit exceeded");
    }
  },
}));

const { POST } = await import("./route");
const { NoPatientsError } = await import("@/lib/db/queries");

function req(body: unknown) {
  return new Request("http://localhost/api/documents/status", { method: "POST", body: JSON.stringify(body) });
}

function baseRoster() {
  return {
    diagnoses: [{ name: "CKD Stage 3", firstDate: "2023-01-01", status: "active" as const }],
    medications: [{ name: "Lisinopril", dosage: "10mg", firstDate: "2023-01-01", status: "current" as const }],
    documents: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requirePatientContextMock.mockResolvedValue({
    patient: { id: "p1", name: "Alice", datasetName: "ds-1" },
    clinicianId: "clin-1",
  });
  enforceRateLimitMock.mockResolvedValue(undefined);
  cogneeRememberMock.mockResolvedValue({ status: 200, body: {} });
  cogneeImproveMock.mockResolvedValue({ status: 200, body: {} });
});

describe("POST /api/documents/status", () => {
  it("400s when entityType is invalid", async () => {
    const res = await POST(req({ entityType: "bogus", name: "CKD Stage 3" }));
    expect(res.status).toBe(400);
  });

  it("400s when name is missing", async () => {
    const res = await POST(req({ entityType: "diagnosis" }));
    expect(res.status).toBe(400);
  });

  it("404s when marking a diagnosis ruled-out that isn't active", async () => {
    getRosterMock.mockResolvedValue({ diagnoses: [], medications: [], documents: [] });
    const res = await POST(req({ entityType: "diagnosis", name: "Nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("marks a diagnosis ruled out, persists the roster, and remembers a correction narrative", async () => {
    getRosterMock.mockResolvedValue(baseRoster());
    const res = await POST(req({ entityType: "diagnosis", name: "CKD Stage 3", date: "2024-01-01", note: "false positive" }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.roster.diagnoses[0].status).toBe("ruled_out");
    expect(saveRosterMock).toHaveBeenCalled();
    expect(cogneeRememberMock).toHaveBeenCalled();
    expect(cogneeImproveMock).toHaveBeenCalledWith("ds-1");
  });

  it("404s when discontinuing a medication that isn't current", async () => {
    getRosterMock.mockResolvedValue({ diagnoses: [], medications: [], documents: [] });
    const res = await POST(req({ entityType: "medication", name: "Nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("marks a medication discontinued and persists the roster", async () => {
    getRosterMock.mockResolvedValue(baseRoster());
    const res = await POST(req({ entityType: "medication", name: "lisinopril" }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.roster.medications[0].status).toBe("discontinued");
  });

  it("skips improve() when the remember() call fails but still returns 200", async () => {
    getRosterMock.mockResolvedValue(baseRoster());
    cogneeRememberMock.mockResolvedValue({ status: 500, body: { error: "down" } });

    const res = await POST(req({ entityType: "medication", name: "lisinopril" }));
    expect(res.status).toBe(200);
    expect(cogneeImproveMock).not.toHaveBeenCalled();
  });

  it("returns 409 when the org has no patients yet", async () => {
    requirePatientContextMock.mockRejectedValue(new NoPatientsError());
    const res = await POST(req({ entityType: "medication", name: "lisinopril" }));
    expect(res.status).toBe(409);
  });

  it("returns 429 with Retry-After when the clinician is rate limited", async () => {
    const { RateLimitedError } = await import("@/lib/rate-limit");
    enforceRateLimitMock.mockRejectedValue(new RateLimitedError(30));
    const res = await POST(req({ entityType: "medication", name: "lisinopril" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
  });
});
