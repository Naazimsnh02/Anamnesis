import { beforeEach, describe, expect, it, vi } from "vitest";

const requireOrgContextMock = vi.fn();
const listPatientsForOrgMock = vi.fn();
const createPatientMock = vi.fn();
const setActivePatientCookieMock = vi.fn();
const getRosterMock = vi.fn();
const saveRosterMock = vi.fn();
const mergeEntitiesIntoRosterMock = vi.fn();
const cogneeRememberMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock("@/lib/db/queries", () => ({
  requireOrgContext: requireOrgContextMock,
  listPatientsForOrg: listPatientsForOrgMock,
  createPatient: createPatientMock,
  setActivePatientCookie: setActivePatientCookieMock,
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
vi.mock("@/lib/roster", () => ({
  getRoster: getRosterMock,
  saveRoster: saveRosterMock,
  mergeEntitiesIntoRoster: mergeEntitiesIntoRosterMock,
}));
vi.mock("@/lib/cognee", () => ({ cogneeRemember: cogneeRememberMock }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));
vi.mock("@/lib/seed-data", () => ({
  SEED_PATIENTS: [
    {
      name: "Test Patient",
      dob: "1990-01-01",
      documents: [
        { documentType: "blood_report", documentDate: "2024-01-01", summary: "s", diagnoses: [], medications: [], labValues: [] },
      ],
    },
  ],
}));

const { POST } = await import("./route");

beforeEach(() => {
  vi.clearAllMocks();
  enforceRateLimitMock.mockResolvedValue(undefined);
  mergeEntitiesIntoRosterMock.mockReturnValue({ diagnoses: [], medications: [], documents: [{ dataId: "d1" }] });
});

describe("POST /api/patients/seed-demo", () => {
  it("creates a new patient and remembers its seed documents when none exists yet", async () => {
    requireOrgContextMock.mockResolvedValue({ orgId: "org-1", clinicianId: "clin-1" });
    listPatientsForOrgMock.mockResolvedValue([]);
    createPatientMock.mockResolvedValue({ id: "p1", orgId: "org-1", name: "Test Patient", datasetName: "ds-1" });
    getRosterMock.mockResolvedValue({ diagnoses: [], medications: [], documents: [] });
    cogneeRememberMock.mockResolvedValue({ status: 200, body: { items: [{ id: "d1" }] } });

    const res = await POST();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(createPatientMock).toHaveBeenCalledWith("org-1", "Test Patient", "1990-01-01");
    expect(setActivePatientCookieMock).toHaveBeenCalledWith("p1");
    expect(json.seeded).toBe(1);
    expect(json.failed).toBe(0);
  });

  it("is idempotent: skips a patient whose roster already has all seed documents", async () => {
    requireOrgContextMock.mockResolvedValue({ orgId: "org-1", clinicianId: "clin-1" });
    const existingPatient = { id: "p1", orgId: "org-1", name: "Test Patient", datasetName: "ds-1" };
    listPatientsForOrgMock.mockResolvedValue([existingPatient]);
    getRosterMock.mockResolvedValue({ diagnoses: [], medications: [], documents: [{ dataId: "d1" }] });

    const res = await POST();
    const json = await res.json();

    expect(cogneeRememberMock).not.toHaveBeenCalled();
    expect(json.results[0].documentType).toBe("(skipped, already seeded)");
  });

  it("records a per-document failure without aborting the whole seed run", async () => {
    requireOrgContextMock.mockResolvedValue({ orgId: "org-1", clinicianId: "clin-1" });
    listPatientsForOrgMock.mockResolvedValue([]);
    createPatientMock.mockResolvedValue({ id: "p1", orgId: "org-1", name: "Test Patient", datasetName: "ds-1" });
    getRosterMock.mockResolvedValue({ diagnoses: [], medications: [], documents: [] });
    cogneeRememberMock.mockRejectedValue(new Error("upstream down"));

    const res = await POST();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.failed).toBe(1);
  });

  it("returns 500 for unexpected errors resolving org context", async () => {
    requireOrgContextMock.mockRejectedValue(new Error("no session"));
    const res = await POST();
    expect(res.status).toBe(500);
  });

  it("returns 429 with Retry-After when the clinician is rate limited", async () => {
    const { RateLimitedError } = await import("@/lib/rate-limit");
    requireOrgContextMock.mockResolvedValue({ orgId: "org-1", clinicianId: "clin-1" });
    enforceRateLimitMock.mockRejectedValue(new RateLimitedError(120));

    const res = await POST();
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("120");
    expect(listPatientsForOrgMock).not.toHaveBeenCalled();
  });
});
