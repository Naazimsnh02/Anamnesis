// Shared skeleton primitives, styled via the .skeleton class in globals.css
// (shimmer animation, paper/line color tokens) so loading states match the
// rest of the design system instead of a generic gray placeholder.

export function SkeletonLine({ width = "100%", className = "" }: { width?: string; className?: string }) {
  return <div className={`skeleton h-4 ${className}`} style={{ width }} />;
}

export function SkeletonCard({
  title,
  rows = 3,
}: {
  title: string;
  rows?: number;
}) {
  return (
    <section className="card p-6">
      <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">{title}</h2>
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded border border-[var(--line)] p-3">
            <SkeletonLine width={`${60 - i * 8}%`} />
            <SkeletonLine width="30%" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <section className="card p-6">
        <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">
          Patient overview
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <SkeletonLine width="40%" className="h-3" />
              <div className="mt-2">
                <SkeletonLine width={i % 2 === 0 ? "70%" : "50%"} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <SkeletonCard title="Active conditions" rows={2} />
      <SkeletonCard title="Current medications" rows={2} />

      <section className="card p-6">
        <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">Timeline</h2>
        <div className="mt-4 flex flex-col gap-3 border-l border-[var(--line)] pl-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <SkeletonLine width="20%" className="h-3" />
              <SkeletonLine width={`${55 - i * 10}%`} />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mono text-xs uppercase tracking-[0.15em] text-[var(--ink-soft)]">Memory graph</h2>
        <div className="skeleton mt-4 h-64 w-full rounded-lg" />
      </section>

      <SkeletonCard title="Documents" rows={2} />
      <SkeletonCard title="History: ruled out and discontinued" rows={2} />
    </div>
  );
}
