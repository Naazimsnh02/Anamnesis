import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const authMock = vi.fn();
const currentUserMock = vi.fn();
const getOrganizationMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  currentUser: currentUserMock,
  clerkClient: vi.fn(async () => ({
    organizations: { getOrganization: getOrganizationMock },
  })),
}));

const cookieStore = new Map<string, { value: string }>();
const cookiesMock = vi.fn(async () => ({
  get: (name: string) => cookieStore.get(name),
  set: (name: string, value: string) => {
    cookieStore.set(name, { value });
  },
}));

vi.mock("next/headers", () => ({ cookies: cookiesMock }));

// A tiny fluent stand-in for the slice of Drizzle's query builder chain
// queries.ts actually calls (select/insert/where/limit/orderBy/onConflictDoUpdate/returning).
type Row = Record<string, unknown>;

function makeChain(result: Row[]) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from",
    "where",
    "orderBy",
    "limit",
    "values",
    "onConflictDoUpdate",
    "returning",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.returning = vi.fn(async () => result);
  // select()/where()/orderBy() chains resolve when awaited directly (no .returning()).
  chain.then = (resolve: (v: Row[]) => void, reject: (e: unknown) => void) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

const dbMock = {
  select: vi.fn(),
  insert: vi.fn(),
};

vi.mock("@/lib/db/client", () => ({ db: dbMock }));

const { requireOrgContext, listPatientsForOrg, getPatientForOrg, createPatient, getActivePatientId, setActivePatientCookie, requirePatientContext, NoPatientsError } = await import("./queries");

beforeEach(() => {
  vi.clearAllMocks();
  cookieStore.clear();
});

describe("requireOrgContext", () => {
  it("throws when there is no active Clerk user+org session", async () => {
    authMock.mockResolvedValue({ userId: null, orgId: null, orgRole: null });
    await expect(requireOrgContext()).rejects.toThrow(
      "requireOrgContext() called without an active Clerk user+org session"
    );
  });

  it("upserts org and clinician rows and maps org:admin to the admin role", async () => {
    authMock.mockResolvedValue({ userId: "user_1", orgId: "org_1", orgRole: "org:admin" });
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: "doc@example.com" },
      emailAddresses: [],
      firstName: "Jane",
      lastName: "Doe",
    });
    getOrganizationMock.mockResolvedValue({ name: "Acme Clinic" });

    dbMock.insert
      .mockReturnValueOnce(makeChain([{ id: "db-org-1", clerkOrgId: "org_1", name: "Acme Clinic" }]))
      .mockReturnValueOnce(
        makeChain([{ id: "db-clinician-1", orgId: "db-org-1", clerkUserId: "user_1", role: "admin" }])
      );

    const ctx = await requireOrgContext();

    expect(ctx).toEqual({
      clerkUserId: "user_1",
      clerkOrgId: "org_1",
      orgId: "db-org-1",
      clinicianId: "db-clinician-1",
      role: "admin",
    });
  });

  it("maps any non-admin Clerk org role to physician", async () => {
    authMock.mockResolvedValue({ userId: "user_2", orgId: "org_1", orgRole: "org:member" });
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: null,
      emailAddresses: [{ emailAddress: "nurse@example.com" }],
      firstName: null,
      lastName: null,
    });
    getOrganizationMock.mockResolvedValue({ name: "Acme Clinic" });

    dbMock.insert
      .mockReturnValueOnce(makeChain([{ id: "db-org-1", clerkOrgId: "org_1", name: "Acme Clinic" }]))
      .mockReturnValueOnce(
        makeChain([{ id: "db-clinician-2", orgId: "db-org-1", clerkUserId: "user_2", role: "physician" }])
      );

    const ctx = await requireOrgContext();
    expect(ctx.role).toBe("physician");
  });
});

describe("listPatientsForOrg / getPatientForOrg", () => {
  it("selects patients scoped to the given org", async () => {
    const rows = [{ id: "p1", orgId: "org-1", name: "Alice" }];
    dbMock.select.mockReturnValueOnce(makeChain(rows));
    const result = await listPatientsForOrg("org-1");
    expect(result).toEqual(rows);
  });

  it("returns null when no patient matches the org+id", async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));
    const result = await getPatientForOrg("org-1", "missing-id");
    expect(result).toBeNull();
  });

  it("returns the patient row when found", async () => {
    const row = { id: "p1", orgId: "org-1", name: "Alice" };
    dbMock.select.mockReturnValueOnce(makeChain([row]));
    const result = await getPatientForOrg("org-1", "p1");
    expect(result).toEqual(row);
  });
});

