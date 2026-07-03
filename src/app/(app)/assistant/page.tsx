"use client";

import Link from "next/link";
import { useState } from "react";
import { useActivePatient } from "@/lib/useActivePatient";

const SAMPLE_QUESTIONS = [
  "Why is kidney function declining?",
  "When was diabetes first diagnosed?",
  "What changed since the previous consultation?",
  "Which medications caused adverse reactions?",
  "Show all hospital admissions.",
  "Has blood pressure improved over two years?",
  "Which laboratory values have remained abnormal?",
  "What investigations are still pending?",
];

type EvidenceItem = {
  dataId: string;
  chunkId: string;
  snippet: string;
  documentType: string | null;
  documentDate: string | null;
};

type Turn = {
  question: string;
  answer: string;
  evidence: EvidenceItem[];
  source: string | null;
  error?: string;
};

type LogEntry = {
  time: string;
  op: "recall";
  label: string;
  status: number;
  detail: string;
};

export default function AssistantPage() {
  const { activePatient } = useActivePatient();
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setQuestion("");
    try {
      const res = await fetch("/api/cognee/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();

      const turn: Turn = res.ok
        ? {
            question: trimmed,
            answer: data.answer || "No answer returned.",
            evidence: data.evidence ?? [],
            source: data.source ?? null,
          }
        : {
            question: trimmed,
            answer: "",
            evidence: [],
            source: null,
            error: data.error || `Recall failed (HTTP ${res.status})`,
          };

      setTurns((prev) => [turn, ...prev]);
      setLog((prev) => [
        {
          time: new Date().toLocaleTimeString(),
          op: "recall",
          label: trimmed,
          status: res.status,
          detail: res.ok
            ? `${data.evidence?.length ?? 0} evidence chunk(s) · source: ${data.source ?? "?"}`
            : turn.error!,
        },
        ...prev,
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setTurns((prev) => [
        { question: trimmed, answer: "", evidence: [], source: null, error: message },
        ...prev,
      ]);
      setLog((prev) => [
        { time: new Date().toLocaleTimeString(), op: "recall", label: trimmed, status: 0, detail: message },
        ...prev,
      ]);
    } finally {
      setBusy(false);
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
            <Link href="/remember" className="mono text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">
              ← Grow the memory
            </Link>
          </div>
          <p className="eyebrow mt-4">recall()</p>
          <h1 className="display d-lg mt-2 text-[var(--ink)]">
            Ask <em>{activePatient?.name ?? "your patient"}&apos;s</em> memory
          </h1>
          <p className="lede mt-3 max-w-xl">
            Every question runs through Cognee&apos;s <span className="mono">recall()</span> —
            graph traversal plus reasoning over the patient&apos;s connected memory — and returns
            an answer with a traceable evidence chain, not a document search result.
          </p>
        </div>

        <section className="card p-6">
          <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            Sample questions
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                disabled={busy}
                className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--ink)] transition hover:border-[var(--pen)] disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            Ask a question
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
            className="mt-4 flex gap-3"
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Why is kidney function declining?"
              className="flex-1 rounded border border-[var(--line)] bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!question.trim() || busy}
              className="btn btn-primary"
            >
              {busy ? "Recalling…" : "Ask"}
            </button>
          </form>
        </section>

        {turns.length > 0 && (
          <section className="flex flex-col gap-5">
            <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              Answers
            </h2>
            {turns.map((t, i) => (
              <div key={i} className="card p-5">
                <p className="mono text-sm text-[var(--pen)]">Q: {t.question}</p>
                {t.error ? (
                  <p className="mt-3 text-sm text-red-600">{t.error}</p>
                ) : (
                  <>
                    <p className="mt-3 text-[var(--ink)]">{t.answer}</p>
                    {t.evidence.length > 0 && (
                      <div className="mt-4 border-t border-[var(--line)] pt-4">
                        <p className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-faint)]">
                          Evidence chain ({t.evidence.length} node{t.evidence.length === 1 ? "" : "s"} traversed)
                        </p>
                        <ol className="mt-3 flex flex-col gap-2">
                          {t.evidence.map((e, j) => (
                            <li key={e.chunkId} className="mono text-xs text-[var(--ink-soft)]">
                              <span className="text-[var(--ink-faint)]">{j + 1}.</span>{" "}
                              {e.documentType ? (
                                <span className="text-[var(--ink)]">
                                  {e.documentType}
                                  {e.documentDate ? ` · ${e.documentDate}` : ""}
                                </span>
                              ) : (
                                <span className="text-[var(--ink)]">source chunk</span>
                              )}
                              <div className="mt-1 break-all text-[var(--ink-faint)]">
                                &ldquo;{e.snippet}&rdquo;
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {t.source && (
                      <p className="mono mt-3 text-xs text-[var(--ink-faint)]">
                        source: {t.source}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </section>
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
