"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ExtractedEntities } from "@/lib/gemini";
import { GraphView, type GraphEdge, type GraphNode } from "@/components/GraphView";

const DOCUMENT_TYPES = [
  { value: "blood_report", label: "Blood report" },
  { value: "prescription", label: "Prescription" },
  { value: "discharge_summary", label: "Discharge summary" },
  { value: "imaging_report", label: "Imaging report" },
] as const;

type LogEntry = {
  time: string;
  op: "remember" | "seed" | "improve";
  label: string;
  status: number;
  detail: string;
};

type UploadResult = {
  entities: ExtractedEntities;
  narrative: string;
  documentUrl: string | null;
  cognee: { status: number; body: unknown };
  improve: { status: number; body: unknown } | null;
};

function pushLog(setLog: (fn: (prev: LogEntry[]) => LogEntry[]) => void, entry: LogEntry) {
  setLog((prev) => [entry, ...prev]);
}

export default function RememberPage() {
  const [documentType, setDocumentType] = useState<(typeof DOCUMENT_TYPES)[number]["value"]>(
    "blood_report"
  );
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"upload" | "seed" | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [graphLoading, setGraphLoading] = useState(false);

  async function fetchGraph() {
    setGraphLoading(true);
    try {
      const res = await fetch("/api/cognee/graph");
      const data = await res.json();
      if (res.ok) {
        setGraphNodes(data.nodes ?? []);
        setGraphEdges(data.edges ?? []);
      }
    } finally {
      setGraphLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount to load the current graph
    fetchGraph();
  }, []);

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
      pushLog(setLog, {
        time: new Date().toLocaleTimeString(),
        op: "remember",
        label: `${file.name} (${documentType})`,
        status: result.cognee.status,
        detail: result.narrative,
      });
      if (result.improve) {
        pushLog(setLog, {
          time: new Date().toLocaleTimeString(),
          op: "improve",
          label: "Re-enriched dataset, linking new entities into prior history",
          status: result.improve.status,
          detail: JSON.stringify(result.improve.body),
        });
      }
      setFile(null);
      await fetchGraph();
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
      const res = await fetch("/api/documents/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok && data.seeded === undefined) {
        throw new Error(data.error || `Seeding failed (HTTP ${res.status})`);
      }
      pushLog(setLog, {
        time: new Date().toLocaleTimeString(),
        op: "seed",
        label: `Seeded ${data.seeded - data.failed}/${data.seeded} historical documents`,
        status: res.status,
        detail: (data.results as { documentType: string; documentDate: string | null }[])
          .map((r) => `${r.documentDate ?? "?"} · ${r.documentType}`)
          .join(" — "),
      });
      await fetchGraph();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <main className="wrap flex max-w-4xl flex-col gap-10 py-16">
        <div>
          <div className="flex items-center justify-between">
            <Link href="/" className="mono text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">
              ← Back to site
            </Link>
            <Link href="/assistant" className="mono text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">
              Ask the memory →
            </Link>
          </div>
          <p className="eyebrow mt-4">remember()</p>
          <h1 className="display d-lg mt-2 text-[var(--ink)]">
            Grow <em>Rina Kapoor&apos;s</em> memory
          </h1>
          <p className="lede mt-3 max-w-xl">
            Upload a blood report, prescription, discharge summary, or imaging report. Gemini
            extracts structured clinical entities, then each document is committed to the
            patient&apos;s Cognee memory graph via <span className="mono">remember()</span>.
          </p>
        </div>

        <section className="card p-6">
          <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            Demo continuity
          </h2>
          <p className="lede mt-1 text-sm">
            No history yet? Seed ~3 years of synthetic records (hypertension → declining kidney
            function) in one call.
          </p>
          <button
            onClick={handleSeed}
            disabled={busy !== null}
            className="btn btn-primary mt-4"
          >
            {busy === "seed" ? "Seeding history…" : "Seed patient history"}
          </button>
        </section>

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
              {busy === "upload" ? "Extracting & remembering…" : "Upload & remember()"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>

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
          </section>
        )}

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              Memory graph — {graphNodes.length} entities, {graphEdges.length} relationships
            </h2>
            <button
              onClick={fetchGraph}
              disabled={graphLoading}
              className="mono text-xs text-[var(--pen)] underline disabled:opacity-50"
            >
              {graphLoading ? "refreshing…" : "refresh"}
            </button>
          </div>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Live view of the patient&apos;s Cognee knowledge graph. Grows every time a document is
            remembered and improve() links it into prior history.
          </p>
          <div className="mt-4">
            <GraphView nodes={graphNodes} edges={graphEdges} />
          </div>
        </section>

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
