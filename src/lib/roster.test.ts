import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExtractedEntities } from "@/lib/gemini";
import type { Roster } from "./roster";

const headMock = vi.fn();
const putMock = vi.fn();

class FakeBlobNotFoundError extends Error {}

vi.mock("@vercel/blob", () => ({
  head: headMock,
  put: putMock,
  BlobNotFoundError: FakeBlobNotFoundError,
}));

const { getRoster, saveRoster, findDuplicateDocument, mergeEntitiesIntoRoster } = await import(
  "./roster"
);

function entities(overrides: Partial<ExtractedEntities> = {}): ExtractedEntities {
  return {
    documentType: "blood_report",
    documentDate: "2024-01-01",
    summary: "summary",
    diagnoses: [],
    medications: [],
    labValues: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
});

describe("getRoster", () => {
  it("returns an empty roster when the blob doesn't exist yet", async () => {
    headMock.mockRejectedValue(new FakeBlobNotFoundError("not found"));
    const roster = await getRoster("patient-1");
    expect(roster).toEqual({
      diagnoses: [],
      medications: [],
      documents: [],
      allergies: [],
      upcomingAppointment: null,
    });
  });

  it("re-throws non-BlobNotFoundError errors", async () => {
    headMock.mockRejectedValue(new Error("network down"));
    await expect(getRoster("patient-1")).rejects.toThrow("network down");
  });

  it("fetches and parses the roster JSON when the blob exists", async () => {
    headMock.mockResolvedValue({ downloadUrl: "https://blob/roster.json" });
    const roster = {
      diagnoses: [],
      medications: [],
      documents: [],
      allergies: [],
      upcomingAppointment: null,
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => roster,
    });
    const result = await getRoster("patient-1");
    expect(result).toEqual(roster);
  });

  it("returns an empty roster when the download fetch fails", async () => {
    headMock.mockResolvedValue({ downloadUrl: "https://blob/roster.json" });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    const result = await getRoster("patient-1");
    expect(result).toEqual({
      diagnoses: [],
      medications: [],
      documents: [],
      allergies: [],
      upcomingAppointment: null,
    });
  });
});

describe("saveRoster", () => {
  it("puts the roster as JSON at the patient-scoped pathname", async () => {
    const roster = { diagnoses: [], medications: [], documents: [] };
    await saveRoster("patient-1", roster);
    expect(putMock).toHaveBeenCalledWith(
      "roster/patient-1.json",
      JSON.stringify(roster, null, 2),
      expect.objectContaining({ access: "public", allowOverwrite: true })
    );
  });
});

describe("findDuplicateDocument", () => {
  it("returns null when the new document has no date", () => {
    const roster = { diagnoses: [], medications: [], documents: [] };
    expect(findDuplicateDocument(roster, entities({ documentDate: null }))).toBeNull();
  });

  it("returns null when no existing document matches type+date", () => {
    const roster = {
      diagnoses: [],
      medications: [],
      documents: [{ dataId: "d1", documentType: "prescription", documentDate: "2024-01-01", narrative: "x" }],
    };
    expect(findDuplicateDocument(roster, entities())).toBeNull();
  });

  it("returns the matching document when type and date both match", () => {
    const existing = { dataId: "d1", documentType: "blood_report", documentDate: "2024-01-01", narrative: "x" };
    const roster = { diagnoses: [], medications: [], documents: [existing] };
    expect(findDuplicateDocument(roster, entities())).toEqual(existing);
  });
});

describe("mergeEntitiesIntoRoster", () => {
  it("adds a new active diagnosis when none exists by that name", () => {
    const roster = { diagnoses: [], medications: [], documents: [] };
    const result = mergeEntitiesIntoRoster(
      roster,
      entities({ diagnoses: [{ name: "CKD Stage 3", status: "active", date: "2024-01-01" }] }),
      "d1",
      "narrative text"
    );
    expect(result.diagnoses).toEqual([
      { name: "CKD Stage 3", firstDate: "2024-01-01", status: "active" },
    ]);
  });

  it("marks an existing active diagnosis as ruled_out when status hints at it", () => {
    const roster = {
      diagnoses: [{ name: "CKD Stage 3", firstDate: "2023-01-01", status: "active" as const }],
      medications: [],
      documents: [],
    };
    const result = mergeEntitiesIntoRoster(
      roster,
      entities({ diagnoses: [{ name: "ckd stage 3", status: "ruled out", date: "2024-02-01" }] }),
      "d2",
      "narrative"
    );
    expect(result.diagnoses[0].status).toBe("ruled_out");
    expect(result.diagnoses[0].ruledOutDate).toBe("2024-02-01");
  });

  it("keeps the earliest firstDate across merges", () => {
    const roster = {
      diagnoses: [{ name: "CKD Stage 3", firstDate: "2024-05-01", status: "active" as const }],
      medications: [],
      documents: [],
    };
    const result = mergeEntitiesIntoRoster(
      roster,
      entities({ diagnoses: [{ name: "CKD Stage 3", status: null, date: "2023-01-01" }] }),
      "d2",
      "narrative"
    );
    expect(result.diagnoses[0].firstDate).toBe("2023-01-01");
  });

  it("adds a new current medication and later marks it discontinued", () => {
    let roster: Roster = { diagnoses: [], medications: [], documents: [] };
    roster = mergeEntitiesIntoRoster(
      roster,
      entities({ medications: [{ name: "Lisinopril", dosage: "10mg", reason: "hypertension" }] }),
      "d1",
      "n1"
    );
    expect(roster.medications[0]).toMatchObject({ name: "Lisinopril", status: "current", dosage: "10mg" });

    roster = mergeEntitiesIntoRoster(
      roster,
      entities({
        documentDate: "2024-03-01",
        medications: [{ name: "lisinopril", dosage: null, reason: "discontinued due to cough" }],
      }),
      "d2",
      "n2"
    );
    expect(roster.medications[0]).toMatchObject({
      name: "Lisinopril",
      status: "discontinued",
      discontinuedDate: "2024-03-01",
    });
  });

  it("replaces a prior document entry with the same type+date and appends the new one", () => {
    const roster = {
      diagnoses: [],
      medications: [],
      documents: [{ dataId: "old", documentType: "blood_report", documentDate: "2024-01-01", narrative: "old" }],
    };
    const result = mergeEntitiesIntoRoster(roster, entities(), "new", "new narrative");
    expect(result.documents).toEqual([
      {
        dataId: "new",
        documentType: "blood_report",
        documentDate: "2024-01-01",
        narrative: "new narrative",
        documentUrl: null,
      },
    ]);
  });
});
