"use client";

import { AppHeader } from "@/components/AppHeader";
import { OpsLogPanel } from "@/components/OpsLogPanel";
import { OpsLogProvider } from "@/lib/opsLog";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <OpsLogProvider>
      <div className="min-h-screen bg-[var(--paper)]">
        <AppHeader />
        {children}
      </div>
      <OpsLogPanel />
    </OpsLogProvider>
  );
}
