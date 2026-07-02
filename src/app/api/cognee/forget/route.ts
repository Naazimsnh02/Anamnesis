import { cogneeForget } from "@/lib/cognee";
import { DEMO_PATIENT } from "@/lib/patient";

// Thin proxy so forget() calls show up in the client-side operations log,
// same pattern as /api/cognee/improve. Always scoped to the demo patient's
// own dataset server-side, and always requires a specific dataId — never
// exposes dataset-wide or "everything" deletion to the client.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const dataId = typeof body.dataId === "string" ? body.dataId : null;
  if (!dataId) {
    return Response.json({ error: "dataId is required" }, { status: 400 });
  }
  const memoryOnly = body.memoryOnly === true;

  try {
    const { status, body: cogneeBody } = await cogneeForget({
      dataId,
      dataset: DEMO_PATIENT.datasetName,
      memoryOnly,
    });
    return Response.json(cogneeBody, { status });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
