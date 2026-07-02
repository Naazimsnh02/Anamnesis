import { cogneeRemember } from "@/lib/cognee";

export async function POST(request: Request) {
  const { text, datasetName } = await request.json();

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const { status, body } = await cogneeRemember(
      text,
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
