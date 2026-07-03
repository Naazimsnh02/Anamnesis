"use client";

import Link from "next/link";
import { useState } from "react";
import type { ExtractedEntities } from "@/lib/gemini";
import { useActivePatient } from "@/lib/useActivePatient";
import { useOpsLog } from "@/lib/opsLog";

const DOCUMENT_TYPES = [
  { value: "blood_report", label: "Blood report" },
  { value: "prescription", label: "Prescription" },
  { value: "discharge_summary", label: "Discharge summary" },
  { value: "imaging_report", label: "Imaging report" },
] as const;

type UploadResult = {
  entities: ExtractedEntities;
  narrative: string;
  documentUrl: string | null;
  cognee: { status: number; body: unknown };
  improve: { status: number; body: unknown } | null;
  forget: { status: number; body: unknown } | null;
  merged: boolean;
};

export default function RememberPage() {
  const { activePatient, patients, loading: patientsLoading, refreshAll } = useActivePatient();
  const { logOp } = useOpsLog();
  const [documentType, setDocumentType] = useState<(typeof DOCUMENT_TYPES)[number]["value"]>(
    "blood_report"
  );
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"upload" | "seed" | null>(null);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setBusy("upload");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("documentType", documentType);

      const res = await fetch("/api/documents/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Upload failed (HTTP ${res.status})`);
      }

      const result = data as UploadResult;
      setResults((prev) => [result, ...prev]);
      if (result.merged && result.forget) {
        logOp({
          op: "forget",
          label: `Duplicate detected (same type + date) — replaced the superseded document`,
          status: result.forget.status,
          detail: JSON.stringify(result.forget.body),
        });
      }
      logOp({
        op: "remember",
        label: `${file.name} (${documentType})${result.merged ? " — merged over duplicate" : ""}`,
        status: result.cognee.status,
        detail: result.narrative,
      });
      if (result.improve) {
        logOp({
          op: "improve",
          label: "Linked new entities into prior history",
          status: result.improve.status,
          detail: JSON.stringify(result.improve.body),
        });
      }
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  async function handleSeed() {
    setBusy("seed");
    setError(null);
    try {
      const res = await fetch("/api/patients/seed-demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok && data.seeded === undefined) {
        throw new Error(data.error || `Seeding failed (HTTP ${res.status})`);
      }
      logOp({
        op: "seed",
        label: `Seeded ${data.seeded - data.failed}/${data.seeded} documents across ${
          new Set((data.results as { patient: string }[]).map((r) => r.patient)).size
        } demo patients`,
        status: res.status,
        detail: (data.results as { patient: string; documentType: string; documentDate: string | null }[])
          .map((r) => `${r.patient} · ${r.documentDate ?? "?"} · ${r.documentType}`)
          .join(" — "),
      });
      // A new active patient may have just been set server-side (seed-demo
      // sets it to the first seeded patient) — revalidate every cached SWR
      // key so the patient switcher and every other page re-resolves.
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="wrap flex max-w-4xl flex-col gap-10 py-16">
        <div>
          <p className="eyebrow">Remember</p>
          <h1 className="display d-lg mt-2 text-[var(--ink)]">
            Grow <em>{activePatient?.name ?? "your patient"}&apos;s</em> memory
          </h1>
          <p className="lede mt-3">
            Upload a blood report, prescription, discharge summary, or imaging report.
            Anamnesis extracts the structured clinical entities and adds them to the
            patient's memory graph.
          </p>
        </div>

        {!patientsLoading && patients.length === 0 && (
          <section className="card p-6">
            <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              No patients yet
            </h2>
            <p className="lede mt-1 text-sm">
              Add a patient from the switcher above, or seed two or three synthetic demo patients with approximately three years of records each, including conditions like hypertension, declining kidney function, diabetes, and osteoarthritis, in one call.
            </p>
            <button onClick={handleSeed} disabled={busy !== null} className="btn btn-primary mt-4">
              {busy === "seed" ? "Seeding demo patients…" : "Seed demo patients"}
            </button>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </section>
        )}

        {activePatient && (
          <section className="card p-6">
            <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              Upload a document
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as typeof documentType)}
                className="w-fit rounded border border-[var(--line)] bg-white px-3 py-2 text-sm"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <button
                onClick={handleUpload}
                disabled={!file || busy !== null}
                className="btn btn-primary w-fit"
              >
                {busy === "upload" ? "Extracting & remembering…" : "Upload & remember"}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </section>
        )}

        {results.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              Extracted entities
            </h2>
            {results.map((r, i) => (
              <div key={i} className="card p-5 text-sm">
                <p className="mono text-[var(--pen)]">{r.entities.documentType}{r.entities.documentDate ? ` · ${r.entities.documentDate}` : ""}</p>
                <p className="mt-2 text-[var(--ink-soft)]">{r.entities.summary}</p>
                {r.entities.diagnoses.length > 0 && (
                  <p className="mt-2">
                    <span className="font-medium">Diagnoses: </span>
                    {r.entities.diagnoses.map((d) => d.name).join(", ")}
                  </p>
                )}
                {r.entities.medications.length > 0 && (
                  <p className="mt-1">
                    <span className="font-medium">Medications: </span>
                    {r.entities.medications.map((m) => m.name).join(", ")}
                  </p>
                )}
                {r.entities.labValues.length > 0 && (
                  <p className="mt-1">
                    <span className="font-medium">Lab values: </span>
                    {r.entities.labValues.map((l) => `${l.test} ${l.value}${l.unit ?? ""}`).join(", ")}
                  </p>
                )}
                {r.documentUrl && (
                  <a href={r.documentUrl} target="_blank" rel="noopener noreferrer" className="mono mt-2 block text-xs text-[var(--pen)] underline">
                    view original file
                  </a>
                )}
              </div>
            ))}
            <p className="mono mt-2 text-xs text-[var(--ink-soft)]">
              See the growing memory graph and full document list on the{" "}
              <Link href="/dashboard" className="text-[var(--pen)] underline">
                dashboard
              </Link>
              .
            </p>
          </section>
        )}
    </main>
  );
}
