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
      // Cognee 404s a dataset that has never had remember()/cognify() run on
      // it (a patient with zero uploaded/seeded documents) with this exact
      // message — surface it as an actionable prompt instead of a bare
      // "Recall failed", since it's an expected state, not a real failure.
      const isEmptyMemory =
        status === 404 &&
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        body.error === "Recall prerequisites not met";
      return Response.json(
        {
          error: isEmptyMemory
            ? `${patient.name} doesn't have any remembered documents yet — upload or seed one from Remember first.`
            : "Recall failed",
          emptyMemory: isEmptyMemory,
          cognee: body,
        },
        { status }
      );
    }

    const parsed = parseRecallResponse(body);
    return Response.json({ ...parsed, raw: body }, { status });
  } catch (err) {
    return errorResponse(err);
  }
}
