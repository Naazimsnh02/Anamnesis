"use client";

import { useState } from "react";
import { useActivePatient } from "@/lib/useActivePatient";

export function PatientSwitcher() {
  const { patients, activePatientId, loading, error, switchPatient, refresh, refreshAll } =
    useActivePatient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !dob) return;
    setBusy(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), dob }),
      });
      const data = await res.json();
      if (res.ok) {
        await switchPatient(data.patient.id); // reloads
      } else {
        setBusy(false);
        alert(data.error ?? "Failed to add patient");
      }
    } catch {
      setBusy(false);
    }
  }

  async function handleSeedDemo() {
    setBusy(true);
    try {
      await fetch("/api/patients/seed-demo", { method: "POST" });
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="mono text-xs text-red-600" title={error}>
          patients failed to load
        </span>
      )}
      <select
        value={activePatientId ?? ""}
        disabled={loading || patients.length === 0}
        onChange={(e) => switchPatient(e.target.value)}
        className="mono rounded-full border border-[var(--line)] bg-transparent px-3 py-1.5 text-xs text-[var(--ink)]"
      >
        {patients.length === 0 && <option value="">No patients yet</option>}
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="mono text-xs text-[var(--pen)] hover:underline"
        >
          + add patient
        </button>
      ) : (
        <form onSubmit={handleAdd} className="flex items-center gap-1.5">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-28 rounded border border-[var(--line)] bg-transparent px-2 py-1 text-xs text-[var(--ink)]"
          />
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="rounded border border-[var(--line)] bg-transparent px-2 py-1 text-xs text-[var(--ink)]"
          />
          <button type="submit" disabled={busy} className="mono text-xs text-[var(--pen)] hover:underline">
            add
          </button>
          <button type="button" onClick={() => setAdding(false)} className="mono text-xs text-[var(--ink-faint)]">
            cancel
          </button>
        </form>
      )}

      {patients.length === 0 && (
        <button
          onClick={handleSeedDemo}
          disabled={busy}
          className="mono text-xs text-[var(--pen)] hover:underline"
        >
          {busy ? "seeding…" : "seed demo patients"}
        </button>
      )}

      <button
        onClick={() => refresh()}
        className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]"
        title="Refresh patient list"
      >
        ⟳
      </button>
    </div>
  );
}
