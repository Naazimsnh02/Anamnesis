"use client";

import { SWRConfig } from "swr";
import { AppHeader } from "@/components/AppHeader";
import { OpsLogPanel } from "@/components/OpsLogPanel";
import { OpsLogProvider } from "@/lib/opsLog";
import { fetcher } from "@/lib/swrFetcher";

// SWRConfig lives here (not per-page) so its cache survives client-side
// navigation between /remember, /assistant, /summary — AppShell wraps the
// route content but never itself unmounts on nav within the (app) group.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher }}>
      <OpsLogProvider>
        <div className="min-h-screen bg-[var(--paper)]">
          <AppHeader />
          {children}
        </div>
        <OpsLogPanel />
      </OpsLogProvider>
    </SWRConfig>
  );
}
