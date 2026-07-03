import { AssistantSkeleton } from "@/components/Skeleton";

// See dashboard/loading.tsx for why this exists per-route.
export default function AssistantLoading() {
  return (
    <main className="wrap flex max-w-4xl flex-col gap-10 py-16">
      <AssistantSkeleton />
    </main>
  );
}
