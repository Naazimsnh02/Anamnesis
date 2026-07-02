import { cogneeGetGraph, cogneeListDatasets } from "@/lib/cognee";
import { toClinicalGraph, type RawGraph } from "@/lib/graph";
import { requirePatientContext } from "@/lib/db/queries";
import { errorResponse } from "@/lib/api-errors";

export async function GET() {
  try {
    const { patient } = await requirePatientContext();

    const { status: dsStatus, body: dsBody } = await cogneeListDatasets();
    if (dsStatus >= 400) {
      return Response.json({ error: "Failed to list datasets", cognee: dsBody }, { status: dsStatus });
    }

    const dataset = (dsBody as { id: string; name: string }[]).find((d) => d.name === patient.datasetName);
    if (!dataset) {
      return Response.json({ nodes: [], edges: [] });
    }

    const { status, body } = await cogneeGetGraph(dataset.id);
    if (status >= 400) {
      return Response.json({ error: "Failed to fetch graph", cognee: body }, { status });
    }

    return Response.json(toClinicalGraph(body as RawGraph));
  } catch (err) {
    return errorResponse(err);
  }
}
