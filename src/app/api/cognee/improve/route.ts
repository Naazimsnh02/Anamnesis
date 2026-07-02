import { cogneeImprove } from "@/lib/cognee";
import { DEMO_PATIENT } from "@/lib/patient";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const datasetName =
    typeof body.datasetName === "string" && body.datasetName
      ? body.datasetName
      : DEMO_PATIENT.datasetName;

  try {
    const { status, body: cogneeBody } = await cogneeImprove(datasetName);
    return Response.json(cogneeBody, { status });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
