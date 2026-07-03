import { cogneeHealth } from "@/lib/cognee";
import { errorResponse } from "@/lib/api-errors";

export async function GET() {
  try {
    const { status, body } = await cogneeHealth();
    return Response.json(body, { status });
  } catch (err) {
    return errorResponse(err);
  }
}
