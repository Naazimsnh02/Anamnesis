"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useActivePatient } from "@/lib/useActivePatient";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";

export function PatientSwitcher() {
  const { patients, activePatientId, loading, error, switchPatient, refresh, refreshAll } =
    useActivePatient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!adding) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAdding(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [adding]);

  function openAdd() {
    setName("");
    setDob("");
    setFormError(null);
    setAdding(true);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !dob) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), dob }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdding(false);
        await switchPatient(data.patient.id); // reloads
      } else {
        setBusy(false);
        setFormError(data.error ?? "Failed to add patient");
      }
    } catch {
      setBusy(false);
      setFormError("Failed to add patient");
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
      <Select
        value={activePatientId ?? ""}
        disabled={loading || patients.length === 0}
        onChange={(v) => switchPatient(v)}
        placeholder="No patients yet"
        options={patients.map((p) => ({ value: p.id, label: p.name }))}
      />

      <button
        onClick={openAdd}
        className="mono rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--pen)] transition hover:border-[var(--pen)] hover:text-[var(--ink)]"
      >
        + Add patient
      </button>

      {adding && typeof document !== "undefined" && createPortal(
        <>
          <div
            className="fixed inset-0 z-40 bg-[var(--ink)]/20 backdrop-blur-[1px]"
            onClick={() => !busy && setAdding(false)}
            aria-hidden
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Add patient"
          >
            <div className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-lift)]">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
                <div>
                  <p className="eyebrow">New patient</p>
                  <p className="mono mt-1 text-xs text-[var(--ink-faint)]">
                    Adds a record and a dedicated Cognee memory dataset
                  </p>
                </div>
                <button
                  onClick={() => setAdding(false)}
                  disabled={busy}
                  className="mono text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  aria-label="Close"
                >
                  Close ✕
                </button>
              </div>
              <form onSubmit={handleAdd} className="flex flex-col gap-3 px-5 py-4">
                <label className="flex flex-col gap-1">
                  <span className="mono text-xs uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                    Name
                  </span>
                  <input
                    autoFocus
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-[var(--ink)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="mono text-xs uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                    Date of birth
                  </span>
                  <DatePicker value={dob} onChange={setDob} className="w-full py-2 text-sm" />
                </label>

                {formError && (
                  <p className="mono text-xs text-[var(--ember)]">{formError}</p>
                )}

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAdding(false)}
                    disabled={busy}
                    className="btn btn-ghost rounded-full border px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy || !name.trim() || !dob}
                    className="btn btn-primary rounded-full px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {busy ? "Adding…" : "Add patient"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>,
        document.body
      )}

      {patients.length === 0 && process.env.NEXT_PUBLIC_ENABLE_DEMO_SEED === "true" && (
        <button
          onClick={handleSeedDemo}
          disabled={busy}
          className="mono text-xs text-[var(--pen)] hover:underline"
        >
          {busy ? "Seeding…" : "Seed demo patients"}
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
