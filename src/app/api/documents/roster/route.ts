import { requirePatientContext } from "@/lib/db/queries";
import { errorResponse } from "@/lib/api-errors";
import { getRoster } from "@/lib/roster";

export async function GET() {
  try {
    const { patient } = await requirePatientContext();
    const roster = await getRoster(patient.id);
    return Response.json({ ...roster, patient });
  } catch (err) {
    return errorResponse(err);
  }
}
