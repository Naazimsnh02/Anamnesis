import { cogneeRecall } from "@/lib/cognee";
import { parseRecallResponse } from "@/lib/evidence";
import { requirePatientContext } from "@/lib/db/queries";
import { errorResponse } from "@/lib/api-errors";

export async function POST(request: Request) {
  const { query } = await request.json();

  if (typeof query !== "string" || !query.trim()) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const { patient } = await requirePatientContext();
    const { status, body } = await cogneeRecall(query, patient.datasetName, { includeReferences: true });

    if (status >= 400) {
      return Response.json({ error: "Recall failed", cognee: body }, { status });
    }

    const parsed = parseRecallResponse(body);
    return Response.json({ ...parsed, raw: body }, { status });
  } catch (err) {
    return errorResponse(err);
  }
}
