import { cogneeRecall } from "@/lib/cognee";

export async function POST(request: Request) {
  const { query, datasetName } = await request.json();

  if (typeof query !== "string" || !query.trim()) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const { status, body } = await cogneeRecall(
      query,
      typeof datasetName === "string" && datasetName ? datasetName : "hello_world"
    );
    return Response.json(body, { status });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
