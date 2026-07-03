import { beforeEach, describe, expect, it, vi } from "vitest";

const requireOrgContextMock = vi.fn();
const listPatientsForOrgMock = vi.fn();
const getActivePatientIdMock = vi.fn();
const createPatientMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock("@/lib/db/queries", () => ({
  requireOrgContext: requireOrgContextMock,
  listPatientsForOrg: listPatientsForOrgMock,
  getActivePatientId: getActivePatientIdMock,
  createPatient: createPatientMock,
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

const { GET, POST } = await import("./route");
const { NoPatientsError } = await import("@/lib/db/queries");

function req(body: unknown) {
  return new Request("http://localhost/api/patients", { method: "POST", body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  enforceRateLimitMock.mockResolvedValue(undefined);
});

describe("GET /api/patients", () => {
  it("returns the org's patient list and active patient id", async () => {
    requireOrgContextMock.mockResolvedValue({ orgId: "org-1" });
    listPatientsForOrgMock.mockResolvedValue([{ id: "p1", name: "Alice" }]);
    getActivePatientIdMock.mockResolvedValue("p1");

    const res = await GET();
    expect(await res.json()).toEqual({ patients: [{ id: "p1", name: "Alice" }], activePatientId: "p1" });
  });

  it("returns 500 for unexpected errors", async () => {
    requireOrgContextMock.mockRejectedValue(new Error("no session"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("POST /api/patients", () => {
  it("400s when name or dob is missing", async () => {
    const res = await POST(req({ name: "Alice" }));
    expect(res.status).toBe(400);
  });

  it("400s when name/dob are blank after trimming", async () => {
    const res = await POST(req({ name: "  ", dob: "  " }));
    expect(res.status).toBe(400);
  });

  it("creates a patient scoped to the caller's org and returns 201", async () => {
    requireOrgContextMock.mockResolvedValue({ orgId: "org-1", clinicianId: "clin-1" });
    createPatientMock.mockResolvedValue({ id: "p1", name: "Alice", dob: "1990-01-01" });

    const res = await POST(req({ name: "Alice", dob: "1990-01-01" }));
    expect(createPatientMock).toHaveBeenCalledWith("org-1", "Alice", "1990-01-01");
    expect(res.status).toBe(201);
  });

  it("returns 409 when NoPatientsError somehow propagates from context resolution", async () => {
    requireOrgContextMock.mockRejectedValue(new NoPatientsError());
    const res = await POST(req({ name: "Alice", dob: "1990-01-01" }));
    expect(res.status).toBe(409);
  });

  it("returns 429 with Retry-After when the clinician is rate limited", async () => {
    const { RateLimitedError } = await import("@/lib/rate-limit");
    requireOrgContextMock.mockResolvedValue({ orgId: "org-1", clinicianId: "clin-1" });
    enforceRateLimitMock.mockRejectedValue(new RateLimitedError(15));

    const res = await POST(req({ name: "Alice", dob: "1990-01-01" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("15");
    expect(createPatientMock).not.toHaveBeenCalled();
  });
});
