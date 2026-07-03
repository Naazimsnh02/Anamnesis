"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import type { Roster } from "@/lib/roster";
import { buildTimeline } from "@/lib/timeline";
import { useOpsLog } from "@/lib/opsLog";
import { useActivePatient } from "@/lib/useActivePatient";
import { FetchError } from "@/lib/swrFetcher";
import { GraphView, type GraphEdge, type GraphNode } from "@/components/GraphView";
import { DashboardSkeleton } from "@/components/Skeleton";
import { DatePicker } from "@/components/ui/DatePicker";

type RosterResponse = Roster & { patient: { id: string; name: string } };
type GraphResponse = { nodes: GraphNode[]; edges: GraphEdge[] };

export default function DashboardPage() {
  const { logOp } = useOpsLog();
  const { activePatient, refreshAll } = useActivePatient();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [allergyInput, setAllergyInput] = useState("");
  const [appointmentInput, setAppointmentInput] = useState("");
  const [seeding, setSeeding] = useState(false);

  const {
    data: roster,
    error: fetchError,
    isLoading: loading,
    mutate: fetchRoster,
  } = useSWR<RosterResponse>("/api/documents/roster", {
    shouldRetryOnError: (err) => !(err instanceof FetchError && err.status === 409),
  });
  const noPatients = fetchError instanceof FetchError && fetchError.status === 409;
  const error = mutationError ?? (noPatients ? null : fetchError?.message ?? null);

  const { data: graph, isLoading: graphLoading, mutate: fetchGraph } = useSWR<GraphResponse>(
    activePatient ? "/api/cognee/graph" : null
  );

  async function markStatus(entityType: "diagnosis" | "medication", name: string) {
    const key = `${entityType}:${name}`;
    setBusyKey(key);
    setMutationError(null);
    try {
      const res = await fetch("/api/documents/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, name, note: notes[key] || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Status update failed (HTTP ${res.status})`);

      await fetchRoster(
        (prev) => (prev ? { ...(data.roster as Roster), patient: prev.patient } : prev),
        { revalidate: false }
      );
      logOp({
        op: "improve",
        label: `Correction recorded: ${
          entityType === "diagnosis" ? "ruled out" : "discontinued"
        }: ${name}`,
        status: data.cognee.status,
        detail: data.narrative,
      });
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusyKey(null);
    }
  }

  async function saveOverview(updates: { allergies?: string[]; upcomingAppointment?: string | null }) {
    setMutationError(null);
    try {
      const res = await fetch("/api/documents/roster", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Update failed (HTTP ${res.status})`);
      await fetchRoster((prev) => (prev ? { ...(data as Roster), patient: prev.patient } : prev), {
        revalidate: false,
      });
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleSeedDemo() {
    setSeeding(true);
    setMutationError(null);
    try {
      const res = await fetch("/api/patients/seed-demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok && data.seeded === undefined) {
        throw new Error(data.error || `Seeding failed (HTTP ${res.status})`);
      }
      await refreshAll();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSeeding(false);
    }
  }

  const activeDiagnoses = roster?.diagnoses.filter((d) => d.status === "active") ?? [];
  const ruledOutDiagnoses = roster?.diagnoses.filter((d) => d.status === "ruled_out") ?? [];
  const currentMeds = roster?.medications.filter((m) => m.status === "current") ?? [];
  const discontinuedMeds = roster?.medications.filter((m) => m.status === "discontinued") ?? [];
  const timeline = roster ? buildTimeline(roster) : [];
  const lastVisit = timeline.find((e) => e.date)?.date ?? null;
  const graphNodes = graph?.nodes ?? [];
  const graphEdges = graph?.edges ?? [];

  return (
    <main className="wrap flex max-w-4xl flex-col gap-10 py-16">
      <div>
        <h1 className="display d-lg text-[var(--ink)]">
          <em>{roster?.patient.name ?? "Your patient's"}</em> overview
        </h1>
        <p className="lede mt-3">
          Everything Anamnesis remembers about this patient, including active conditions, medications,
          timeline, memory graph, and source documents, is in one place.
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}{" "}
            <button onClick={() => fetchRoster()} className="underline">
              Retry
            </button>
          </p>
        )}
      </div>

      {loading && !roster && !error && !noPatients && <DashboardSkeleton />}

      {noPatients && (
        <section className="card p-6">
          <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            No patients yet
          </h2>
          <p className="lede mt-1 text-sm">
            {process.env.NEXT_PUBLIC_ENABLE_DEMO_SEED === "true"
              ? "Add a patient from the switcher above, or seed two or three synthetic demo patients with approximately three years of records each, including conditions like hypertension, declining kidney function, diabetes, and osteoarthritis, in one call."
              : "Add a patient from the switcher above, then upload their documents from Remember."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {process.env.NEXT_PUBLIC_ENABLE_DEMO_SEED === "true" && (
              <button onClick={handleSeedDemo} disabled={seeding} className="btn btn-primary">
                {seeding ? "Seeding demo patients…" : "Seed demo patients"}
              </button>
            )}
            <Link href="/remember" className="mono text-xs text-[var(--pen)] underline">
              or upload a document from Remember
            </Link>
          </div>
          {mutationError && <p className="mt-3 text-sm text-red-600">{mutationError}</p>}
        </section>
      )}

      {!noPatients && roster && (
        <>
          {/* Patient Overview */}
          <section className="card p-6">
            <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              Patient overview
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mono text-xs text-[var(--ink-faint)]">Active conditions</p>
                <p className="mt-1 text-sm">{activeDiagnoses.length === 0 ? "None" : activeDiagnoses.map((d) => d.name).join(", ")}</p>
              </div>
              <div>
                <p className="mono text-xs text-[var(--ink-faint)]">Current medications</p>
                <p className="mt-1 text-sm">{currentMeds.length === 0 ? "None" : currentMeds.map((m) => m.name).join(", ")}</p>
              </div>
              <div>
                <p className="mono text-xs text-[var(--ink-faint)]">Last visit</p>
                <p className="mt-1 text-sm">{lastVisit ?? "No recorded visits yet"}</p>
              </div>
              <div>
                <p className="mono text-xs text-[var(--ink-faint)]">Upcoming appointment</p>
                {roster.upcomingAppointment ? (
                  <p className="mt-1 flex items-center gap-2 text-sm">
                    {roster.upcomingAppointment}
                    <button
                      onClick={() => saveOverview({ upcomingAppointment: null })}
                      className="mono text-xs text-[var(--ink-faint)] hover:underline"
                    >
                      Clear
                    </button>
                  </p>
                ) : (
                  <form
                    className="mt-1 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!appointmentInput.trim()) return;
                      saveOverview({ upcomingAppointment: appointmentInput.trim() });
                      setAppointmentInput("");
                    }}
                  >
                    <DatePicker
                      value={appointmentInput}
                      onChange={setAppointmentInput}
                      className="py-1 text-xs"
                    />
                    <button type="submit" className="mono text-xs text-[var(--pen)] hover:underline">
                      Set
                    </button>
                  </form>
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="mono text-xs text-[var(--ink-faint)]">Allergies</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  {roster.allergies.length === 0 && <span className="text-[var(--ink-faint)]">None recorded</span>}
                  {roster.allergies.map((a) => (
                    <span key={a} className="flex items-center gap-1 rounded-full border border-[var(--line)] px-2 py-0.5 text-xs">
                      {a}
                      <button
                        onClick={() => saveOverview({ allergies: roster.allergies.filter((x) => x !== a) })}
                        className="text-[var(--ink-faint)] hover:text-[var(--ink)]"
                        aria-label={`Remove ${a}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </p>
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const value = allergyInput.trim();
                    if (!value || roster.allergies.includes(value)) return;
                    saveOverview({ allergies: [...roster.allergies, value] });
                    setAllergyInput("");
                  }}
                >
                  <input
                    placeholder="Add an allergy"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    className="w-40 rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs mono transition hover:border-[var(--pen)] focus:border-[var(--pen)] focus:outline-none"
                  />
                  <button type="submit" className="mono text-xs text-[var(--pen)] hover:underline">
                    Add
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* Active conditions with actions */}
          <section className="card p-6">
            <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              Active conditions
            </h2>
            {activeDiagnoses.length === 0 && (
              <p className="mt-2 text-sm text-[var(--ink-faint)]">
                None yet. Seed patient history or upload a document from{" "}
                <Link href="/remember" className="underline">
                  Remember
                </Link>
                .
              </p>
            )}
            <div className="mt-4 flex flex-col gap-3">
              {activeDiagnoses.map((dx) => {
                const key = `diagnosis:${dx.name}`;
                return (
                  <div key={dx.name} className="flex flex-col gap-2 rounded border border-[var(--line)] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{dx.name}</p>
                      {dx.firstDate && <p className="mono text-xs text-[var(--ink-faint)]">since {dx.firstDate}</p>}
                    </div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Optional note"
                        value={notes[key] ?? ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-40 rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs mono transition hover:border-[var(--pen)] focus:border-[var(--pen)] focus:outline-none"
                      />
                      <button
                        onClick={() => markStatus("diagnosis", dx.name)}
                        disabled={busyKey !== null}
                        className="mono shrink-0 text-xs text-[var(--pen)] hover:underline disabled:opacity-50"
                      >
                        {busyKey === key ? "Marking…" : "Mark ruled out"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Current medications with actions */}
          <section className="card p-6">
            <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              Current medications
            </h2>
            {currentMeds.length === 0 && <p className="mt-2 text-sm text-[var(--ink-faint)]">None yet.</p>}
            <div className="mt-4 flex flex-col gap-3">
              {currentMeds.map((med) => {
                const key = `medication:${med.name}`;
                return (
                  <div key={med.name} className="flex flex-col gap-2 rounded border border-[var(--line)] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {med.name}
                        {med.dosage ? ` · ${med.dosage}` : ""}
                      </p>
                      {med.firstDate && <p className="mono text-xs text-[var(--ink-faint)]">since {med.firstDate}</p>}
                    </div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Optional note"
                        value={notes[key] ?? ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-40 rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs mono transition hover:border-[var(--pen)] focus:border-[var(--pen)] focus:outline-none"
                      />
                      <button
                        onClick={() => markStatus("medication", med.name)}
                        disabled={busyKey !== null}
                        className="mono shrink-0 text-xs text-[var(--pen)] hover:underline disabled:opacity-50"
                      >
                        {busyKey === key ? "Marking…" : "Mark discontinued"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Timeline */}
          <section className="card p-6">
            <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              Timeline
            </h2>
            {timeline.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--ink-faint)]">No events recorded yet.</p>
            ) : (
              <ol className="mt-4 flex flex-col gap-3 border-l border-[var(--line)] pl-4">
                {timeline.map((e, i) => (
                  <li key={i} className="text-sm">
                    <p className="mono text-xs text-[var(--ink-faint)]">{e.date ?? "undated"}</p>
                    <p>{e.label}</p>
                    {e.detail && <p className="text-xs text-[var(--ink-soft)]">{e.detail}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Memory graph */}
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                Memory graph: {graphNodes.length} entities, {graphEdges.length} relationships
              </h2>
              <button
                onClick={() => fetchGraph()}
                disabled={graphLoading}
                className="mono text-xs text-[var(--pen)] underline disabled:opacity-50"
              >
                {graphLoading ? "refreshing…" : "refresh"}
              </button>
            </div>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Live view of the patient&apos;s knowledge graph. Grows every time a document is
              added and linked into prior history.
            </p>
            <div className="mt-4">
              {graphLoading && !graph ? (
                <div className="skeleton h-64 w-full rounded-lg" />
              ) : (
                <GraphView nodes={graphNodes} edges={graphEdges} />
              )}
            </div>
          </section>

          {/* Documents */}
          <section className="card p-6">
            <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              Documents
            </h2>
            {roster.documents.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--ink-faint)]">
                No documents yet. Upload one from{" "}
                <Link href="/remember" className="underline">
                  Remember
                </Link>
                .
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {[...roster.documents]
                  .sort((a, b) => (b.documentDate ?? "").localeCompare(a.documentDate ?? ""))
                  .map((doc) => (
                    <div key={doc.dataId} className="rounded border border-[var(--line)] p-3 text-sm">
                      <p className="mono text-xs text-[var(--pen)]">
                        {doc.documentType.replace(/_/g, " ")}
                        {doc.documentDate ? ` · ${doc.documentDate}` : ""}
                      </p>
                      <p className="mt-1 text-[var(--ink-soft)]">{doc.narrative}</p>
                      {doc.documentUrl && (
                        <a
                          href={doc.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mono mt-2 inline-block text-xs text-[var(--pen)] underline"
                        >
                          view original file
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* History */}
          <section className="card p-6">
            <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              History: ruled out and discontinued
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Nothing is deleted. These stay recoverable, just out of the active summary above.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              {ruledOutDiagnoses.length === 0 && discontinuedMeds.length === 0 && (
                <p className="text-[var(--ink-faint)]">Nothing archived yet.</p>
              )}
              {ruledOutDiagnoses.map((dx) => (
                <div key={dx.name} className="rounded border border-[var(--line)] p-3">
                  <span className="font-medium">{dx.name}</span>{" "}
                  <span className="text-[var(--ink-soft)]">ruled out {dx.ruledOutDate}</span>
                  {dx.ruledOutNote && <span className="text-[var(--ink-faint)]"> · {dx.ruledOutNote}</span>}
                </div>
              ))}
              {discontinuedMeds.map((med) => (
                <div key={med.name} className="rounded border border-[var(--line)] p-3">
                  <span className="font-medium">{med.name}</span>{" "}
                  <span className="text-[var(--ink-soft)]">discontinued {med.discontinuedDate}</span>
                  {med.discontinuedNote && <span className="text-[var(--ink-faint)]"> · {med.discontinuedNote}</span>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
