import { requirePatientContext } from "@/lib/db/queries";
import { errorResponse } from "@/lib/api-errors";
import { getRoster, saveRoster, updateRosterOverview } from "@/lib/roster";

export async function GET() {
  try {
    const { patient } = await requirePatientContext();
    const roster = await getRoster(patient.id);
    return Response.json({ ...roster, patient });
  } catch (err) {
    return errorResponse(err);
  }
}

// Patient Overview edits (allergies, upcoming appointment) — manually
// entered by a clinician, see roster.ts's updateRosterOverview() comment.
export async function PATCH(request: Request) {
  try {
    const { patient } = await requirePatientContext();
    const body = (await request.json()) as {
      allergies?: string[];
      upcomingAppointment?: string | null;
    };
    const roster = await getRoster(patient.id);
    const updated = updateRosterOverview(roster, body);
    await saveRoster(patient.id, updated);
    return Response.json({ ...updated, patient });
  } catch (err) {
    return errorResponse(err);
  }
}