describe("createPatient", () => {
  it("inserts a patient with a generated dataset name", async () => {
    dbMock.insert.mockReturnValueOnce(
      makeChain([{ id: "new-id", orgId: "org-1", name: "Bob", dob: "1990-01-01" }])
    );
    const patient = await createPatient("org-1", "Bob", "1990-01-01");
    expect(patient.name).toBe("Bob");
    expect(dbMock.insert).toHaveBeenCalled();
  });
});

describe("getActivePatientId", () => {
  it("returns the first patient's id when no cookie is set", async () => {
    dbMock.select.mockReturnValueOnce(makeChain([{ id: "p1", orgId: "org-1" }]));
    const id = await getActivePatientId("org-1");
    expect(id).toBe("p1");
  });

  it("returns null when the org has no patients and no cookie", async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));
    const id = await getActivePatientId("org-1");
    expect(id).toBeNull();
  });

  it("trusts a cookie's patientId only after confirming it belongs to the org", async () => {
    cookieStore.set("anamnesis_active_patient", { value: "p-cookie" });
    dbMock.select.mockReturnValueOnce(makeChain([{ id: "p-cookie", orgId: "org-1" }]));
    const id = await getActivePatientId("org-1");
    expect(id).toBe("p-cookie");
  });

  it("falls back to the first patient when the cookie's patientId doesn't belong to the org", async () => {
    cookieStore.set("anamnesis_active_patient", { value: "someone-elses-patient" });
    dbMock.select
      .mockReturnValueOnce(makeChain([])) // getPatientForOrg lookup for the cookie id fails
      .mockReturnValueOnce(makeChain([{ id: "p1", orgId: "org-1" }])); // fallback to first
    const id = await getActivePatientId("org-1");
    expect(id).toBe("p1");
  });
});

describe("setActivePatientCookie", () => {
  it("stores the patient id under the active-patient cookie", async () => {
    await setActivePatientCookie("p1");
    expect(cookieStore.get("anamnesis_active_patient")?.value).toBe("p1");
  });
});

describe("requirePatientContext", () => {
  it("throws NoPatientsError when the org has no active patient", async () => {
    authMock.mockResolvedValue({ userId: "user_1", orgId: "org_1", orgRole: "org:admin" });
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: "doc@example.com" },
      emailAddresses: [],
    });
    getOrganizationMock.mockResolvedValue({ name: "Acme Clinic" });
    dbMock.insert
      .mockReturnValueOnce(makeChain([{ id: "db-org-1", clerkOrgId: "org_1", name: "Acme Clinic" }]))
      .mockReturnValueOnce(makeChain([{ id: "db-clinician-1", orgId: "db-org-1" }]));
    dbMock.select.mockReturnValueOnce(makeChain([])); // listPatientsForOrg -> none

    await expect(requirePatientContext()).rejects.toBeInstanceOf(NoPatientsError);
  });

  it("returns the full auth+patient context when a patient is active", async () => {
    authMock.mockResolvedValue({ userId: "user_1", orgId: "org_1", orgRole: "org:admin" });
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: "doc@example.com" },
      emailAddresses: [],
    });
    getOrganizationMock.mockResolvedValue({ name: "Acme Clinic" });
    dbMock.insert
      .mockReturnValueOnce(makeChain([{ id: "db-org-1", clerkOrgId: "org_1", name: "Acme Clinic" }]))
      .mockReturnValueOnce(makeChain([{ id: "db-clinician-1", orgId: "db-org-1" }]));
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: "p1", orgId: "db-org-1" }])) // getActivePatientId -> listPatientsForOrg
      .mockReturnValueOnce(makeChain([{ id: "p1", orgId: "db-org-1", name: "Alice" }])); // getPatientForOrg

    const ctx = await requirePatientContext();
    expect(ctx.patient.name).toBe("Alice");
    expect(ctx.orgId).toBe("db-org-1");
  });
});
