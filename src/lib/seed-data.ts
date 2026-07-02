import type { ExtractedEntities } from "@/lib/gemini";

export type SeedPatient = {
  name: string;
  dob: string;
  documents: ExtractedEntities[];
};

// Synthetic 3-year clinical history for the primary demo patient, used to
// seed the memory graph for demo continuity (Implementation Plan Phase 1).
// Shaped like extractEntitiesFromDocument()'s output so it flows through the
// same buildNarrative() -> cogneeRemember() pipeline as a real upload would.
// Tells the PRD §13 demo storyline: hypertension diagnosed, medicated,
// kidney function gradually declines, a hyperkalemia admission causes a
// medication swap, ending in a CKD diagnosis and nephrology referral — so
// Phase 2's "Why is kidney function declining?" recall query and Phase 4's
// forget()/discontinue flows have real history to work with.
// All data is fictional; no real PHI.
export const RINA_KAPOOR_DOCUMENTS: ExtractedEntities[] = [
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

// Two lighter synthetic histories so the Phase 5 patient switcher has more
// than one patient to switch between out of the box, each with a distinct
// storyline. Not full 3-year narratives like Rina's — just enough real,
// distinguishable graph content to demonstrate multi-patient scoping works.
// All data is fictional; no real PHI.
const ARJUN_MEHTA_DOCUMENTS: ExtractedEntities[] = [
  {
    documentType: "blood_report",
    documentDate: "2025-01-12",
    diagnoses: [{ name: "Type 2 Diabetes Mellitus", status: "active", date: "2025-01-12" }],
    medications: [],
    labValues: [
      { test: "HbA1c", value: "8.1", unit: "%", date: "2025-01-12" },
      { test: "Fasting Glucose", value: "162", unit: "mg/dL", date: "2025-01-12" },
    ],
    summary: "Routine screening reveals newly diagnosed type 2 diabetes with elevated HbA1c.",
  },
  {
    documentType: "prescription",
    documentDate: "2025-01-15",
    diagnoses: [],
    medications: [{ name: "Metformin", dosage: "500mg twice daily", reason: "type 2 diabetes" }],
    labValues: [],
    summary: "Metformin started as first-line treatment for newly diagnosed diabetes.",
  },
  {
    documentType: "blood_report",
    documentDate: "2025-07-22",
    diagnoses: [],
    medications: [],
    labValues: [
      { test: "HbA1c", value: "6.9", unit: "%", date: "2025-07-22" },
      { test: "Fasting Glucose", value: "128", unit: "mg/dL", date: "2025-07-22" },
    ],
    summary: "Six-month follow-up shows improved glycemic control on metformin.",
  },
];

const FATIMA_SHEIKH_DOCUMENTS: ExtractedEntities[] = [
  {
    documentType: "imaging_report",
    documentDate: "2025-05-03",
    diagnoses: [{ name: "Osteoarthritis, right knee", status: "active", date: "2025-05-03" }],
    medications: [],
    labValues: [],
    summary: "Right knee X-ray shows moderate joint space narrowing consistent with osteoarthritis.",
  },
  {
    documentType: "prescription",
    documentDate: "2025-05-05",
    diagnoses: [],
    medications: [{ name: "Naproxen", dosage: "500mg twice daily as needed", reason: "osteoarthritis pain" }],
    labValues: [],
    summary: "Naproxen prescribed for osteoarthritis pain management.",
  },
  {
    documentType: "discharge_summary",
    documentDate: "2026-02-11",
    diagnoses: [],
    medications: [{ name: "Naproxen", dosage: "discontinued", reason: "GI upset" }],
    labValues: [],
    summary: "Naproxen discontinued after patient reported GI upset; switched to topical treatment, physiotherapy referral made.",
  },
];

export const SEED_PATIENTS: SeedPatient[] = [
  { name: "Rina Kapoor", dob: "1968-03-14", documents: RINA_KAPOOR_DOCUMENTS },
  { name: "Arjun Mehta", dob: "1979-11-02", documents: ARJUN_MEHTA_DOCUMENTS },
  { name: "Fatima Sheikh", dob: "1990-06-27", documents: FATIMA_SHEIKH_DOCUMENTS },
];
