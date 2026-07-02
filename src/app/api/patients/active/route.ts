import { getPatientForOrg, requireOrgContext, setActivePatientCookie } from "@/lib/db/queries";

// Switches the "active patient" cookie every org-scoped page/route resolves
// against (see requirePatientContext() in src/lib/db/queries.ts).
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const patientId = typeof body.patientId === "string" ? body.patientId : null;
  if (!patientId) {
    return Response.json({ error: "patientId is required" }, { status: 400 });
  }

  try {
    const { orgId } = await requireOrgContext();
    const patient = await getPatientForOrg(orgId, patientId);
    if (!patient) {
      return Response.json({ error: "Patient not found in this org" }, { status: 404 });
    }
    await setActivePatientCookie(patient.id);
    return Response.json({ patient });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
