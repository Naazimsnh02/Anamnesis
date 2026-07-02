// Single hardcoded demo patient for the hackathon build. Phase 5 may add a
// patient list/switcher — until then, every upload/recall in the app scopes
// to this one synthetic patient and their Cognee dataset.
export const DEMO_PATIENT = {
  id: "demo-patient-1",
  name: "Rina Kapoor",
  dob: "1968-03-14",
  datasetName: "patient_demo_patient_1",
} as const;
