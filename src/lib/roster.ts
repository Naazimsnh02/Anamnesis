import { head, put, BlobNotFoundError } from "@vercel/blob";
import type { ExtractedEntities } from "@/lib/gemini";

// Cognee's forget() endpoint only deletes whole documents/datasets, not a
// single graph entity (confirmed against the live instance's OpenAPI spec:
// ForgetPayloadDTO takes dataId/dataset/datasetId, nothing entity-scoped).
// So "mark this one diagnosis ruled out" can't be a literal forget() call
// without deleting every other fact in the same source document. Instead we
// keep a small roster of known diagnoses/medications and their status here
// (active/ruled_out, current/discontinued) — this is what drives the Patient
// Summary's "active" vs "historical" split. The corresponding forget() calls
// are reserved for what the API actually supports: duplicate-document merge
// and full-document replacement (see src/app/api/documents/upload/route.ts).
//
// Phase 5 note: this is still the Vercel-Blob-JSON storage mechanism from
// the hackathon build, just keyed per-patient now instead of one hardcoded
// patient (necessary so multi-patient scoping is actually correct — each
// patient needs their own roster, not a shared one). Migrating this storage
// mechanism itself onto the roster_* Postgres tables (src/lib/db/schema.ts)
// is a separate, already-scoped task (Implementation Plan Phase 5 checklist:
// "Migrate roster.ts from Vercel Blob JSON to Postgres").
function rosterPathname(patientId: string): string {
  return `roster/${patientId}.json`;
}

export type RosterDiagnosis = {
  name: string;
  firstDate: string | null;
  status: "active" | "ruled_out";
  ruledOutDate?: string;
  ruledOutNote?: string;
};

export type RosterMedication = {
  name: string;
  dosage: string | null;
  firstDate: string | null;
  status: "current" | "discontinued";
  discontinuedDate?: string;
  discontinuedNote?: string;
};

export type RosterDocument = {
  dataId: string;
  documentType: string;
  documentDate: string | null;
  narrative: string;
};

export type Roster = {
  diagnoses: RosterDiagnosis[];
  medications: RosterMedication[];
  documents: RosterDocument[];
};

function emptyRoster(): Roster {
  return { diagnoses: [], medications: [] , documents: [] };
}

export async function getRoster(patientId: string): Promise<Roster> {
  try {
    const info = await head(rosterPathname(patientId));
    const res = await fetch(info.downloadUrl, { cache: "no-store" });
    if (!res.ok) return emptyRoster();
    return (await res.json()) as Roster;
  } catch (err) {
    if (err instanceof BlobNotFoundError) return emptyRoster();
    throw err;
  }
}

export async function saveRoster(patientId: string, roster: Roster): Promise<void> {
  await put(rosterPathname(patientId), JSON.stringify(roster, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// A document counts as a duplicate of an existing one if it shares the exact
// same document type and date — good enough for the controlled demo dataset,
// where a "near-duplicate report" means literally re-uploading the same
// report.
export function findDuplicateDocument(
  roster: Roster,
  entities: ExtractedEntities
): RosterDocument | null {
  if (!entities.documentDate) return null;
  return (
    roster.documents.find(
      (d) => d.documentType === entities.documentType && d.documentDate === entities.documentDate
    ) ?? null
  );
}

function byNameCI(name: string) {
  return (entry: { name: string }) => entry.name.toLowerCase() === name.toLowerCase();
}

// Folds one document's extracted entities into the roster: upserts each
// diagnosis/medication by name, keeps the earliest firstDate seen, and
// removes any prior document entry for the same type+date (the merge case)
// before recording the new one.
export function mergeEntitiesIntoRoster(
  roster: Roster,
  entities: ExtractedEntities,
  dataId: string,
  narrative: string
): Roster {
  const diagnoses = [...roster.diagnoses];
  for (const dx of entities.diagnoses) {
    const existing = diagnoses.find(byNameCI(dx.name));
    const statusHint = (dx.status ?? "").toLowerCase();
    const ruledOut = statusHint.includes("ruled out") || statusHint.includes("resolved");
    if (existing) {
      if (dx.date && (!existing.firstDate || dx.date < existing.firstDate)) {
        existing.firstDate = dx.date;
      }
      if (ruledOut && existing.status === "active") {
        existing.status = "ruled_out";
        existing.ruledOutDate = dx.date ?? undefined;
        existing.ruledOutNote = `Extracted from document as "${dx.status}"`;
      }
    } else {
      diagnoses.push({
        name: dx.name,
        firstDate: dx.date ?? null,
        status: ruledOut ? "ruled_out" : "active",
        ...(ruledOut
          ? { ruledOutDate: dx.date ?? undefined, ruledOutNote: `Extracted from document as "${dx.status}"` }
          : {}),
      });
    }
  }

  const medications = [...roster.medications];
  for (const med of entities.medications) {
    const existing = medications.find(byNameCI(med.name));
    const dosageHint = (med.dosage ?? "").toLowerCase();
    const reasonHint = (med.reason ?? "").toLowerCase();
    const discontinued = dosageHint.includes("discontinu") || reasonHint.includes("discontinu");
    if (existing) {
      if (entities.documentDate && (!existing.firstDate || entities.documentDate < existing.firstDate)) {
        existing.firstDate = entities.documentDate;
      }
      if (med.dosage && !discontinued) existing.dosage = med.dosage;
      if (discontinued && existing.status === "current") {
        existing.status = "discontinued";
        existing.discontinuedDate = entities.documentDate ?? undefined;
        existing.discontinuedNote = med.reason ?? "Extracted from document";
      }
    } else {
      medications.push({
        name: med.name,
        dosage: discontinued ? null : med.dosage,
        firstDate: entities.documentDate ?? null,
        status: discontinued ? "discontinued" : "current",
        ...(discontinued
          ? { discontinuedDate: entities.documentDate ?? undefined, discontinuedNote: med.reason ?? "Extracted from document" }
          : {}),
      });
    }
  }

  const documents = roster.documents.filter(
    (d) => !(d.documentType === entities.documentType && d.documentDate === entities.documentDate)
  );
  documents.push({ dataId, documentType: entities.documentType, documentDate: entities.documentDate, narrative });

  return { diagnoses, medications, documents };
}
