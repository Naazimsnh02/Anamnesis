// Shown while (app)/layout.tsx's server-side auth()/requireOrgContext() work
// (or any page under this group) is in flight, per Next's route-segment
// loading.tsx convention.
export default function AppLoading() {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center">
      <p className="mono text-sm text-[var(--ink-soft)]">Loading…</p>
    </div>
  );
}
