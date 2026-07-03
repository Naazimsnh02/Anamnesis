import { beforeEach, describe, expect, it, vi } from "vitest";

const requireOrgContextMock = vi.fn();
const getPatientForOrgMock = vi.fn();
const setActivePatientCookieMock = vi.fn();

vi.mock("@/lib/db/queries", () => ({
  requireOrgContext: requireOrgContextMock,
  getPatientForOrg: getPatientForOrgMock,
  setActivePatientCookie: setActivePatientCookieMock,
  NoPatientsError: class NoPatientsError extends Error {},
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  RateLimitedError: class RateLimitedError extends Error {},
}));

const { POST } = await import("./route");

function req(body: unknown) {
  return new Request("http://localhost/api/patients/active", { method: "POST", body: JSON.stringify(body) });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/patients/active", () => {
  it("400s when patientId is missing", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it("404s when the patient doesn't belong to the caller's org", async () => {
    requireOrgContextMock.mockResolvedValue({ orgId: "org-1" });
    getPatientForOrgMock.mockResolvedValue(null);

    const res = await POST(req({ patientId: "someone-elses" }));
    expect(res.status).toBe(404);
    expect(setActivePatientCookieMock).not.toHaveBeenCalled();
  });

  it("sets the active-patient cookie and returns the patient on success", async () => {
    requireOrgContextMock.mockResolvedValue({ orgId: "org-1" });
    getPatientForOrgMock.mockResolvedValue({ id: "p1", name: "Alice" });

    const res = await POST(req({ patientId: "p1" }));
    expect(setActivePatientCookieMock).toHaveBeenCalledWith("p1");
    expect(await res.json()).toEqual({ patient: { id: "p1", name: "Alice" } });
  });

  it("returns 500 for unexpected errors", async () => {
    requireOrgContextMock.mockRejectedValue(new Error("boom"));
    const res = await POST(req({ patientId: "p1" }));
    expect(res.status).toBe(500);
  });
});
