// Shown while a root-level server component (e.g. onboarding's auth() call)
// is resolving, per Next's route-segment loading.tsx convention.
export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-black/40">Loading…</p>
    </div>
  );
}
