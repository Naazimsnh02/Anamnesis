import { cogneeHealth } from "@/lib/cognee";

export async function GET() {
  try {
    const { status, body } = await cogneeHealth();
    return Response.json(body, { status });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
