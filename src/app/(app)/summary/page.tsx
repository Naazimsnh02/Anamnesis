"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Roster } from "@/lib/roster";

type RosterResponse = Roster & { patient: { id: string; name: string } };

type LogEntry = {
  time: string;
  op: "forget" | "improve";
  label: string;
  status: number;
  detail: string;
};

function pushLog(setLog: (fn: (prev: LogEntry[]) => LogEntry[]) => void, entry: LogEntry) {
  setLog((prev) => [entry, ...prev]);
}

export default function SummaryPage() {
  const [roster, setRoster] = useState<RosterResponse | null>(null);
  const [noPatients, setNoPatients] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function fetchRoster() {
    const res = await fetch("/api/documents/roster");
    if (res.ok) {
      setRoster(await res.json());
      setNoPatients(false);
    } else if (res.status === 409) {
      setNoPatients(true);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount to load the current roster
    fetchRoster();
  }, []);

  async function markStatus(entityType: "diagnosis" | "medication", name: string) {
    const key = `${entityType}:${name}`;
    setBusyKey(key);
    setError(null);
    try {
      const res = await fetch("/api/documents/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, name, note: notes[key] || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Status update failed (HTTP ${res.status})`);

      setRoster((prev) => (prev ? { ...(data.roster as Roster), patient: prev.patient } : prev));
      pushLog(setLog, {
        time: new Date().toLocaleTimeString(),
        op: "improve",
        label: `remember() correction + improve() — ${
          entityType === "diagnosis" ? "ruled out" : "discontinued"
        }: ${name}`,
        status: data.cognee.status,
        detail: data.narrative,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusyKey(null);
    }
  }

  const activeDiagnoses = roster?.diagnoses.filter((d) => d.status === "active") ?? [];
  const ruledOutDiagnoses = roster?.diagnoses.filter((d) => d.status === "ruled_out") ?? [];
  const currentMeds = roster?.medications.filter((m) => m.status === "current") ?? [];
  const discontinuedMeds = roster?.medications.filter((m) => m.status === "discontinued") ?? [];

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <main className="wrap flex max-w-4xl flex-col gap-10 py-16">
        <div>
          <div className="flex items-center justify-between">
            <Link href="/" className="mono text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">
              ← Back to site
            </Link>
            <div className="flex gap-4">
              <Link href="/remember" className="mono text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">
                remember() →
              </Link>
              <Link href="/assistant" className="mono text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">
                Ask the memory →
              </Link>
            </div>
          </div>
          <p className="eyebrow mt-4">forget()</p>
          <h1 className="display d-lg mt-2 text-[var(--ink)]">
            <em>{roster?.patient.name ?? "your patient's"}</em> current summary
          </h1>
          <p className="lede mt-3 max-w-xl">
            Mark a diagnosis ruled out or a medication discontinued and the active summary updates
            immediately via <span className="mono">forget()</span>-adjacent correction — nothing is
            deleted, it moves to history below.
          </p>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {noPatients && (
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              No patients yet — add or seed one from{" "}
              <Link href="/remember" className="underline">
                remember()
              </Link>
              .
            </p>
          )}
        </div>

        {!noPatients && (
        <>
        <section className="card p-6">
          <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            Active conditions
          </h2>
          {activeDiagnoses.length === 0 && (
            <p className="mt-2 text-sm text-[var(--ink-faint)]">
              None yet — seed patient history or upload a document from{" "}
              <Link href="/remember" className="underline">
                remember()
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

        <section>
          <h2 className="mono mb-3 text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            Cognee operations log
          </h2>
          <div className="flex flex-col gap-2">
            {log.length === 0 && (
              <p className="text-sm text-[var(--ink-faint)]">No calls made yet.</p>
            )}
            {log.map((entry, i) => (
              <div key={i} className="card mono p-3 text-xs">
                <div className="flex justify-between text-[var(--ink-soft)]">
                  <span>
                    [{entry.time}] {entry.op}() — HTTP {entry.status}
                  </span>
                </div>
                <div className="mt-1 text-[var(--ink)]">→ {entry.label}</div>
                <div className="mt-1 break-all text-[var(--ink-faint)]">{entry.detail}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
