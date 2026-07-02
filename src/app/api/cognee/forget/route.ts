import { cogneeForget } from "@/lib/cognee";
import { requirePatientContext } from "@/lib/db/queries";
import { errorResponse } from "@/lib/api-errors";

// Thin proxy so forget() calls show up in the client-side operations log,
// same pattern as /api/cognee/improve. Always scoped to the active patient's
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
    const { patient } = await requirePatientContext();
    const { status, body: cogneeBody } = await cogneeForget({
      dataId,
      dataset: patient.datasetName,
      memoryOnly,
    });
    return Response.json(cogneeBody, { status });
  } catch (err) {
    return errorResponse(err);
  }
}
