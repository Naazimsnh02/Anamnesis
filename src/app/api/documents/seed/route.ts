import { cogneeRemember } from "@/lib/cognee";
import { buildNarrative } from "@/lib/narrative";
import { DEMO_PATIENT } from "@/lib/patient";
import { getRoster, mergeEntitiesIntoRoster, saveRoster } from "@/lib/roster";
import { SEED_DOCUMENTS } from "@/lib/seed-data";

// Seeds ~3 years of synthetic patient history into the demo patient's Cognee
// dataset (Implementation Plan Phase 1: "Seed 2-3 years of synthetic patient
// history for demo continuity"). Runs the same buildNarrative() ->
// cogneeRemember() pipeline as a real upload, one remember() call per
// document, so the resulting graph is indistinguishable from one built by
// uploading real files. Also folds each document's entities into the
// roster (src/lib/roster.ts) so Phase 4's Patient Summary has real active
// diagnoses/medications to mark ruled-out/discontinued.
export async function POST() {
  const results: { documentDate: string | null; documentType: string; status: number }[] = [];
  let roster = await getRoster();

  for (const entities of SEED_DOCUMENTS) {
    const narrative = buildNarrative(DEMO_PATIENT.name, entities);
    try {
      const { status, body } = await cogneeRemember(narrative, DEMO_PATIENT.datasetName);
      results.push({ documentDate: entities.documentDate, documentType: entities.documentType, status });
      if (status >= 200 && status < 300) {
        const items = (body as { items?: { id?: string }[] } | null)?.items;
        const dataId = items?.[0]?.id;
        if (dataId) {
          roster = mergeEntitiesIntoRoster(roster, entities, dataId, narrative);
        }
      }
    } catch (err) {
      results.push({
        documentDate: entities.documentDate,
        documentType: entities.documentType,
        status: 500,
      });
      console.error(`seed remember() failed for ${entities.documentType} (${entities.documentDate}):`, err);
    }
  }

  await saveRoster(roster);

  const failed = results.filter((r) => r.status < 200 || r.status >= 300);
  return Response.json(
    { seeded: results.length, failed: failed.length, results, roster },
    { status: failed.length === results.length ? 500 : 200 }
  );
}
