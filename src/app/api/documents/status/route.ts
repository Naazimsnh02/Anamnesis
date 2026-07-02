import { cogneeImprove, cogneeRemember } from "@/lib/cognee";
import { requirePatientContext } from "@/lib/db/queries";
import { errorResponse } from "@/lib/api-errors";
import { getRoster, saveRoster } from "@/lib/roster";

// Marks a diagnosis "ruled out" or a medication "discontinued". Cognee's
// forget() can't target a single graph entity (see src/lib/roster.ts), so
// this instead (a) flips the roster's status flag, which is what the
// Patient Summary filters on, and (b) remember()s a correction narrative so
// the graph/recall() itself reflects the change too — the same
// "clinicians correct entities, memory gets more accurate" pattern as
// Phase 3's improve().
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const entityType = body.entityType;
  const name = typeof body.name === "string" ? body.name : null;
  const date = typeof body.date === "string" && body.date ? body.date : new Date().toISOString().slice(0, 10);
  const note = typeof body.note === "string" && body.note ? body.note : null;

  if ((entityType !== "diagnosis" && entityType !== "medication") || !name) {
    return Response.json(
      { error: "entityType ('diagnosis' | 'medication') and name are required" },
      { status: 400 }
    );
  }

  try {
    const { patient } = await requirePatientContext();
    const roster = await getRoster(patient.id);

    let narrative: string;
    if (entityType === "diagnosis") {
      const dx = roster.diagnoses.find((d) => d.name.toLowerCase() === name.toLowerCase());
      if (!dx || dx.status !== "active") {
        return Response.json({ error: `No active diagnosis named "${name}"` }, { status: 404 });
      }
      dx.status = "ruled_out";
      dx.ruledOutDate = date;
      dx.ruledOutNote = note ?? undefined;
      narrative = `${patient.name}'s ${dx.name} diagnosis has been ruled out as of ${date}${
        note ? `: ${note}` : ""
      }. It is no longer an active condition and no longer appears in the current clinical summary, though it remains in the historical record.`;
    } else {
      const med = roster.medications.find((m) => m.name.toLowerCase() === name.toLowerCase());
      if (!med || med.status !== "current") {
        return Response.json({ error: `No current medication named "${name}"` }, { status: 404 });
      }
      med.status = "discontinued";
      med.discontinuedDate = date;
      med.discontinuedNote = note ?? undefined;
      narrative = `${patient.name}'s ${med.name} was discontinued as of ${date}${
        note ? `: ${note}` : ""
      }. It has moved from current medications to medication history.`;
    }

    await saveRoster(patient.id, roster);

    const { status, body: rememberBody } = await cogneeRemember(narrative, patient.datasetName);
    let improve: { status: number; body: unknown } | null = null;
    if (status >= 200 && status < 300) {
      try {
        improve = await cogneeImprove(patient.datasetName);
      } catch (err) {
        console.error("cogneeImprove failed after status change:", err);
      }
    }

    return Response.json({
      roster,
      narrative,
      cognee: { status, body: rememberBody },
      improve,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
