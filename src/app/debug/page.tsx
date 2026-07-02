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
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
        <div>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
            ← Back to site
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-black dark:text-zinc-50">
            Anamnesis — Cognee connectivity check
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Talks directly to the self-hosted Cognee instance via the API
            routes below. Every call is logged so Cognee&apos;s memory
            lifecycle stays visible, not hidden behind the UI.
          </p>
        </div>

        <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <button
            onClick={() => run("health", "/api/cognee/health", null, "GET /health")}
            disabled={busy !== null}
            className="w-fit rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {busy === "health" ? "Checking..." : "Check Cognee health"}
          </button>
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <label className="text-sm font-medium">remember()</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            rows={2}
          />
          <button
            onClick={() =>
              run("remember", "/api/cognee/remember", { text: note, datasetName: "hello_world" }, note)
            }
            disabled={busy !== null}
            className="w-fit rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {busy === "remember" ? "Remembering..." : "Call remember()"}
          </button>
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <label className="text-sm font-medium">recall()</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            onClick={() =>
              run("recall", "/api/cognee/recall", { query, datasetName: "hello_world" }, query)
            }
            disabled={busy !== null}
            className="w-fit rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {busy === "recall" ? "Recalling..." : "Call recall()"}
          </button>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Cognee operations log
          </h2>
          <div className="flex flex-col gap-2">
            {log.length === 0 && (
              <p className="text-sm text-zinc-400">No calls made yet.</p>
            )}
            {log.map((entry, i) => (
              <div
                key={i}
                className="rounded border border-zinc-200 bg-white p-3 text-xs font-mono dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-1 flex justify-between text-zinc-500">
                  <span>
                    [{entry.time}] {entry.operation}() — HTTP {entry.status}
                  </span>
                </div>
                <div className="text-zinc-700 dark:text-zinc-300">
                  → {entry.request}
                </div>
                <div className="mt-1 break-all text-zinc-500">
                  {entry.response}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
