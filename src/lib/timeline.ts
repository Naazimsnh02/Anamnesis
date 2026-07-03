import type { Roster } from "@/lib/roster";

export type TimelineEvent = {
  date: string | null;
  kind: "document" | "diagnosis" | "diagnosis_ruled_out" | "medication" | "medication_discontinued";
  label: string;
  detail?: string;
};

// Derived entirely from the existing roster (documents + diagnoses/medications
// and their status-change dates) — PRD §7.1's "Patient Memory Timeline" is a
// view over data Anamnesis already tracks, not a new data source.
export function buildTimeline(roster: Roster): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const doc of roster.documents) {
    events.push({
      date: doc.documentDate,
      kind: "document",
      label: `Document added: ${doc.documentType.replace(/_/g, " ")}`,
    });
  }

  for (const dx of roster.diagnoses) {
    if (dx.firstDate) {
      events.push({ date: dx.firstDate, kind: "diagnosis", label: `Diagnosed: ${dx.name}` });
    }
    if (dx.status === "ruled_out" && dx.ruledOutDate) {
      events.push({
        date: dx.ruledOutDate,
        kind: "diagnosis_ruled_out",
        label: `Ruled out: ${dx.name}`,
        detail: dx.ruledOutNote,
      });
    }
  }

  for (const med of roster.medications) {
    if (med.firstDate) {
      events.push({
        date: med.firstDate,
        kind: "medication",
        label: `Started: ${med.name}${med.dosage ? ` — ${med.dosage}` : ""}`,
      });
    }
    if (med.status === "discontinued" && med.discontinuedDate) {
      events.push({
        date: med.discontinuedDate,
        kind: "medication_discontinued",
        label: `Discontinued: ${med.name}`,
        detail: med.discontinuedNote,
      });
    }
  }

  // Most recent first; undated events sort last.
  return events.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });
}
