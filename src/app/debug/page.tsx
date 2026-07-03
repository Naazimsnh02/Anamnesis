"use client";

import Link from "next/link";
import { useState } from "react";

type LogEntry = {
  time: string;
  operation: "health" | "remember" | "recall";
  request: string;
  status: number;
  response: string;
};

export default function DebugPage() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [note, setNote] = useState(
    "Patient started on Lisinopril 10mg for hypertension."
  );
  const [query, setQuery] = useState("What medication was started and why?");
  const [busy, setBusy] = useState<string | null>(null);

  async function run(
    operation: LogEntry["operation"],
    path: string,
    body: object | null,
    requestSummary: string
  ) {
    setBusy(operation);
    try {
      const res = await fetch(path, {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setLog((prev) => [
        {
          time: new Date().toLocaleTimeString(),
          operation,
          request: requestSummary,
          status: res.status,
          response: JSON.stringify(data),
        },
        ...prev,
      ]);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="wrap flex max-w-3xl flex-col gap-8 py-16">
      <div>
        <Link href="/" className="mono text-xs text-[var(--pen)] hover:underline">
          ← Back to site
        </Link>
        <h1 className="display d-lg text-[var(--ink)] mt-3">
          Anamnesis — Cognee connectivity check
        </h1>
        <p className="lede mt-2 text-sm">
          Talks directly to the self-hosted Cognee instance via the API
          routes below. Every call is logged so Cognee's memory
          lifecycle stays visible, not hidden behind the UI.
        </p>
      </div>

      <section className="card p-6 flex flex-col gap-3">
        <button
          onClick={() => run("health", "/api/cognee/health", null, "GET /health")}
          disabled={busy !== null}
          className="btn btn-primary w-fit disabled:opacity-50"
        >
          {busy === "health" ? "Checking..." : "Check Cognee health"}
        </button>
      </section>

      <section className="card p-6 flex flex-col gap-3">
        <label className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">remember()</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-lg border border-[var(--line)] bg-white p-3 text-sm transition hover:border-[var(--pen)] focus:border-[var(--pen)] focus:outline-none"
          rows={2}
        />
        <button
          onClick={() =>
            run("remember", "/api/cognee/remember", { text: note, datasetName: "hello_world" }, note)
          }
          disabled={busy !== null}
          className="btn btn-primary w-fit disabled:opacity-50"
        >
          {busy === "remember" ? "Remembering..." : "Call remember()"}
        </button>
      </section>

      <section className="card p-6 flex flex-col gap-3">
        <label className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">recall()</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-lg border border-[var(--line)] bg-white p-3 text-sm transition hover:border-[var(--pen)] focus:border-[var(--pen)] focus:outline-none"
        />
        <button
          onClick={() =>
            run("recall", "/api/cognee/recall", { query, datasetName: "hello_world" }, query)
          }
          disabled={busy !== null}
          className="btn btn-primary w-fit disabled:opacity-50"
        >
          {busy === "recall" ? "Recalling..." : "Call recall()"}
        </button>
      </section>

      <section className="card p-6">
        <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)] mb-4">
          Cognee operations log
        </h2>
        <div className="flex flex-col gap-3">
          {log.length === 0 && (
            <p className="text-sm text-[var(--ink-faint)]">No calls made yet.</p>
          )}
          {log.map((entry, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--line)] bg-white p-4 text-xs font-mono"
            >
              <div className="mb-1 flex justify-between text-[var(--ink-soft)]">
                <span>
                  [{entry.time}] {entry.operation}() — HTTP {entry.status}
                </span>
              </div>
              <div className="text-[var(--ink)] font-semibold">
                → {entry.request}
              </div>
              <div className="mt-2 break-all text-[var(--ink-soft)] bg-[var(--paper-2)] p-2 rounded border border-[var(--line)]">
                {entry.response}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
