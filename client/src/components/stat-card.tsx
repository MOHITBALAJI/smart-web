import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCardSkeleton } from "@/components/loading-skeleton";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: string;            // e.g. "bg-primary/10 text-primary"
  trend?: number;           // optional percentage change
  loading?: boolean;
  className?: string;
}

/** Animated stat card with icon, value, label and optional trend indicator */
export function StatCard({ label, value, icon: Icon, tone = "bg-primary/10 text-primary", trend, loading, className = "" }: StatCardProps) {
  if (loading) return <StatCardSkeleton />;

  return (
    <Card className={`overflow-hidden group hover:shadow-elegant transition-all duration-300 ${className}`}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
          <div className="text-2xl font-bold tabular-nums leading-tight mt-0.5">
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
          {trend !== undefined && (
            <div className={`text-[10px] font-medium mt-0.5 ${trend >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
