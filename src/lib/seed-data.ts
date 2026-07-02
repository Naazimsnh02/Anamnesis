import type { ExtractedEntities } from "@/lib/gemini";

// Synthetic 3-year clinical history for the demo patient (DEMO_PATIENT),
// used to seed the memory graph for demo continuity (Implementation Plan
// Phase 1). Shaped like extractEntitiesFromDocument()'s output so it flows
// through the same buildNarrative() -> cogneeRemember() pipeline as a real
// upload would. Tells the PRD §13 demo storyline: hypertension diagnosed,
// medicated, kidney function gradually declines, a hyperkalemia admission
// causes a medication swap, ending in a CKD diagnosis and nephrology
// referral — so Phase 2's "Why is kidney function declining?" recall query
// and Phase 4's forget()/discontinue flows have real history to work with.
// All data is fictional; no real PHI.
export const SEED_DOCUMENTS: ExtractedEntities[] = [
  {
    documentType: "blood_report",
    documentDate: "2023-08-10",
    diagnoses: [{ name: "Hypertension", status: "active", date: "2023-08-10" }],
    medications: [],
    labValues: [
      { test: "Blood Pressure", value: "148/94", unit: "mmHg", date: "2023-08-10" },
      { test: "Serum Creatinine", value: "0.9", unit: "mg/dL", date: "2023-08-10" },
      { test: "eGFR", value: "92", unit: "mL/min/1.73m2", date: "2023-08-10" },
    ],
    summary: "Annual checkup blood report shows newly elevated blood pressure with normal kidney function.",
  },
  {
    documentType: "prescription",
    documentDate: "2023-08-15",
    diagnoses: [],
    medications: [{ name: "Amlodipine", dosage: "5mg once daily", reason: "hypertension" }],
    labValues: [],
    summary: "Prescription started to bring blood pressure under control.",
  },
  {
    documentType: "blood_report",
    documentDate: "2024-02-20",
    diagnoses: [],
    medications: [],
    labValues: [
      { test: "Blood Pressure", value: "132/84", unit: "mmHg", date: "2024-02-20" },
      { test: "Serum Creatinine", value: "1.1", unit: "mg/dL", date: "2024-02-20" },
      { test: "eGFR", value: "84", unit: "mL/min/1.73m2", date: "2024-02-20" },
    ],
    summary: "Follow-up blood report shows blood pressure controlled on medication, creatinine mildly up.",
  },
  {
    documentType: "blood_report",
    documentDate: "2024-09-05",
    diagnoses: [],
    medications: [],
    labValues: [
      { test: "Blood Pressure", value: "138/88", unit: "mmHg", date: "2024-09-05" },
      { test: "Serum Creatinine", value: "1.4", unit: "mg/dL", date: "2024-09-05" },
      { test: "eGFR", value: "68", unit: "mL/min/1.73m2", date: "2024-09-05" },
    ],
    summary: "Six-month follow-up shows declining kidney function alongside borderline blood pressure control.",
  },
  {
    documentType: "prescription",
    documentDate: "2024-09-10",
    diagnoses: [],
    medications: [
      { name: "Amlodipine", dosage: "10mg once daily", reason: "hypertension (dose increased)" },
      { name: "Losartan", dosage: "50mg once daily", reason: "renal protection amid declining eGFR" },
    ],
    labValues: [],
    summary: "Medication adjusted in response to declining kidney function: amlodipine increased, losartan added.",
  },
  {
    documentType: "discharge_summary",
    documentDate: "2025-03-18",
    diagnoses: [{ name: "Hyperkalemia", status: "active", date: "2025-03-18" }],
    medications: [],
    labValues: [
      { test: "Serum Potassium", value: "6.1", unit: "mmol/L", date: "2025-03-18" },
      { test: "Serum Creatinine", value: "1.6", unit: "mg/dL", date: "2025-03-18" },
    ],
    summary: "Hospitalized for hyperkalemia, suspected related to losartan in the setting of declining renal function.",
  },
  {
    documentType: "prescription",
    documentDate: "2025-03-20",
    diagnoses: [],
    medications: [{ name: "Losartan", dosage: "discontinued", reason: "hyperkalemia risk" }],
    labValues: [],
    summary: "Losartan discontinued following hyperkalemia admission; amlodipine continued alone for blood pressure.",
  },
  {
    documentType: "blood_report",
    documentDate: "2025-11-02",
    diagnoses: [{ name: "Chronic Kidney Disease Stage 3", status: "active", date: "2025-11-02" }],
    medications: [],
    labValues: [
      { test: "Serum Creatinine", value: "1.8", unit: "mg/dL", date: "2025-11-02" },
      { test: "eGFR", value: "42", unit: "mL/min/1.73m2", date: "2025-11-02" },
      { test: "Serum Potassium", value: "5.0", unit: "mmol/L", date: "2025-11-02" },
    ],
    summary: "Continued decline in kidney function meets criteria for Chronic Kidney Disease Stage 3.",
  },
  {
    documentType: "imaging_report",
    documentDate: "2026-04-14",
    diagnoses: [],
    medications: [],
    labValues: [{ test: "Renal Ultrasound", value: "Mild bilateral cortical atrophy", unit: null, date: "2026-04-14" }],
    summary: "Renal ultrasound shows mild bilateral atrophy consistent with chronic kidney disease; nephrology referral made.",
  },
  {
    documentType: "discharge_summary",
    documentDate: "2026-06-20",
    diagnoses: [{ name: "Chronic Kidney Disease Stage 3", status: "active", date: "2026-06-20" }],
    medications: [{ name: "Sodium Bicarbonate", dosage: "650mg twice daily", reason: "metabolic acidosis from CKD" }],
    labValues: [
      { test: "Serum Creatinine", value: "1.9", unit: "mg/dL", date: "2026-06-20" },
      { test: "eGFR", value: "39", unit: "mL/min/1.73m2", date: "2026-06-20" },
    ],
    summary: "Nephrology consult confirms CKD Stage 3 with mild metabolic acidosis; sodium bicarbonate started, amlodipine continued.",
  },
];
