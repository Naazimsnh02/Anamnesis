import { createPatient, getActivePatientId, listPatientsForOrg, requireOrgContext } from "@/lib/db/queries";
import { errorResponse } from "@/lib/api-errors";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const { orgId } = await requireOrgContext();
    const [patientList, activePatientId] = await Promise.all([
      listPatientsForOrg(orgId),
      getActivePatientId(orgId),
    ]);
    return Response.json({ patients: patientList, activePatientId });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const dob = typeof body.dob === "string" ? body.dob.trim() : "";

  if (!name || !dob) {
    return Response.json({ error: "name and dob are required" }, { status: 400 });
  }

  try {
    const { orgId, clinicianId } = await requireOrgContext();
    await enforceRateLimit(`clinician:${clinicianId}:create-patient`, 20, 60);
    const patient = await createPatient(orgId, name, dob);
    return Response.json({ patient }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
