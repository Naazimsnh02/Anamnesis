import type { ExtractedEntities } from "@/lib/gemini";

// Cognee's cognify pipeline builds its graph (Patient -> Condition ->
// Medication -> Lab Value -> Date, per PRD §7.3/§8) from natural-language
// text, not structured JSON. This turns Gemini's extracted entities into a
// flowing clinical narrative so remember() has connected sentences to work
// with, rather than a bullet dump.
export function buildNarrative(patientName: string, entities: ExtractedEntities): string {
  const lines: string[] = [];
  const docDate = entities.documentDate ? ` dated ${entities.documentDate}` : "";
  lines.push(
    `${patientName}'s ${entities.documentType.replace(/_/g, " ")}${docDate}: ${entities.summary}`
  );

  for (const dx of entities.diagnoses) {
    const status = dx.status ? ` (${dx.status})` : "";
    const date = dx.date ? ` as of ${dx.date}` : "";
    lines.push(`${patientName} was diagnosed with ${dx.name}${status}${date}.`);
  }

  for (const med of entities.medications) {
    const dosage = med.dosage ? ` ${med.dosage}` : "";
    const reason = med.reason ? ` for ${med.reason}` : "";
    lines.push(`${patientName} was prescribed ${med.name}${dosage}${reason}.`);
  }

  for (const lab of entities.labValues) {
    const unit = lab.unit ? ` ${lab.unit}` : "";
    const date = lab.date ? ` on ${lab.date}` : "";
    lines.push(`${patientName}'s ${lab.test} was ${lab.value}${unit}${date}.`);
  }

  return lines.join(" ");
}
