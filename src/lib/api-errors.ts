import { NoPatientsError } from "@/lib/db/queries";
import { RateLimitedError } from "@/lib/rate-limit";

// Shared error->response mapping for every org/patient-scoped API route, so
// "org has no patients yet" reads as a clear, actionable 409 instead of a
// generic 500 in every route's catch block.
export function errorResponse(err: unknown): Response {
  if (err instanceof NoPatientsError) {
    return Response.json({ error: "No patients yet — add or seed one first." }, { status: 409 });
  }
  if (err instanceof RateLimitedError) {
    return Response.json(
      { error: err.message },
      { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } }
    );
  }
  return Response.json(
    { error: err instanceof Error ? err.message : "Unknown error" },
    { status: 500 }
  );
}
