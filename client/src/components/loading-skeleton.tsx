import { Skeleton } from "@/components/ui/skeleton";

/** Shimmer rows for data tables */
export function TableSkeleton({ columns = 6, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center" style={{ animationDelay: `${i * 60}ms` }}>
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton
              key={j}
              className="h-5 flex-1 rounded-md"
              style={{ animationDelay: `${(i * columns + j) * 30}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton card for stat cards */
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </div>
  );
}

/** Dashboard skeleton with stat cards + chart areas */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="lg:col-span-2 h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

/** Generic card skeleton */
export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3 animate-in fade-in duration-300">
      <Skeleton className="h-5 w-32" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: `${70 + Math.random() * 30}%` }} />
      ))}
    </div>
  );
}

/** Page-level skeleton for any data table page */
export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm rounded-lg" />
        <Skeleton className="h-10 w-[160px] rounded-lg" />
        <Skeleton className="h-10 w-[120px] rounded-lg" />
      </div>
      <div className="rounded-xl border bg-card">
        <TableSkeleton />
      </div>
    </div>
  );
}
