import { DashboardSkeleton, PageHeaderSkeleton } from "@/components/Skeleton";

// Route-level loading.tsx: shown during client-side navigation into
// /dashboard (before the "use client" page component streams in), so tab
// switches show this instead of (app)/loading.tsx's generic "Loading…" text.
export default function DashboardLoading() {
  return (
    <main className="wrap flex max-w-4xl flex-col gap-10 py-16">
      <PageHeaderSkeleton />
      <DashboardSkeleton />
    </main>
  );
}
