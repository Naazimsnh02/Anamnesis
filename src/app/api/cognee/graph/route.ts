import { cogneeGetGraph, cogneeListDatasets } from "@/lib/cognee";
import { toClinicalGraph, type RawGraph } from "@/lib/graph";
import { DEMO_PATIENT } from "@/lib/patient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const datasetName = searchParams.get("datasetName") || DEMO_PATIENT.datasetName;

  try {
    const { status: dsStatus, body: dsBody } = await cogneeListDatasets();
    if (dsStatus >= 400) {
      return Response.json({ error: "Failed to list datasets", cognee: dsBody }, { status: dsStatus });
    }

    const dataset = (dsBody as { id: string; name: string }[]).find((d) => d.name === datasetName);
    if (!dataset) {
      return Response.json({ nodes: [], edges: [] });
    }

    const { status, body } = await cogneeGetGraph(dataset.id);
    if (status >= 400) {
      return Response.json({ error: "Failed to fetch graph", cognee: body }, { status });
    }

    return Response.json(toClinicalGraph(body as RawGraph));
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
