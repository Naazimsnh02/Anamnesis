import { describe, expect, it } from "vitest";
import type { ExtractedEntities } from "./gemini";
import { buildNarrative } from "./narrative";

function baseEntities(overrides: Partial<ExtractedEntities> = {}): ExtractedEntities {
  return {
    documentType: "blood_report",
    documentDate: null,
    summary: "Routine panel.",
    diagnoses: [],
    medications: [],
    labValues: [],
    ...overrides,
  };
}

describe("buildNarrative", () => {
  it("builds the opening line with document type and summary, omitting date when absent", () => {
    const narrative = buildNarrative("Jane Doe", baseEntities());
    expect(narrative).toBe("Jane Doe's blood report: Routine panel.");
  });

  it("includes the document date when present and replaces underscores in the doc type", () => {
    const narrative = buildNarrative(
      "Jane Doe",
      baseEntities({ documentType: "discharge_summary", documentDate: "2024-05-01" })
    );
    expect(narrative).toBe("Jane Doe's discharge summary dated 2024-05-01: Routine panel.");
  });

  it("appends a sentence per diagnosis, including optional status and date", () => {
    const narrative = buildNarrative(
      "Jane Doe",
      baseEntities({
        diagnoses: [
          { name: "CKD Stage 3", status: "active", date: "2023-01-10" },
          { name: "Hypertension", status: null, date: null },
        ],
      })
    );
    expect(narrative).toContain(
      "Jane Doe was diagnosed with CKD Stage 3 (active) as of 2023-01-10."
    );
    expect(narrative).toContain("Jane Doe was diagnosed with Hypertension.");
  });

  it("appends a sentence per medication, including optional dosage and reason", () => {
    const narrative = buildNarrative(
      "Jane Doe",
      baseEntities({
        medications: [
          { name: "Lisinopril", dosage: "10mg", reason: "hypertension" },
          { name: "Aspirin", dosage: null, reason: null },
        ],
      })
    );
    expect(narrative).toContain(
      "Jane Doe was prescribed Lisinopril 10mg for hypertension."
    );
    expect(narrative).toContain("Jane Doe was prescribed Aspirin.");
  });

  it("appends a sentence per lab value, including optional unit and date", () => {
    const narrative = buildNarrative(
      "Jane Doe",
      baseEntities({
        labValues: [
          { test: "eGFR", value: "45", unit: "mL/min", date: "2024-03-01" },
          { test: "Potassium", value: "4.2", unit: null, date: null },
        ],
      })
    );
    expect(narrative).toContain("Jane Doe's eGFR was 45 mL/min on 2024-03-01.");
    expect(narrative).toContain("Jane Doe's Potassium was 4.2.");
  });

  it("joins all sections with a single space into one flowing narrative", () => {
    const narrative = buildNarrative(
      "Jane Doe",
      baseEntities({
        diagnoses: [{ name: "CKD Stage 3", status: null, date: null }],
        medications: [{ name: "Lisinopril", dosage: null, reason: null }],
        labValues: [{ test: "eGFR", value: "45", unit: null, date: null }],
      })
    );
    expect(narrative).toBe(
      "Jane Doe's blood report: Routine panel. " +
        "Jane Doe was diagnosed with CKD Stage 3. " +
        "Jane Doe was prescribed Lisinopril. " +
        "Jane Doe's eGFR was 45."
    );
  });
});
