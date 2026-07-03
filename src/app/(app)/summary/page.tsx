"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import type { Roster } from "@/lib/roster";
import { useOpsLog } from "@/lib/opsLog";
import { FetchError } from "@/lib/swrFetcher";

type RosterResponse = Roster & { patient: { id: string; name: string } };

export default function SummaryPage() {
  const { logOp } = useOpsLog();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

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
        label: `Correction recorded — ${
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

  const activeDiagnoses = roster?.diagnoses.filter((d) => d.status === "active") ?? [];
  const ruledOutDiagnoses = roster?.diagnoses.filter((d) => d.status === "ruled_out") ?? [];
  const currentMeds = roster?.medications.filter((m) => m.status === "current") ?? [];
  const discontinuedMeds = roster?.medications.filter((m) => m.status === "discontinued") ?? [];

  return (
    <main className="wrap flex max-w-4xl flex-col gap-10 py-16">
        <div>
          <p className="eyebrow">Summary</p>
          <h1 className="display d-lg mt-2 text-[var(--ink)]">
            <em>{roster?.patient.name ?? "your patient's"}</em> current summary
          </h1>
          <p className="lede mt-3 max-w-xl">
            Mark a diagnosis ruled out or a medication discontinued and the active summary
            updates immediately — the change is recorded and nothing is deleted, it moves to
            history below.
          </p>
          {error && (
            <p className="mt-3 text-sm text-red-600">
              {error}{" "}
              <button onClick={() => fetchRoster()} className="underline">
                Retry
              </button>
            </p>
          )}
          {loading && !roster && !error && (
            <p className="mt-3 text-sm text-[var(--ink-soft)]">Loading summary…</p>
          )}
          {noPatients && (
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              No patients yet — add or seed one from{" "}
              <Link href="/remember" className="underline">
                Remember
              </Link>
              .
            </p>
          )}
        </div>

        {!noPatients && roster && (
        <>
        <section className="card p-6">
          <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            Active conditions
          </h2>
          {activeDiagnoses.length === 0 && (
            <p className="mt-2 text-sm text-[var(--ink-faint)]">
              None yet — seed patient history or upload a document from{" "}
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
                      placeholder="optional note"
                      value={notes[key] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-40 rounded border border-[var(--line)] bg-white px-2 py-1 text-xs"
                    />
                    <button
                      onClick={() => markStatus("diagnosis", dx.name)}
                      disabled={busyKey !== null}
                      className="btn btn-primary shrink-0 text-xs"
                    >
                      {busyKey === key ? "Marking…" : "Mark ruled out"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            Current medications
          </h2>
          {currentMeds.length === 0 && (
            <p className="mt-2 text-sm text-[var(--ink-faint)]">None yet.</p>
          )}
          <div className="mt-4 flex flex-col gap-3">
            {currentMeds.map((med) => {
              const key = `medication:${med.name}`;
              return (
                <div key={med.name} className="flex flex-col gap-2 rounded border border-[var(--line)] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {med.name}
                      {med.dosage ? ` — ${med.dosage}` : ""}
                    </p>
                    {med.firstDate && <p className="mono text-xs text-[var(--ink-faint)]">since {med.firstDate}</p>}
                  </div>
                  <div className="flex gap-2">
                    <input
                      placeholder="optional note"
                      value={notes[key] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-40 rounded border border-[var(--line)] bg-white px-2 py-1 text-xs"
                    />
                    <button
                      onClick={() => markStatus("medication", med.name)}
                      disabled={busyKey !== null}
                      className="btn btn-primary shrink-0 text-xs"
                    >
                      {busyKey === key ? "Marking…" : "Mark discontinued"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            History — ruled out &amp; discontinued
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
                {dx.ruledOutNote && <span className="text-[var(--ink-faint)]"> — {dx.ruledOutNote}</span>}
              </div>
            ))}
            {discontinuedMeds.map((med) => (
              <div key={med.name} className="rounded border border-[var(--line)] p-3">
                <span className="font-medium">{med.name}</span>{" "}
                <span className="text-[var(--ink-soft)]">discontinued {med.discontinuedDate}</span>
                {med.discontinuedNote && <span className="text-[var(--ink-faint)]"> — {med.discontinuedNote}</span>}
              </div>
            ))}
          </div>
        </section>
        </>
        )}
    </main>
  );
}
