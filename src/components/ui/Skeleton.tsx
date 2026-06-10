// ============================================================
// HEBLI – Skeleton Loading Components
// ============================================================

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
      <div className="h-40 rounded-xl bg-white/[0.03]" />
      <div className="mt-4 h-4 w-2/3 rounded bg-white/[0.05]" />
      <div className="mt-2 h-3 w-1/3 rounded bg-white/[0.03]" />
      <div className="mt-3 h-5 w-1/4 rounded bg-white/[0.05]" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
      <div className="h-4 w-1/3 rounded bg-white/[0.05]" />
      <div className="mt-4 h-64 rounded-xl bg-white/[0.03]" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="h-10 w-10 rounded-full bg-white/[0.05]" />
      <div className="flex-1">
        <div className="h-4 w-1/3 rounded bg-white/[0.05]" />
        <div className="mt-1 h-3 w-1/2 rounded bg-white/[0.03]" />
      </div>
      <div className="h-6 w-16 rounded-full bg-white/[0.05]" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
      <div className="h-3 w-1/2 rounded bg-white/[0.05]" />
      <div className="mt-3 h-8 w-2/3 rounded bg-white/[0.05]" />
      <div className="mt-2 h-3 w-1/3 rounded bg-white/[0.03]" />
    </div>
  );
}
