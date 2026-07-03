import { cogneeForget, cogneeImprove, cogneeRemember } from "@/lib/cognee";
import { extractEntitiesFromDocument } from "@/lib/gemini";
import { buildNarrative } from "@/lib/narrative";
import { requirePatientContext } from "@/lib/db/queries";
import { errorResponse } from "@/lib/api-errors";
import { findDuplicateDocument, getRoster, mergeEntitiesIntoRoster, saveRoster } from "@/lib/roster";
import { storeOriginalDocument } from "@/lib/storage";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const documentTypeHint = form.get("documentType");

  if (!(file instanceof File)) {
    return Response.json({ error: "file is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { patient, clinicianId } = await requirePatientContext();
    // OCR + Cognee remember()/improve() is the most expensive write path in
    // the app (Gemini vision call + two Cognee API calls) — cap it well
    // below what a real upload workflow needs to blunt runaway retries or a
    // misbehaving client.
    await enforceRateLimit(`clinician:${clinicianId}:upload`, 20, 60);

    const entities = await extractEntitiesFromDocument(
      buffer,
      file.type || "application/pdf",
      typeof documentTypeHint === "string" ? documentTypeHint : undefined
    );
    const narrative = buildNarrative(patient.name, entities);

    let documentUrl: string | null = null;
    try {
      documentUrl = await storeOriginalDocument(buffer, file.name, file.type || "application/octet-stream");
    } catch (err) {
      // Original-file storage (Vercel Blob) is not wired up yet in every
      // environment; the memory pipeline should still succeed without it.
      logError("storeOriginalDocument.failed", err, { patientId: patient.id });
    }

    // Phase 4 "Forget": a document with the same type + date as one already
    // in the roster is treated as a near-duplicate report — forget() the
    // old data item so the new one supersedes it instead of the graph
    // accumulating two copies of the same report.
    const roster = await getRoster(patient.id);
    const duplicate = findDuplicateDocument(roster, entities);
    let forget: { status: number; body: unknown } | null = null;
    if (duplicate) {
      try {
        forget = await cogneeForget({ dataId: duplicate.dataId, dataset: patient.datasetName });
      } catch (err) {
        logError("cogneeForget.mergeDuplicate.failed", err, { patientId: patient.id, dataId: duplicate.dataId });
      }
    }

    const { status, body } = await cogneeRemember(narrative, patient.datasetName);

    // Re-run enrichment over the whole dataset so the newly-remembered
    // entities get linked into prior history (Phase 3 "Improve"), not just
    // appended alongside it. Best-effort: a failed enrichment pass shouldn't
    // fail the upload, since the memory itself was already committed above.
    let improve: { status: number; body: unknown } | null = null;
    if (status >= 200 && status < 300) {
      try {
        improve = await cogneeImprove(patient.datasetName);
      } catch (err) {
        logError("cogneeImprove.afterUpload.failed", err, { patientId: patient.id });
      }
    }

    let updatedRoster = roster;
    if (status >= 200 && status < 300) {
      const items = (body as { items?: { id?: string }[] } | null)?.items;
      const dataId = items?.[0]?.id;
      if (dataId) {
        updatedRoster = mergeEntitiesIntoRoster(roster, entities, dataId, narrative);
        await saveRoster(patient.id, updatedRoster);
      }
    }

    return Response.json(
      {
        entities,
        narrative,
        documentUrl,
        cognee: { status, body },
        improve,
        forget,
        merged: Boolean(duplicate),
        roster: updatedRoster,
      },
      { status: status >= 200 && status < 300 ? 200 : status }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
