import { cogneeGetLatestDataId, cogneeRemember } from "@/lib/cognee";
import { buildNarrative } from "@/lib/narrative";
import { createPatient, listPatientsForOrg, requireOrgContext, setActivePatientCookie } from "@/lib/db/queries";
import { getRoster, mergeEntitiesIntoRoster, saveRoster } from "@/lib/roster";
import { SEED_PATIENTS } from "@/lib/seed-data";
import { errorResponse } from "@/lib/api-errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

// Seeds the Implementation Plan's "2-3 synthetic patients under one demo
// org" (Phase 5 checklist) — Rina Kapoor's full 3-year CKD storyline plus
// two lighter patients, so the new patient switcher has real, distinct data
// to switch between. Idempotent by patient name within the org: re-running
// this after Rina already exists tops up any of her documents that are
// still missing rather than creating a duplicate patient.
// Off by default so production never advertises a one-click way to fabricate
// patients. Flip NEXT_PUBLIC_ENABLE_DEMO_SEED=true (locally or on the Vercel
// env for a demo) to re-enable — the UI buttons that call this route are
// gated on the same flag, so this check is defense in depth, not the only guard.
function isDemoSeedEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_SEED === "true";
}

export async function POST() {
  if (!isDemoSeedEnabled()) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const { orgId, clinicianId } = await requireOrgContext();
    // Bulk-remembers ~10 documents across 2-3 patients — a legitimate demo
    // reseed is rare, so a tight hourly cap catches accidental double-clicks
    // or scripted abuse without blocking normal use.
    await enforceRateLimit(`clinician:${clinicianId}:seed-demo`, 5, 3600);
    const existing = await listPatientsForOrg(orgId);

    const results: { patient: string; documentType: string; documentDate: string | null; status: number }[] = [];
    let firstPatientId: string | null = null;

    for (const seedPatient of SEED_PATIENTS) {
      let patient = existing.find((p) => p.name === seedPatient.name);
      if (!patient) {
        patient = await createPatient(orgId, seedPatient.name, seedPatient.dob);
      }
      if (!firstPatientId) firstPatientId = patient.id;

      let roster = await getRoster(patient.id);
      const alreadySeeded = roster.documents.length >= seedPatient.documents.length;
      if (alreadySeeded) {
        results.push({ patient: patient.name, documentType: "(skipped, already seeded)", documentDate: null, status: 200 });
        continue;
      }

      for (const entities of seedPatient.documents) {
        const narrative = buildNarrative(patient.name, entities);
        try {
          const { status } = await cogneeRemember(narrative, patient.datasetName);
          results.push({ patient: patient.name, documentType: entities.documentType, documentDate: entities.documentDate, status });
          if (status >= 200 && status < 300) {
            const dataId = await cogneeGetLatestDataId(patient.datasetName);
            if (dataId) roster = mergeEntitiesIntoRoster(roster, entities, dataId, narrative);
          }
        } catch (err) {
          results.push({ patient: patient.name, documentType: entities.documentType, documentDate: entities.documentDate, status: 500 });
          logError("seedDemo.remember.failed", err, { patient: patient.name, documentType: entities.documentType });
        }
      }
      await saveRoster(patient.id, roster);
    }

    if (firstPatientId) await setActivePatientCookie(firstPatientId);

    const failed = results.filter((r) => r.status < 200 || r.status >= 300);
    return Response.json(
      { seeded: results.length, failed: failed.length, results },
      { status: failed.length === results.length && results.length > 0 ? 500 : 200 }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
