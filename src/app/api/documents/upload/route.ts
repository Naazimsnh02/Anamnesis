import { cogneeImprove, cogneeRemember } from "@/lib/cognee";
import { extractEntitiesFromDocument } from "@/lib/gemini";
import { buildNarrative } from "@/lib/narrative";
import { DEMO_PATIENT } from "@/lib/patient";
import { storeOriginalDocument } from "@/lib/storage";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const documentTypeHint = form.get("documentType");

  if (!(file instanceof File)) {
    return Response.json({ error: "file is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const entities = await extractEntitiesFromDocument(
      buffer,
      file.type || "application/pdf",
      typeof documentTypeHint === "string" ? documentTypeHint : undefined
    );
    const narrative = buildNarrative(DEMO_PATIENT.name, entities);

    let documentUrl: string | null = null;
    try {
      documentUrl = await storeOriginalDocument(buffer, file.name, file.type || "application/octet-stream");
    } catch (err) {
      // Original-file storage (Vercel Blob) is not wired up yet in every
      // environment; the memory pipeline should still succeed without it.
      console.error("storeOriginalDocument failed:", err);
    }

    const { status, body } = await cogneeRemember(narrative, DEMO_PATIENT.datasetName);

    // Re-run enrichment over the whole dataset so the newly-remembered
    // entities get linked into prior history (Phase 3 "Improve"), not just
    // appended alongside it. Best-effort: a failed enrichment pass shouldn't
    // fail the upload, since the memory itself was already committed above.
    let improve: { status: number; body: unknown } | null = null;
    if (status >= 200 && status < 300) {
      try {
        improve = await cogneeImprove(DEMO_PATIENT.datasetName);
      } catch (err) {
        console.error("cogneeImprove failed after upload:", err);
      }
    }

    return Response.json(
      {
        entities,
        narrative,
        documentUrl,
        cognee: { status, body },
        improve,
      },
      { status: status >= 200 && status < 300 ? 200 : status }
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
