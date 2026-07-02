import { cogneeRecall } from "@/lib/cognee";
import { parseRecallResponse } from "@/lib/evidence";
import { DEMO_PATIENT } from "@/lib/patient";

export async function POST(request: Request) {
  const { query, datasetName } = await request.json();

  if (typeof query !== "string" || !query.trim()) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const { status, body } = await cogneeRecall(
      query,
      typeof datasetName === "string" && datasetName ? datasetName : DEMO_PATIENT.datasetName,
      { includeReferences: true }
    );

    if (status >= 400) {
      return Response.json({ error: "Recall failed", cognee: body }, { status });
    }

    const parsed = parseRecallResponse(body);
    return Response.json({ ...parsed, raw: body }, { status });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
