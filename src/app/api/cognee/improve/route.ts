import { cogneeImprove } from "@/lib/cognee";
import { requirePatientContext } from "@/lib/db/queries";
import { errorResponse } from "@/lib/api-errors";

export async function POST() {
  try {
    const { patient } = await requirePatientContext();
    const { status, body: cogneeBody } = await cogneeImprove(patient.datasetName);
    return Response.json(cogneeBody, { status });
  } catch (err) {
    return errorResponse(err);
  }
}
