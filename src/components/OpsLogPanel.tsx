"use client";

import { useOpsLog, type OpsLogOp } from "@/lib/opsLog";

const OP_COLOR: Record<OpsLogOp, string> = {
  remember: "var(--pen)",
  improve: "var(--pen)",
  recall: "var(--ink)",
  forget: "var(--ember)",
  seed: "var(--ink-faint)",
};

const OP_LABEL: Record<OpsLogOp, string> = {
  remember: "Remembered",
  improve: "Improved",
  recall: "Recalled",
  forget: "Forgotten",
  seed: "Seeded",
};

export function OpsLogPanel() {
  const { entries, panelOpen, togglePanel } = useOpsLog();

  return (
    <>
      {panelOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--ink)]/20 backdrop-blur-[1px]"
          onClick={togglePanel}
          aria-hidden
        />
      )}
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-lift)] transition-transform duration-300"
        style={{ transform: panelOpen ? "translateX(0)" : "translateX(100%)" }}
        aria-hidden={!panelOpen}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <p className="eyebrow">Memory activity</p>
            <p className="mono mt-1 text-xs text-[var(--ink-faint)]">
              {entries.length} update{entries.length === 1 ? "" : "s"} this session
            </p>
          </div>
          <button
            onClick={togglePanel}
            className="mono text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
            aria-label="Close activity panel"
          >
            close ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {entries.length === 0 ? (
            <p className="text-sm text-[var(--ink-faint)]">No activity yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry) => (
                <div key={entry.id} className="card mono p-3 text-xs">
                  <div className="flex items-center justify-between text-[var(--ink-soft)]">
                    <span style={{ color: OP_COLOR[entry.op] }}>
                      {OP_LABEL[entry.op]}{entry.status >= 400 ? " · failed" : ""}
                    </span>
                    <span className="text-[var(--ink-faint)]">{entry.time}</span>
                  </div>
                  <div className="mt-1 text-[var(--ink)]">→ {entry.label}</div>
                  <div className="mt-1 break-all text-[var(--ink-faint)]">{entry.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
