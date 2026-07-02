// Phase 5: patients are now real rows in Postgres (src/lib/db/schema.ts),
// not a single hardcoded constant. This just derives a stable, valid Cognee
// dataset name from a patient's DB id — one dataset per patient, same
// one-dataset-per-patient convention the hackathon build established.
export function datasetNameForPatient(patientId: string): string {
  return `patient_${patientId.replace(/-/g, "")}`;
}
