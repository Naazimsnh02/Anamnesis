"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type OpsLogOp = "remember" | "recall" | "improve" | "forget" | "seed";

export type OpsLogEntry = {
  id: string;
  time: string;
  op: OpsLogOp;
  label: string;
  status: number;
  detail: string;
};

const MAX_ENTRIES = 200;

type OpsLogContextValue = {
  entries: OpsLogEntry[];
  logOp: (entry: Omit<OpsLogEntry, "id" | "time">) => void;
  panelOpen: boolean;
  togglePanel: () => void;
};

const OpsLogContext = createContext<OpsLogContextValue | null>(null);

// Lives in AppShell.tsx, above every (app) page, so the memory activity
// trail persists across client-side navigation between /remember, /assistant,
// and /summary instead of resetting per page — the primary "prove we used
// Cognee deeply" surface per CLAUDE.md.
export function OpsLogProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<OpsLogEntry[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const logOp = useCallback((entry: Omit<OpsLogEntry, "id" | "time">) => {
    setEntries((prev) => {
      const next: OpsLogEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        time: new Date().toLocaleTimeString(),
      };
      return [next, ...prev].slice(0, MAX_ENTRIES);
    });
  }, []);

  const togglePanel = useCallback(() => setPanelOpen((v) => !v), []);

  const value = useMemo(
    () => ({ entries, logOp, panelOpen, togglePanel }),
    [entries, logOp, panelOpen, togglePanel]
  );

  return <OpsLogContext.Provider value={value}>{children}</OpsLogContext.Provider>;
}

export function useOpsLog() {
  const ctx = useContext(OpsLogContext);
  if (!ctx) throw new Error("useOpsLog must be used within an OpsLogProvider");
  return ctx;
}
